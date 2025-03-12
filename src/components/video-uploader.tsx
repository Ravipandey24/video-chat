'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Upload, X, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const ALLOWED_FILE_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_DURATION = 600; // 10 minutes in seconds
const MAX_FRAMES = 300; // Maximum number of frames to extract (cap at 5 minutes worth)

export default function VideoUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  
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
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }
    
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Supported formats: MP4, MOV, WebM.');
      return;
    }
    
    // Create temporary URL for video preview and validation
    const objectUrl = URL.createObjectURL(selectedFile);
    setVideoPreviewUrl(objectUrl);
    
    // Create a temporary video element to check duration
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      if (video.duration > MAX_DURATION) {
        setError(`Video too long. Maximum duration is ${MAX_DURATION / 60} minutes.`);
        URL.revokeObjectURL(objectUrl);
        setVideoPreviewUrl(null);
        return;
      }
      
      setVideoDuration(video.duration);
      setFile(selectedFile);
      
      // Suggest a title based on the filename (remove extension and replace dashes/underscores with spaces)
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      const suggestedTitle = fileName
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      
      if (!title) {
        setTitle(suggestedTitle);
      }
    };
    
    video.onerror = () => {
      setError('The selected file is not a valid video.');
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
    if (inputFileRef.current) inputFileRef.current.value = '';
  };
  
  // Extract frames from video at 1-second intervals
  const extractFrames = async (videoFile: File, maxFrameCount: number = MAX_FRAMES): Promise<Blob[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const frames: Blob[] = [];
      
      video.onloadedmetadata = async () => {
        const duration = video.duration;
        
        // Calculate how many frames to extract
        // For long videos, we'll use adaptive sampling:
        // - First 60s: 1 frame per second
        // - 60s-300s: 1 frame every 2 seconds
        // - Beyond 300s: 1 frame every 5 seconds
        // This ensures reasonable coverage without excessive frames
        
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
        
        if (video.videoWidth > MAX_DIMENSION || video.videoHeight > MAX_DIMENSION) {
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
          
          await new Promise(resolve => {
            video.onseeked = () => {
              if (context) {
                // Draw the video frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Convert canvas to blob
                canvas.toBlob(blob => {
                  if (blob) frames.push(blob);
                  resolve(null);
                }, 'image/jpeg', 0.75); // JPEG at 75% quality for better compression
              } else {
                resolve(null);
              }
            };
          });
          
          // Update progress indication
          setProcessingStep(`Extracting frame ${i + 1}/${framePositions.length} (${position.toFixed(1)}s)`);
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
  
  // Format seconds as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title) {
      setError('Please select a file and provide a title.');
      return;
    }
    
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // 1. Extract frames from the video at 1-second intervals (with adaptive sampling)
      setProcessingStep('Preparing to extract frames...');
      const frames = await extractFrames(file);
      
      // 2. Generate unique filename for the video
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
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
        return `frames/${fileName.replace(`.${fileExt}`, '')}-${timestamp}s.jpg`;
      });
      
      // 4. Upload the video to Supabase Storage
      setProcessingStep('Uploading video...');
      
      // For large files, check if we need to use chunked upload
      if (file.size > 50 * 1024 * 1024) {
        setProcessingStep('Preparing chunked upload for large video file...');
      }
      
      const { error: videoError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setProgress(30 + Math.round((progress.loaded / progress.total) * 30)); // 30% to 60% of progress
          },
        });
      
      if (videoError) {
        console.error('Storage error details:', videoError);
        
        if (videoError.message.includes('exceeded the maximum allowed size')) {
          throw new Error('File size exceeded Supabase storage limits. Please try a smaller video or contact support.');
        } else if (videoError.message.includes('new row violates row-level security policy') ||
                  videoError.message.includes('security policy')) {
          throw new Error('Permission denied: You may need to sign in again or check storage bucket permissions');
        } else {
          throw new Error(`Video upload error: ${videoError.message}`);
        }
      }
      
      // 5. Upload extracted frames to Supabase Storage
      setProcessingStep(`Uploading ${frames.length} frames...`);
      const frameUrls: string[] = [];
      
      // To optimize performance, upload frames in batches of 5
      const BATCH_SIZE = 5;
      const batches = Math.ceil(frames.length / BATCH_SIZE);
      
      for (let batch = 0; batch < batches; batch++) {
        const startIdx = batch * BATCH_SIZE;
        const endIdx = Math.min(startIdx + BATCH_SIZE, frames.length);
        const batchFrames = frames.slice(startIdx, endIdx);
        const batchFilenames = frameFileNames.slice(startIdx, endIdx);
        
        // Upload frames in this batch concurrently
        const uploadPromises = batchFrames.map((frameBlob, i) => {
          return supabase.storage
            .from('frames')
            .upload(batchFilenames[i], frameBlob, {
              cacheControl: '3600',
              upsert: false,
            });
        });
        
        const results = await Promise.all(uploadPromises);
        
        // Check for errors and get URLs
        for (let i = 0; i < results.length; i++) {
          const { error: frameError, data } = results[i];
          
          if (frameError) {
            console.error('Frame upload error:', frameError);
            
            if (frameError.message.includes('new row violates row-level security policy') ||
                frameError.message.includes('security policy')) {
              throw new Error('Permission denied when uploading frames');
            } else {
              throw new Error(`Frame upload error: ${frameError.message}`);
            }
          }
          
          // Get public URL for the frame
          const { data: { publicUrl } } = supabase.storage
            .from('frames')
            .getPublicUrl(batchFilenames[i]);
            
          frameUrls.push(publicUrl);
        }
        
        // Update progress (60% to 90%, divided by batches)
        const batchProgress = 60 + Math.round(((batch + 1) / batches) * 30);
        setProgress(batchProgress);
        setProcessingStep(`Uploaded frames batch ${batch + 1}/${batches} (${frameUrls.length}/${frames.length} frames)`);
      }
      
      // 6. Get video public URL
      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);
      
      // 7. Get first frame as thumbnail
      const thumbnailUrl = frameUrls[0];
      
      // 8. Save video metadata and frame URLs to database
      setProcessingStep('Saving video information...');
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          url: videoUrl,
          thumbnailUrl,
          frameUrls,
          duration: videoDuration,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save video metadata');
      }
      
      const data = await response.json();
      
      setProgress(100);
      
      // Using Sonner toast
      toast.success('Video uploaded successfully!', {
        description: `Your video is now ready for Q&A with ${frameUrls.length} frames extracted.`,
      });
      
      // Redirect to video page
      router.push(`/video/${data.videoId}`);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'There was an error uploading the video.');
      
      toast.error('Upload failed', {
        description: error.message || 'There was an error uploading your video.',
      });
    } finally {
      setUploading(false);
      setProcessingStep('');
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
                <p className="text-sm font-medium">Click to select a video file</p>
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
              Description <span className="text-muted-foreground text-xs">(optional)</span>
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
                <span className="text-muted-foreground">{processingStep || 'Processing...'}</span>
                <span className="font-medium">{progress}%</span>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
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
              'Processing...'
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
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Card>
  );
}