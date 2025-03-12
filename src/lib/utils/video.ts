// Extract frames from a video file
export async function extractFrames(
    videoFile: File,
    frameCount: number = 8
  ): Promise<Blob[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const frames: Blob[] = [];
      
      video.onloadedmetadata = async () => {
        const duration = video.duration;
        const interval = duration / (frameCount + 1); // Extract evenly spaced frames
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        for (let i = 1; i <= frameCount; i++) {
          const currentTime = i * interval;
          video.currentTime = currentTime;
          
          await new Promise(resolve => {
            video.onseeked = () => {
              if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => {
                  if (blob) frames.push(blob);
                  resolve(null);
                }, 'image/jpeg', 0.7); // JPEG format with 70% quality
              } else {
                resolve(null);
              }
            };
          });
        }
        
        URL.revokeObjectURL(video.src);
        resolve(frames);
      };
      
      video.onerror = (e) => reject(e);
      video.src = URL.createObjectURL(videoFile);
    });
  }
  
  // Get video metadata (duration, dimensions)
  export async function getVideoMetadata(videoFile: File): Promise<{
    duration: number;
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = (e) => reject(e);
      video.src = URL.createObjectURL(videoFile);
    });
  }
  
  // Format seconds as mm:ss
  export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }