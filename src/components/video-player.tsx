'use client';

import { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  SkipForward, 
  SkipBack,
  Settings,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  title?: string;
  quality?: string;
  className?: string;
  autoplay?: boolean;
  onTimeUpdate?: (time: number) => void;
}

export default function VideoPlayer({
  src,
  title,
  quality = "HD",
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
  const [buffered, setBuffered] = useState<TimeRanges | null>(null);
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
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
    
    // Fix for the duration showing as 0
    const videoDuration = videoRef.current.duration;
    if (videoDuration && !isNaN(videoDuration) && isFinite(videoDuration)) {
      setDuration(videoDuration);
    }
    
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
    
    // Update buffer information
    if (videoRef.current.buffered.length > 0) {
      setBuffered(videoRef.current.buffered);
    }
    
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
  
  // Skip forward/backward
  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
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
    if (isNaN(time) || !isFinite(time)) return "0:00";
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
  
  // Calculate buffered progress
  const getBufferedProgress = () => {
    if (!buffered || !duration) return "0%";
    
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
        const width = (buffered.end(i) / duration) * 100;
        return `${width}%`;
      }
    }
    
    return "0%";
  };

  // Calculate play progress percentage
  const getPlaybackPercentage = () => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  };

  // Handle poster/thumbnail loaded
  const handlePosterLoaded = () => {
    setIsPosterLoaded(true);
  };

  // Toggle volume slider visibility
  const toggleVolumeSlider = () => {
    setShowVolumeSlider(!showVolumeSlider);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative group aspect-video bg-black rounded-xl overflow-hidden shadow-xl border border-muted/10",
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : "",
        className
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full cursor-pointer object-contain"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlayState}
        onPause={handlePlayState}
        onEnded={handleEnded}
        onLoadedData={handlePosterLoaded}
        playsInline
        preload="metadata"
        title={title}
      />
      
      {/* Shimmer loading effect before video loads */}
      {!isPosterLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted/70 to-muted/50 animate-pulse" />
      )}
      
      {/* Video title overlay with quality badge - shown in fullscreen or when controls visible */}
      {(isFullscreen || isControlsVisible) && title && (
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white font-medium transition-opacity z-10 flex items-center justify-between",
            isControlsVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <h3 className="text-base md:text-lg font-semibold truncate tracking-tight">{title}</h3>
          {quality && (
            <Badge variant="outline" className="bg-black/40 backdrop-blur-sm text-white border-white/20 ml-2 h-6 text-xs font-medium">
              {quality}
            </Badge>
          )}
        </div>
      )}
      
      {/* Semi-transparent play/pause overlay - only shows when paused */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] cursor-pointer transition-opacity z-10"
          onClick={togglePlay}
        >
          <Button 
            size="icon" 
            variant="secondary" 
            className="h-16 w-16 rounded-full bg-white/30 hover:bg-white/40 backdrop-blur-md transition-transform hover:scale-105 shadow-lg border-white/20"
          >
            <Play className="h-8 w-8 text-white" fill="white" />
          </Button>
        </div>
      )}
      
      {/* Play progress bar */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10 transition-opacity",
          isControlsVisible ? "opacity-0" : "opacity-100"
        )}
      >
        <div 
          className="h-full bg-primary transition-all"
          style={{ width: `${getPlaybackPercentage()}%` }}
        />
      </div>
      
      {/* Video controls - more modern and sleek */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-16 backdrop-blur-[2px] transition-all z-20",
          isControlsVisible || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Progress bar container */}
        <div className="relative h-6 flex items-center">
          {/* Buffered progress */}
          <div 
            className="absolute h-1.5 bg-white/20 rounded-full z-10" 
            style={{ width: getBufferedProgress(), left: 0 }}
          />
          
          {/* Actual slider */}
          <Slider
            defaultValue={[0]}
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer h-1.5 group-hover:h-2.5 transition-all z-20"
            aria-label="Video progress"
          />
        </div>
        
        {/* Controls row - fixed layout with flex */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          {/* Left controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Play/Pause button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-white hover:bg-white/20 flex-shrink-0"
              onClick={togglePlay}
            >
              {isPlaying ? 
                <Pause className="h-5 w-5 sm:h-5 sm:w-5" /> : 
                <Play className="h-5 w-5 sm:h-5 sm:w-5" />
              }
            </Button>
            
            {/* Skip backward button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-white hover:bg-white/20 flex-shrink-0"
              onClick={() => skipTime(-10)}
            >
              <div className="relative">
                <SkipBack className="h-5 w-5" />
                <span className="absolute text-[10px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold">10</span>
              </div>
            </Button>
            
            {/* Skip forward button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-white hover:bg-white/20 flex-shrink-0"
              onClick={() => skipTime(10)}
            >
              <div className="relative">
                <SkipForward className="h-5 w-5" />
                <span className="absolute text-[10px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold">10</span>
              </div>
            </Button>
            
            {/* Time display */}
            <span className="text-xs sm:text-sm text-white font-medium flex-shrink-0 min-w-[80px] ml-0.5">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          {/* Right controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
            {/* Volume control */}
            <div className="hidden sm:flex items-center gap-1.5 relative">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-white hover:bg-white/20 flex-shrink-0"
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              
              <div 
                className={cn(
                  "absolute bottom-full left-0 mb-2 p-2 w-10 h-32 bg-black/80 backdrop-blur-md rounded-lg transition-opacity flex flex-col items-center",
                  showVolumeSlider ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <Slider
                  defaultValue={[1]}
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  orientation="vertical"
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer h-full w-1.5"
                  aria-label="Volume"
                />
              </div>
            </div>
            
            {/* Volume button for mobile */}
            <Button 
              variant="ghost" 
              size="icon"
              className="sm:hidden h-9 w-9 rounded-full text-white hover:bg-white/20 flex-shrink-0"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            {/* Settings button - could implement quality selector in future */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-white hover:bg-white/20 flex-shrink-0"
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            {/* Fullscreen button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-white hover:bg-white/20 flex-shrink-0"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? 
                <Minimize className="h-5 w-5" /> : 
                <Maximize className="h-5 w-5" />
              }
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tap to skip areas (mobile) */}
      <div className="absolute inset-0 flex opacity-0 z-0">
        <div className="flex-1" onClick={() => skipTime(-10)}></div>
        <div className="flex-1" onClick={togglePlay}></div>
        <div className="flex-1" onClick={() => skipTime(10)}></div>
      </div>
    </div>
  );
}