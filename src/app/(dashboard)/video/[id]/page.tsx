import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import VideoPlayer from '@/components/video-player';
import VideoChat from '@/components/video-chat';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from 'date-fns';
import { CalendarIcon, PlayCircleIcon, MessageSquareIcon } from 'lucide-react';
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";

// Generate metadata for the page
export const metadata = {
  title: "Video - Video Q&A",
  description: "Watch and interact with your uploaded video",
};

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/login');
  }
  const awaitParams = await params;
  const videoId = parseInt(awaitParams.id);
  
  if (isNaN(videoId)) {
    notFound();
  }
  
  // Get the video data
  const video = await db.query.videos.findFirst({
    where: and(eq(videos.id, videoId), eq(videos.userId, session.user.id), eq(videos.isRemoved, false)),
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
    <div className="container mx-auto max-w-6xl px-4 py-2 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight mb-3">{video.title}</h1>
          {video.description && (
            <p className="text-muted-foreground mb-3">{video.description}</p>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>Uploaded {formattedDate}</span>
          </div>
        </div>
        
        <div className="md:w-[250px] lg:w-[200px] shrink-0">
          <HeroVideoDialog
            animationStyle="top-in-bottom-out"
            videoSrc={video.url}
            thumbnailSrc={video.thumbnailUrl || "https://placehold.co/1280x720/333/white?text=Video"}
            thumbnailAlt={video.title}
          />
        </div>
      </div>
      
      <Separator className="my-2" />
      
      {/* Chat interface with full height */}
      <div className="h-[calc(100vh-320px)] overflow-hidden rounded-lg">
        <Suspense fallback={
          <div className="flex-1 p-4 flex flex-col items-center justify-center h-full">
            <Skeleton className="h-8 w-8 rounded-full mb-4" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        }>
          <VideoChat videoId={video.id} />
        </Suspense>
      </div>
    </div>
  );
}