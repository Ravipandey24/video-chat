import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import VideoPlayer from '@/components/video-player';
import VideoChat from '@/components/video-chat';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }) {
  const videoId = parseInt(params.id);
  
  if (isNaN(videoId)) {
    return {
      title: 'Video Not Found',
      description: 'The requested video could not be found',
    };
  }
  
  const video = await db.query.videos.findFirst({
    where: eq(videos.id, videoId),
  });
  
  if (!video) {
    return {
      title: 'Video Not Found',
      description: 'The requested video could not be found',
    };
  }
  
  return {
    title: `${video.title} - Video Q&A`,
    description: video.description || `Ask questions about ${video.title}`,
  };
}

export default async function VideoPage({ params }: { params: { id: string } }) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/login');
  }
  
  const videoId = parseInt(params.id);
  
  if (isNaN(videoId)) {
    notFound();
  }
  
  // Get the video data
  const video = await db.query.videos.findFirst({
    where: eq(videos.id, videoId),
  });
  
  if (!video) {
    notFound();
  }
  
  // Check if user has access to this video
  // Currently only the owner can access their videos
  // You might want to change this if you implement sharing functionality
  if (video.userId !== session.user.id) {
    // Not the owner of the video
    redirect('/dashboard');
  }
  
  // Format the creation date
  const formattedDate = video.createdAt 
    ? formatDistanceToNow(video.createdAt, { addSuffix: true })
    : 'recently';
  
  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{video.title}</h1>
        {video.description && (
          <p className="text-muted-foreground">{video.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Uploaded {formattedDate}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video player column */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <VideoPlayer 
              src={video.url} 
              title={video.title} 
              className="rounded-lg overflow-hidden shadow-md"
            />
          </div>
        </div>
        
        {/* Chat interface column */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg overflow-hidden shadow-sm bg-card h-[600px] flex flex-col">
            <div className="p-4 border-b bg-muted/40">
              <h2 className="font-semibold">Ask about this video</h2>
              <p className="text-sm text-muted-foreground">
                Chat with AI about what's happening in the video
              </p>
            </div>
            
            <Suspense fallback={
              <div className="flex-1 p-4 flex flex-col items-center justify-center">
                <Skeleton className="h-8 w-8 rounded-full mb-4" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            }>
              <VideoChat videoId={video.id} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}