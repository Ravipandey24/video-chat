'use client';

import { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Play, Pause, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  onTimeUpdate?: (time: number) => void;
}

export default function VideoPlayer({
  src,
  title,
  className,
  autoplay = false,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setIsControlsVisible(true);
      clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        if (isPlaying) {
          setIsControlsVisible(false);
        }
      }, 3000);
    };
    
    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    container?.addEventListener('touchstart', handleMouseMove);
    
    return () => {
      clearTimeout(timeout);
      container?.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('touchstart', handleMouseMove);
    };
  }, [isPlaying]);
  
  // Set up fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Handle initial metadata loading (duration)
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    
    // Autoplay if specified
    if (autoplay) {
      togglePlay();
    }
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    }
  };
  
  // Update time display and call time update callback
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  };
  
  // Set custom seek time
  const handleSeek = (values: number[]) => {
    if (!videoRef.current || !values.length) return;
    videoRef.current.currentTime = values[0];
    setCurrentTime(values[0]);
  };
  
  // Set volume
  const handleVolumeChange = (values: number[]) => {
    if (!videoRef.current || !values.length) return;
    const newVolume = values[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuteState = !isMuted;
    videoRef.current.muted = newMuteState;
    setIsMuted(newMuteState);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    } else {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    }
  };
  
  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle play state changes
  const handlePlayState = () => {
    setIsPlaying(!videoRef.current?.paused);
  };
  
  // Handle end of video
  const handleEnded = () => {
    setIsPlaying(false);
    setIsControlsVisible(true);
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative group aspect-video bg-black rounded-lg overflow-hidden",
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "",
        className
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlayState}
        onPause={handlePlayState}
        onEnded={handleEnded}
        playsInline
        title={title}
      />
      
      {/* Video title - shown only in fullscreen */}
      {isFullscreen && title && (
        <div className="absolute top-4 left-4 text-white text-lg font-medium drop-shadow-md">
          {title}
        </div>
      )}
      
      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
          onClick={togglePlay}
        >
          <Button 
            size="icon" 
            variant="secondary" 
            className="h-16 w-16 rounded-full opacity-90 hover:opacity-100"
          >
            <Play className="h-8 w-8" />
          </Button>
        </div>
      )}
      
      {/* Video controls */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity",
          isControlsVisible || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Progress bar */}
        <Slider
          defaultValue={[0]}
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
          aria-label="Video progress"
        />
        
        {/* Controls row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {/* Play/Pause button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            {/* Time display */}
            <span className="text-xs text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Volume control */}
            <div className="hidden sm:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              
              <Slider
                defaultValue={[1]}
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20 cursor-pointer"
                aria-label="Volume"
              />
            </div>
            
            {/* Fullscreen button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}