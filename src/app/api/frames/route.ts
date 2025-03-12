import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "@/lib/db";
import { frameAnalyses, videos } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";

// Configure vision model client
const visionModelClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { frameUrl, videoId, position } = body;

    if (!frameUrl || videoId === undefined || position === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the video exists and belongs to the user
    const video = await db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check if analysis already exists for this frame
    const existingAnalysis = await db.query.frameAnalyses.findFirst({
      where: (frameAnalyses) =>
        and(
          eq(frameAnalyses.frameUrl, frameUrl),
          eq(frameAnalyses.position, position),
          eq(frameAnalyses.videoId, videoId)
        ),
    });

    if (existingAnalysis) {
      return NextResponse.json({
        message: "Frame analysis already exists",
        analysis: existingAnalysis,
      });
    }

    // Process the frame with vision model
    try {
      const response = await visionModelClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a descriptive assistant that provides detailed observations of video frames. Describe what you see in this frame from the video with specific details about objects, people, actions, text, and setting. Be concise but complete.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Describe this frame from the video "${video.title}" in detail.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: frameUrl,
                  detail: "low",
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const description =
        response.choices[0]?.message?.content || "No description available";

      // Save analysis to database
      const [newAnalysis] = await db
        .insert(frameAnalyses)
        .values({
          frameUrl,
          description,
          position,
          videoId,
        })
        .returning();

      return NextResponse.json({
        message: "Frame processed successfully",
        analysis: newAnalysis,
      });
    } catch (error: any) {
      console.error("Error processing frame:", error);

      // Save error analysis to avoid reprocessing
      const [errorAnalysis] = await db
        .insert(frameAnalyses)
        .values({
          frameUrl,
          description: "[Error processing frame]",
          position,
          videoId,
        })
        .returning();

      return NextResponse.json(
        {
          message: "Error processing frame",
          error: error.message,
          analysis: errorAnalysis,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
