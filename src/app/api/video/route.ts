import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';

/**
 * POST /api/video
 * Creates a new video record in the database
 * Body: { title, description, url, thumbnailUrl, frameUrls }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { title, description, url, thumbnailUrl, frameUrls } = await req.json();
    
    if (!title || !url) {
      return new NextResponse('Missing required fields', { status: 400 });
    }
    
    // Save video metadata to database
    const [video] = await db
      .insert(videos)
      .values({
        title,
        description: description || null,
        url,
        thumbnailUrl: thumbnailUrl || null,
        frameUrls,
        userId: session.user.id,
        isProcessed: true, // Mark as processed since we've extracted frames
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      videoId: video.id,
    });
    
  } catch (error) {
    console.error('Video API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * GET /api/video
 * GET /api/video?id=123
 * Retrieves all videos or a specific video if ID is provided
 */
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/video');
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if id is provided in query parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      // Get specific video by ID
      const videoId = parseInt(id);
      if (isNaN(videoId)) {
        return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
      }

      const video = await db.query.videos.findFirst({
        where: eq(videos.id, videoId),
      });
      
      if (!video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }
      
      // Check if the video belongs to the current user
      if (video.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      
      return NextResponse.json(video);
    } else {
      // Get all videos for the current user
      const userVideos = await db.query.videos.findMany({
        where: eq(videos.userId, session.user.id),
        orderBy: (videos, { desc }) => [desc(videos.createdAt)],
      });
      
      return NextResponse.json(userVideos);
    }
    
  } catch (error) {
    console.error('Video API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


/**
 * DELETE /api/video/:id
 * Deletes a specific video by ID
 */
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new NextResponse('Missing video ID', { status: 400 });
    }

    const videoId = parseInt(id);
    if (isNaN(videoId)) {
      return new NextResponse('Invalid video ID', { status: 400 });
    }

    // Get video to check ownership
    const video = await db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });
    
    if (!video) {
      return new NextResponse('Video not found', { status: 404 });
    }
    
    // Check if the video belongs to the current user
    if (video.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 403 });
    }
    
    // Delete video from database
    await db.delete(videos).where(eq(videos.id, videoId));
    
    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
    
  } catch (error) {
    console.error('Video API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract id from query parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    const videoId = parseInt(id);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    // Check if video exists and belongs to the user
    const existingVideo = await db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });

    if (!existingVideo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    
    // Check if the video belongs to the current user
    if (existingVideo.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get update data
    const updates = await req.json();
    
    // Update only allowed fields
    const allowedFields = ["title", "description", "thumbnailUrl", "frameUrls"];
    const filteredUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Update video
    const [updatedVideo] = await db
      .update(videos)
      .set(filteredUpdates)
      .where(eq(videos.id, videoId))
      .returning();

    return NextResponse.json({
      message: "Video updated successfully",
      video: updatedVideo,
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}