"use client";

import { useState, useRef, ChangeEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Upload, X, Info, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_FILE_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_DURATION = 600; // 10 minutes in seconds
const MAX_FRAMES = 300; // Maximum number of frames to extract (cap at 5 minutes worth)

export default function VideoUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [analyzedFrames, setAnalyzedFrames] = useState(0);
  const [processedFrameUrls] = useState(new Set<string>());

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const supabase = createClientComponentClient();
  const router = useRouter();

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    setError(null);
    setVideoPreviewUrl(null);
    setVideoDuration(null);

    if (!selectedFile) return;

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(
        `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
      );
      return;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError("Invalid file type. Supported formats: MP4, MOV, WebM.");
      return;
    }

    // Create temporary URL for video preview and validation
    const objectUrl = URL.createObjectURL(selectedFile);
    setVideoPreviewUrl(objectUrl);

    // Create a temporary video element to check duration
    const video = document.createElement("video");
    video.onloadedmetadata = () => {
      if (video.duration > MAX_DURATION) {
        setError(
          `Video too long. Maximum duration is ${MAX_DURATION / 60} minutes.`
        );
        URL.revokeObjectURL(objectUrl);
        setVideoPreviewUrl(null);
        return;
      }

      setVideoDuration(video.duration);
      setFile(selectedFile);

      // Suggest a title based on the filename (remove extension and replace dashes/underscores with spaces)
      const fileName = selectedFile.name.split(".").slice(0, -1).join(".");
      const suggestedTitle = fileName
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      if (!title) {
        setTitle(suggestedTitle);
      }
    };

    video.onerror = () => {
      setError("The selected file is not a valid video.");
      URL.revokeObjectURL(objectUrl);
      setVideoPreviewUrl(null);
    };

    video.src = objectUrl;
  };

  // Trigger file input click
  const handleSelectFile = () => {
    inputFileRef.current?.click();
  };

  // Clear selected file
  const handleClearFile = () => {
    setFile(null);
    setVideoPreviewUrl(null);
    setVideoDuration(null);
    if (inputFileRef.current) inputFileRef.current.value = "";
  };

  // Extract frames from video at adaptive intervals
  const extractFrames = async (
    videoFile: File,
    maxFrameCount: number = MAX_FRAMES
  ): Promise<Blob[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const frames: Blob[] = [];

      video.onloadedmetadata = async () => {
        const duration = video.duration;

        // Calculate how many frames to extract with adaptive sampling
        let framePositions: number[] = [];
        let second = 0;

        while (second < duration && framePositions.length < maxFrameCount) {
          framePositions.push(second);

          if (second < 60) {
            // First minute: every second
            second += 1;
          } else if (second < 300) {
            // 1-5 minutes: every 2 seconds
            second += 2;
          } else {
            // Beyond 5 minutes: every 5 seconds
            second += 5;
          }
        }

        // Set canvas dimensions (resize if needed for efficiency)
        const MAX_DIMENSION = 720; // Cap resolution for efficiency
        let scaleFactor = 1;

        if (
          video.videoWidth > MAX_DIMENSION ||
          video.videoHeight > MAX_DIMENSION
        ) {
          scaleFactor = Math.min(
            MAX_DIMENSION / video.videoWidth,
            MAX_DIMENSION / video.videoHeight
          );
        }

        canvas.width = Math.round(video.videoWidth * scaleFactor);
        canvas.height = Math.round(video.videoHeight * scaleFactor);

        // Extract frames at calculated positions
        for (let i = 0; i < framePositions.length; i++) {
          const position = framePositions[i];
          video.currentTime = position;

          await new Promise((resolve) => {
            video.onseeked = () => {
              if (context) {
                // Draw the video frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert canvas to blob
                canvas.toBlob(
                  (blob) => {
                    if (blob) frames.push(blob);
                    resolve(null);
                  },
                  "image/jpeg",
                  0.75
                ); // JPEG at 75% quality for better compression
              } else {
                resolve(null);
              }
            };
          });

          // Update progress indication
          setProcessingStep(
            `Extracting frame ${i + 1}/${
              framePositions.length
            } (${position.toFixed(1)}s)`
          );
          setProgress(Math.round(((i + 1) / framePositions.length) * 30)); // First 30% of progress
        }

        // Clean up
        URL.revokeObjectURL(video.src);
        resolve(frames);
      };

      video.onerror = (e) => reject(e);
      video.src = URL.createObjectURL(videoFile);
    });
  };

  // Process a frame for analysis with proper position tracking
  const processFrame = async (
    frameUrl: string,
    videoId: number,
    position: number,
    filename: string
  ): Promise<void> => {
    try {
      // Check if the frame has already been sent for processing
      if (processedFrameUrls.has(frameUrl)) {
        console.log(
          `Frame already being processed, skipping: ${frameUrl} (position: ${position})`
        );
        return;
      }

      // Mark as being processed to prevent duplicate requests
      processedFrameUrls.add(frameUrl);

      console.log(`Processing frame at position ${position}: ${filename}`);

      const response = await fetch("/api/frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frameUrl,
          videoId,
          position,
        }),
      });

      if (response.ok) {
        setAnalyzedFrames((prev) => prev + 1);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          `Frame analysis API error for position ${position}:`,
          errorData
        );
      }
    } catch (error) {
      console.error(`Frame analysis error for position ${position}:`, error);
    }
  };

  // Format seconds as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title) {
      setError("Please select a file and provide a title.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setAnalyzedFrames(0);
    processedFrameUrls.clear(); // Clear the processed frames set

    let thumbnailSet = false; // Track if thumbnail has been set

    try {
      // 1. Extract frames from the video at adaptive intervals
      setProcessingStep("Preparing to extract frames...");
      const frames = await extractFrames(file);

      // 2. Generate unique filename for the video
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      // 3. Generate unique filenames for the frames with timestamp information
      const frameFileNames = frames.map((_, index) => {
        // Calculate the timestamp based on the adaptive sampling logic
        let timestamp;
        if (index < 60) {
          timestamp = index;
        } else if (index < 180) {
          timestamp = 60 + (index - 60) * 2;
        } else {
          timestamp = 300 + (index - 180) * 5;
        }
        return `frames/${fileName.replace(
          `.${fileExt}`,
          ""
        )}-${timestamp}s.jpg`;
      });

      // 4. Upload the video to Supabase Storage
      setProcessingStep("Uploading video...");

      // For large files, check if we need to use chunked upload
      if (file.size > 50 * 1024 * 1024) {
        setProcessingStep("Preparing chunked upload for large video file...");
      }

      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      setProgress(60); // progress manually updated since onUploadProgress is not supported

      if (videoError) {
        console.error("Storage error details:", videoError);

        if (videoError.message.includes("exceeded the maximum allowed size")) {
          throw new Error(
            "File size exceeded Supabase storage limits. Please try a smaller video or contact support."
          );
        } else if (
          videoError.message.includes(
            "new row violates row-level security policy"
          ) ||
          videoError.message.includes("security policy")
        ) {
          throw new Error(
            "Permission denied: You may need to sign in again or check storage bucket permissions"
          );
        } else {
          throw new Error(`Video upload error: ${videoError.message}`);
        }
      }

      // Get video public URL
      const {
        data: { publicUrl: videoUrl },
      } = supabase.storage.from("videos").getPublicUrl(filePath);

      // 5. Create video entry in database to get videoId for frame processing
      setProcessingStep("Creating video record...");
      const videoResponse = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          url: videoUrl,
          thumbnailUrl: null, // Will be updated after the first frame is uploaded
          frameUrls: [], // Will be populated progressively
          duration: videoDuration,
        }),
      });

      if (!videoResponse.ok) {
        const data = await videoResponse.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create video record");
      }

      const videoData = await videoResponse.json();
      const videoId = videoData.videoId;

      // 6. Upload extracted frames to Supabase Storage
      setProcessingStep(`Uploading ${frames.length} frames...`);

      // Create arrays to track frames with their position information
      const frameUrlsByPosition = Array(frames.length).fill(null); // Pre-allocate array with positions
      const frameAnalysisPromises: Promise<void>[] = [];
      const positionToFilename = new Map<number, string>(); // Map position to filename for debugging

      // To optimize performance, upload frames in batches
      const BATCH_SIZE = 5;
      const batches = Math.ceil(frames.length / BATCH_SIZE);

      for (let batch = 0; batch < batches; batch++) {
        const startIdx = batch * BATCH_SIZE;
        const endIdx = Math.min(startIdx + BATCH_SIZE, frames.length);
        const batchFrames = frames.slice(startIdx, endIdx);
        const batchFilenames = frameFileNames.slice(startIdx, endIdx);

        console.log(
          `Processing batch ${
            batch + 1
          }/${batches} - positions ${startIdx} to ${endIdx - 1}`
        );

        // Upload frames in this batch concurrently
        const uploadPromises = batchFrames.map((frameBlob, i) => {
          const position = startIdx + i; // The absolute position in the frames array
          const filename = batchFilenames[i];
          positionToFilename.set(position, filename); // Store for debugging

          return supabase.storage
            .from("frames")
            .upload(filename, frameBlob, {
              cacheControl: "3600",
              upsert: false,
            })
            .then((result: any) => {
              return { ...result, filename, position };
            });
        });

        const results = await Promise.all(uploadPromises);

        // Process each uploaded frame
        for (let i = 0; i < results.length; i++) {
          const { error: frameError, data, filename, position } = results[i];

          if (frameError) {
            console.error(
              `Frame upload error for ${filename} at position ${position}:`,
              frameError
            );

            if (
              frameError.message.includes(
                "new row violates row-level security policy"
              ) ||
              frameError.message.includes("security policy")
            ) {
              throw new Error("Permission denied when uploading frames");
            } else if (
              frameError.message.includes("The resource already exists")
            ) {
              // If the frame already exists, get its URL but don't throw an error
              console.log(
                `Frame ${filename} at position ${position} already exists, getting URL...`
              );
            } else {
              throw new Error(`Frame upload error: ${frameError.message}`);
            }
          }

          // Get public URL for the frame
          const {
            data: { publicUrl },
          } = supabase.storage.from("frames").getPublicUrl(filename);

          // Store URL at the correct position in our array
          frameUrlsByPosition[position] = publicUrl;

          // Set first frame as thumbnail if not set
          if (position === 0 || (!thumbnailSet && frameUrlsByPosition[0])) {
            const thumbnailUrl =
              position === 0 ? publicUrl : frameUrlsByPosition[0];
            // Update video record with thumbnail
            await fetch(`/api/video?id=${videoId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ thumbnailUrl }),
            });
            thumbnailSet = true;
          }

          // Store the promise for later resolution with correct position and filename
          const analysisPromise = processFrame(
            publicUrl,
            videoId,
            position,
            filename
          );
          frameAnalysisPromises.push(analysisPromise);
        }

        // Update progress (60% to 75%, divided by batches)
        const batchProgress = 60 + Math.round(((batch + 1) / batches) * 15);
        setProgress(batchProgress);

        // Count non-null values for accurate reporting
        const uploadedCount = frameUrlsByPosition.filter(
          (url) => url !== null
        ).length;

        // Update frame count in UI
        setProcessingStep(
          `Uploaded frames batch ${batch + 1}/${batches} (${uploadedCount}/${
            frames.length
          } frames)`
        );

        // Periodically update the video record with the latest frameUrls
        if (batch % 2 === 0 || batch === batches - 1) {
          // Filter out any null entries before sending
          const validFrameUrls = frameUrlsByPosition.filter(
            (url) => url !== null
          );

          console.log(
            `Updating video record with ${
              validFrameUrls.length
            } frame URLs (batch ${batch + 1}/${batches})`
          );

          // Save frameUrls after each batch to ensure they're stored even if process fails later
          await fetch(`/api/video?id=${videoId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frameUrls: validFrameUrls }),
          });
        }
      }

      // Filter out any null entries before final processing
      const finalFrameUrls = frameUrlsByPosition.filter((url) => url !== null);

      console.log(`Total frames to analyze: ${finalFrameUrls.length}`);

      // Wait for all frame analyses to complete
      setProcessingStep(`Analyzing ${finalFrameUrls.length} frames...`);
      setProgress(75);

      // Process frames in batches to avoid overwhelming the API
      const ANALYSIS_BATCH_SIZE = 10;
      const analysisBatches = Math.ceil(
        frameAnalysisPromises.length / ANALYSIS_BATCH_SIZE
      );

      for (let i = 0; i < analysisBatches; i++) {
        const start = i * ANALYSIS_BATCH_SIZE;
        const end = Math.min(
          start + ANALYSIS_BATCH_SIZE,
          frameAnalysisPromises.length
        );
        const currentBatch = frameAnalysisPromises.slice(start, end);

        await Promise.all(currentBatch);

        // Update progress for analysis phase (75% to 95%)
        const analysisProgress =
          75 + Math.round(((i + 1) / analysisBatches) * 20);
        setProgress(analysisProgress);
        setProcessingStep(
          `Analyzed frames batch ${i + 1}/${analysisBatches} (${Math.min(
            end,
            frameAnalysisPromises.length
          )}/${frameAnalysisPromises.length} frames)`
        );
      }

      // Final update with all frameUrls and completed status - important to ensure we have the most current list
      setProcessingStep("Finalizing video metadata...");
      setProgress(95);

      // Double check that the frame URLs are correctly stored in the database
      const verifyResponse = await fetch(`/api/video?id=${videoId}`, {
        method: "GET",
      });

      const videoRecord = await verifyResponse.json();

      // If the stored frameUrls don't match our count, update them one last time
      if (
        !videoRecord.frameUrls ||
        videoRecord.frameUrls.length < finalFrameUrls.length
      ) {
        console.log(
          `Final update - database has ${
            videoRecord.frameUrls?.length || 0
          } frames, we have ${finalFrameUrls.length}`
        );

        await fetch(`/api/video?id=${videoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frameUrls: finalFrameUrls,
            processingComplete: true,
          }),
        });
      } else {
        // Just mark processing as complete
        await fetch(`/api/video?id=${videoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ processingComplete: true }),
        });
      }

      setProgress(100);

      // Using Sonner toast
      toast.success("Video uploaded and analyzed successfully!", {
        description: `Your video is ready for Q&A with ${finalFrameUrls.length} frames extracted and analyzed.`,
      });

      // Redirect to video page
      router.push(`/video/${videoId}`);
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "There was an error uploading the video.");

      toast.error("Upload failed", {
        description:
          error.message || "There was an error uploading your video.",
      });
    } finally {
      setUploading(false);
      setProcessingStep("");
    }
  };

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Video Details</CardTitle>
          <CardDescription>
            Complete the information below to upload your video.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File upload area */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="video-file">
              Video File
            </label>
            <Input
              ref={inputFileRef}
              id="video-file"
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />

            {!file ? (
              <div
                onClick={handleSelectFile}
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  Click to select a video file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP4, MOV, or WebM up to {MAX_FILE_SIZE / (1024 * 1024)}MB
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 truncate">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                      {videoDuration && ` · ${formatDuration(videoDuration)}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClearFile}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>

                {videoPreviewUrl && (
                  <div className="mt-3 aspect-video bg-muted rounded overflow-hidden">
                    <video
                      src={videoPreviewUrl}
                      className="w-full h-full object-contain"
                      controls
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title input */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your video"
              required
              disabled={uploading}
              maxLength={100}
            />
          </div>

          {/* Description textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a description of your video content"
              disabled={uploading}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">
                  {processingStep || "Processing..."}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              {analyzedFrames > 0 && (
                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  <span>{analyzedFrames} frames analyzed</span>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!file || !title || uploading}
            className="gap-2"
          >
            {uploading ? (
              "Processing..."
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Video
              </>
            )}
          </Button>
        </CardFooter>
      </form>

      {/* Hidden elements for frame extraction */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Card>
  );
}
