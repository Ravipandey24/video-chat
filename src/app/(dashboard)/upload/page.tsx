import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import VideoUploader from "@/components/video-uploader";

export const metadata = {
  title: "Upload Video - Video Q&A",
  description: "Upload and process a new video for Q&A interactions",
};

export default async function UploadPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Video</h1>
        <p className="text-muted-foreground">
          Upload a video to start asking questions about its content.
          After processing, you'll be able to chat with an AI about what's happening in the video.
        </p>
      </div>
      
      <VideoUploader />
      
      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <h3 className="font-medium text-base">Tips for better results:</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Upload videos with clear visuals for better analysis</li>
          <li>Keep videos under 10 minutes for optimal processing</li>
          <li>Supported formats: MP4, MOV, WebM</li>
          <li>Maximum file size: 50MB</li>
          <li>Processing can take a few minutes depending on video length</li>
        </ul>
      </div>
    </div>
  );
}