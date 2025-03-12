import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, conversations } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get videoId from query params
    const url = new URL(req.url);
    const videoId = url.searchParams.get("videoId");
    
    if (!videoId) {
      return new NextResponse("Missing videoId parameter", { status: 400 });
    }

    // Find conversation for this video
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.videoId, parseInt(videoId)),
          eq(conversations.userId, session.user.id)
        )
      )
      .limit(1);

    if (!conversation) {
      // No conversation yet, return empty array
      return NextResponse.json([]);
    }

    // Get messages for this conversation
    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(asc(messages.createdAt));

    // Map to a simpler format for the client
    const formattedMessages = chatMessages.map(msg => ({
      id: msg.id.toString(),
      content: msg.content,
      role: msg.role,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}