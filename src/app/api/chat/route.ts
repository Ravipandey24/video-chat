import { NextRequest, NextResponse } from "next/server";
import { Message as AIMessage } from "ai";
import { OpenAI } from "openai";
import { db } from "@/lib/db";
import { messages, conversations, videos } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { eq, and, desc } from "drizzle-orm";
import { authOptions } from "@/lib/auth";

// Create AI SDK OpenAI client (this is different from the direct OpenAI client)
const openai = new OpenAI({
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
      const userMessages = messageHistory
        .filter(m => m.role === 'user');
      
      if (userMessages.length > 0) {
        currentMessage = userMessages[userMessages.length - 1].content;
      }
    }

    if (!videoId || !currentMessage) {
      console.error("Invalid request:", { videoId, message: currentMessage, body });
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get video data including frame URLs
    const video = await db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });

    if (
      !video ||
      !video.frameUrls ||
      (video.frameUrls as string[]).length === 0
    ) {
      return new NextResponse("Video not found or frames not available", {
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
    // Get more messages (up to 10) for better context
    const dbMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(desc(messages.createdAt))
      .limit(10);
    
    // Reverse to get chronological order
    const prevMessages = dbMessages.reverse();

    // Create content array with frames for visual context
    const frameUrls = video.frameUrls as string[];
    
    // Select frames based on video length
    const selectedFrames = selectRelevantFrames(frameUrls);
    
    // Build message history for OpenAI
    // If we have message history from AI SDK, use that
    // Otherwise build from database messages
    const chatHistory = messageHistory.length > 0 
      ? buildMessageHistoryFromAISDK(messageHistory)
      : buildMessageHistoryFromDB(prevMessages);
    
    // Create the vision request with both frames and the latest question
    const visionRequest = createVisionRequest(currentMessage, selectedFrames, video.title);
    
    // Complete messages array for OpenAI
    const completeMessages = [
      createSystemMessage(video.title, video.description),
      ...chatHistory,
      visionRequest
    ];

    // Using the AI SDK's streaming pattern
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: completeMessages,
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    });

    let fullResponse = '';
    
    // Use Response.json pattern with streams
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          for await (const chunk of response) {
            // Extract the content delta
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
              fullResponse += content;
            }
          }
          
          // Save the complete response to database
          await db.insert(messages).values({
            conversationId: conversation.id,
            content: fullResponse,
            role: "assistant",
          });
          
          controller.close();
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Helper function to select relevant frames from the video
function selectRelevantFrames(frameUrls: string[], maxFrames = 6): string[] {
  if (!frameUrls || frameUrls.length === 0) return [];
  
  const frameCount = frameUrls.length;
  const selectedFrames: string[] = [];

  if (frameCount <= maxFrames) {
    // If we have fewer frames than our max, use all of them
    selectedFrames.push(...frameUrls);
  } else {
    // Pick evenly spaced frames
    const step = Math.floor(frameCount / maxFrames);
    for (let i = 0; i < maxFrames; i++) {
      const index = i * step;
      if (index < frameCount) {
        selectedFrames.push(frameUrls[index]);
      }
    }
  }
  
  return selectedFrames;
}

// Helper function to build message history from AI SDK format
function buildMessageHistoryFromAISDK(messages: AIMessage[]) {
  // Exclude the last user message as it will be combined with the vision request
  return messages.slice(0, -1).map(msg => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));
}

// Helper function to build message history from database records
function buildMessageHistoryFromDB(messages: any[]) {
  // Exclude the last message (which is the current user question)
  return messages.slice(0, -1).map(msg => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));
}

// Helper function to create the system message
function createSystemMessage(videoTitle: string, videoDescription?: string | null) {
  let systemPrompt = `You are a helpful assistant that answers questions about videos. The user is asking about the video titled "${videoTitle}".`;
  
  if (videoDescription) {
    systemPrompt += ` The video description is: "${videoDescription}".`;
  }
  
  systemPrompt += ` You're seeing key frames from this video. Provide accurate, concise answers based on what you can see in these frames. If the answer isn't visible in the frames, say so politely.`;
  
  return {
    role: "system" as const,
    content: systemPrompt,
  };
}

// Helper function to create the vision request with images
function createVisionRequest(message: string, frameUrls: string[], videoTitle: string) {
  const contentArray = [
    { type: "text" as const, text: `Question about the video "${videoTitle}": ${message}` },
    ...frameUrls.map((frameUrl) => ({
      type: "image_url" as const,
      image_url: {
        url: frameUrl,
        detail: "low" as const,
      },
    })),
  ];
  
  return {
    role: "user" as const,
    content: contentArray,
  };
}