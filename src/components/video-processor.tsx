'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface VideoProcessorProps {
  videoFile: File;
  onComplete: (frames: string[], thumbnailUrl: string) => void;
  onError: (error: string) => void;
}

/**
 * VideoProcessor component
 * Handles extracting frames from a video file on the client side
 * Uses canvas and video elements to extract frames at specific intervals
 */
export default function VideoProcessor({ videoFile, onComplete, onError }: VideoProcessorProps) {
  const [processingStep, setProcessingStep] = useState<string>('Initializing...');
  const [progress, setProgress] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Start processing when component mounts
  useState(() => {
    processVideo(videoFile);
  });
  
  const processVideo = async (file: File) => {
    try {
      setProcessingStep('Analyzing video...');
      setProgress(5);
      
      // Create object URL for the video file
      const videoUrl = URL.createObjectURL(file);
      
      // Create a temporary video element to analyze duration and dimensions
      const video = document.createElement('video');
      
      // Wait for video metadata to load
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Could not load video metadata'));
        video.src = videoUrl;
      });
      
      // Get video duration and dimensions
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      // Calculate how many frames to extract based on video duration
      // - For short videos (<30s): 1 frame every 2 seconds
      // - For medium videos (30-120s): 1 frame every 5 seconds
      // - For longer videos (>120s): 1 frame every 10 seconds
      let frameInterval: number;
      if (duration < 30) {
        frameInterval = 2;
      } else if (duration < 120) {
        frameInterval = 5;
      } else {
        frameInterval = 10;
      }
      
      // Cap the total number of frames to avoid excessive processing
      const maxFrames = 20;
      const estimatedFrames = Math.floor(duration / frameInterval);
      const frameCount = Math.min(estimatedFrames, maxFrames);
      
      // Recalculate interval to evenly space the frames
      frameInterval = duration / (frameCount + 1);
      
      setProcessingStep(`Preparing to extract ${frameCount} frames...`);
      setProgress(10);
      
      // Create canvas for frame extraction
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not create canvas context');
      }
      
      // Set canvas dimensions (cap at 720p for performance)
      const maxDimension = 720;
      let canvasWidth = width;
      let canvasHeight = height;
      
      if (width > height && width > maxDimension) {
        canvasWidth = maxDimension;
        canvasHeight = Math.floor((height / width) * maxDimension);
      } else if (height > maxDimension) {
        canvasHeight = maxDimension;
        canvasWidth = Math.floor((width / height) * maxDimension);
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Extract frames
      const frames: string[] = [];
      let thumbnailUrl: string | null = null;
      
      for (let i = 1; i <= frameCount; i++) {
        const currentTime = i * frameInterval;
        video.currentTime = currentTime;
        
        // Wait for video to seek to the specified time
        await new Promise<void>(resolve => {
          video.onseeked = () => resolve();
        });
        
        // Draw current frame to canvas
        context.drawImage(video, 0, 0, canvasWidth, canvasHeight);
        
        // Convert canvas to a data URL (JPEG with 80% quality)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        frames.push(dataUrl);
        
        // Use the middle frame as the thumbnail
        if (i === Math.ceil(frameCount / 2)) {
          thumbnailUrl = dataUrl;
        }
        
        // Update progress
        setProcessingStep(`Extracting frame ${i}/${frameCount}`);
        setProgress(10 + Math.floor((i / frameCount) * 80));
      }
      
      // Check if we have a thumbnail, if not use the first frame
      if (!thumbnailUrl && frames.length > 0) {
        thumbnailUrl = frames[0];
      }
      
      if (!thumbnailUrl) {
        throw new Error('Could not extract any frames from the video');
      }
      
      setProcessingStep('Processing complete');
      setProgress(100);
      
      // Clean up
      URL.revokeObjectURL(videoUrl);
      
      // Call completion handler
      onComplete(frames, thumbnailUrl);
      
    } catch (err: any) {
      console.error('Video processing error:', err);
      toast.error('Video processing failed', {
        description: err.message || 'Something went wrong while processing the video.'
      });
      onError(err.message || 'Video processing failed');
    }
  };
  
  return (
    <div className="p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center space-x-2 mb-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <h3 className="font-medium">Processing Video</h3>
      </div>
      
      <div className="space-y-3">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">{processingStep}</p>
      </div>
      
      {/* Hidden elements for processing */}
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}