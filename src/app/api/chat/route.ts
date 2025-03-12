import { NextRequest, NextResponse } from "next/server";
import { Message as AIMessage } from "ai";
import { OpenAI } from "openai";
import { db } from "@/lib/db";
import {
  messages,
  conversations,
  videos,
  frameAnalyses,
} from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { eq, and, desc, asc } from "drizzle-orm";
import { authOptions } from "@/lib/auth";

// Configure client for text model only - we don't need vision model anymore
const textModelClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Support both direct API calls and AI SDK format
    const videoId = body.videoId;

    // Extract message from either format
    let currentMessage = body.message;
    let messageHistory: AIMessage[] = [];

    // If using AI SDK format with messages array
    if (body.messages && Array.isArray(body.messages)) {
      messageHistory = body.messages;

      // Get the most recent user message
      const userMessages = messageHistory.filter((m) => m.role === "user");

      if (userMessages.length > 0) {
        currentMessage = userMessages[userMessages.length - 1].content;
      }
    }

    if (!videoId || !currentMessage) {
      console.error("Invalid request:", {
        videoId,
        message: currentMessage,
        body,
      });
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get video data (without relying on frameUrls)
    const video = await db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });
    console.log("Video data:", video);

    if (!video) {
      return new NextResponse("Video not found", {
        status: 404,
      });
    }

    // Find or create conversation
    let [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.videoId, videoId),
          eq(conversations.userId, session.user.id)
        )
      )
      .limit(1);

    if (!conversation) {
      const [newConversation] = await db
        .insert(conversations)
        .values({
          videoId,
          userId: session.user.id,
        })
        .returning();
      conversation = newConversation;
    }

    // Save the current user message to the database
    await db.insert(messages).values({
      conversationId: conversation.id,
      content: currentMessage,
      role: "user",
    });

    // Get previous messages for context
    const dbMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(desc(messages.createdAt))
      .limit(10);

    // Reverse to get chronological order
    const prevMessages = dbMessages.reverse();

    // Build message history for final LLM context
    const chatHistory =
      messageHistory.length > 0
        ? buildMessageHistoryFromAISDK(messageHistory)
        : buildMessageHistoryFromDB(prevMessages);

    // Fetch ALL frame analyses for this video directly from the database ordered by position
    console.log("Fetching frame analyses from database for video", videoId);
    const frameAnalysesData = await db.query.frameAnalyses.findMany({
      where: eq(frameAnalyses.videoId, videoId),
      orderBy: [asc(frameAnalyses.position)],
    });
    
    console.log(`Found ${frameAnalysesData.length} frame analyses in database`);

    // If we have no analyses at all, return an error
    if (frameAnalysesData.length === 0) {
      return new NextResponse("No frame analyses available for this video", {
        status: 408,
      });
    }

    // Format all frame descriptions into a single string
    const consolidatedFrameInfo = formatFrameDescriptions(frameAnalysesData);

    // Create system message with enhanced context including frame descriptions
    const enhancedSystemMessage = {
      role: "system" as const,
      content: `You are a helpful assistant that answers questions about videos. The user is asking about the video titled "${
        video.title
      }".
${video.description ? `The video description is: "${video.description}".` : ""}

I have analyzed the key frames from this video and will provide detailed descriptions of what I can see:

${consolidatedFrameInfo}

When answering the user's question:
1. Use specific information from the frame descriptions to support your answers
2. Reference visual elements mentioned in the descriptions
3. If the frame descriptions don't contain information relevant to the question, explain what information is available and what might be missing
4. Keep responses concise and focused on the question`,
    };

    // Complete messages array for the text-based LLM model
    const completeMessages = [
      enhancedSystemMessage,
      ...chatHistory,
      {
        role: "user" as const,
        content: currentMessage,
      },
    ];

    // Use text-based LLM for the final response
    const response = await textModelClient.chat.completions.create({
      model: "gpt-4o-mini", // Using text-based model
      messages: completeMessages,
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    });

    // Return streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          try {
            // Generate a consistent ID for all chunks in this response
            const responseId = `chatcmpl-${Date.now()}`;
            let fullResponse = "";

            // Send the initial role chunk - this follows AI SDK expectations
            const initialChunk = {
              id: responseId,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: "gpt-4o-mini",
              choices: [
                {
                  index: 0,
                  delta: {
                    role: "assistant",
                  },
                  finish_reason: null,
                },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(initialChunk)}\n\n`)
            );

            for await (const chunk of response) {
              if (chunk.choices?.[0]?.delta?.content) {
                const content = chunk.choices[0].delta.content;

                // Format chunk to match OpenAI's streaming format
                const formattedChunk = {
                  id: responseId,
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: "gpt-4o-mini",
                  choices: [
                    {
                      index: 0,
                      delta: {
                        content: content,
                      },
                      finish_reason: null,
                    },
                  ],
                };

                // Send the chunk to the client
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(formattedChunk)}\n\n`)
                );
                fullResponse += content;
              }
            }

            // Send the final closing chunk (with empty delta and finish_reason)
            const finalChunk = {
              id: responseId,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: "gpt-4o-mini",
              choices: [
                {
                  index: 0,
                  delta: {},
                  finish_reason: "stop",
                },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(finalChunk)}\n\n`)
            );

            // Send the DONE marker for compatibility
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));

            // Save to database
            if (fullResponse) {
              await db.insert(messages).values({
                conversationId: conversation.id,
                content: fullResponse,
                role: "assistant",
              });
            }
          } catch (error) {
            console.error("Streaming error:", error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: "Error generating response",
                })}\n\n`
              )
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Format frame descriptions into a single string, using position value from DB
function formatFrameDescriptions(frameAnalysesData: any[]): string {
  return frameAnalysesData
    .map((analysis) => {
      // Use the actual position value from the database, adding 1 for human-readable numbering
      return `Frame ${analysis.position + 1}: ${analysis.description.trim()}`;
    })
    .join("\n\n");
}

// Helper function to build message history from AI SDK format
function buildMessageHistoryFromAISDK(messages: AIMessage[]) {
  // Exclude the last user message as it will be handled separately
  return messages.slice(0, -1).map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));
}

// Helper function to build message history from database records
function buildMessageHistoryFromDB(messages: any[]) {
  // Exclude the last message (which is the current user question)
  return messages.slice(0, -1).map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));
}