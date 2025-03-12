import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Video, Upload, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Dashboard - Video Q&A",
  description: "View and manage your uploaded videos",
};

export default async function DashboardPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  // Fetch user's videos
  const userVideos = await db.query.videos.findMany({
    where: and(eq(videos.userId, session.user.id), eq(videos.isRemoved, false)),
    orderBy: (videos, { desc }) => [desc(videos.createdAt)],
  });

  return (
    <div className="p-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Your Videos</h1>
        <Link href="/upload">
          <Button className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload New Video
          </Button>
        </Link>
      </div>

      {userVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/30">
          <div className="rounded-full bg-background p-3 mb-4">
            <Video className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium mb-2">No videos yet</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            Upload your first video to start asking questions and getting
            insights.
          </p>
          <Link href="/upload">
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Your First Video
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {userVideos.map((video) => (
            <Link
              key={video.id}
              href={`/video/${video.id}`}
              className="group overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md"
            >
              <div className="aspect-video relative overflow-hidden bg-muted">
                {video.thumbnailUrl ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Video className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {video.isProcessed ? (
                  <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Ready
                  </div>
                ) : (
                  <div className="absolute bottom-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Processing
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                    {video.description}
                  </p>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  {video.createdAt && (
                    <>Uploaded {formatDistanceToNow(video.createdAt)} ago</>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
