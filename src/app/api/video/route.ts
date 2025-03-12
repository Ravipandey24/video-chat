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
    
    if (!title || !url || !frameUrls || frameUrls.length === 0) {
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
 * Retrieves all videos for the current user
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get all videos for the current user
    const userVideos = await db.query.videos.findMany({
      where: eq(videos.userId, session.user.id),
      orderBy: (videos, { desc }) => [desc(videos.createdAt)],
    });
    
    return NextResponse.json(userVideos);
    
  } catch (error) {
    console.error('Video API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * GET /api/video/:id
 * Retrieves a specific video by ID
 */
export async function GET_ONE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const videoId = parseInt(params.id);
    if (isNaN(videoId)) {
      return new NextResponse('Invalid video ID', { status: 400 });
    }

    // Get video by ID
    const video = await db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });
    
    if (!video) {
      return new NextResponse('Video not found', { status: 404 });
    }
    
    // Check if the video belongs to the current user
    // You might want to allow other users to view videos as well
    if (video.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 403 });
    }
    
    return NextResponse.json(video);
    
  } catch (error) {
    console.error('Video API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
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