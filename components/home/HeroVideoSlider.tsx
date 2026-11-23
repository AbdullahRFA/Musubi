"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX, Sparkles } from "lucide-react";

export interface HeroVideo {
  src: string;
  tag: string;
  title: string;
  description: string;
}

export const HERO_VIDEOS: HeroVideo[] = [
  {
    src: "/hero-section-video/hero-video-1.mp4",
    tag: "Knowledge Sharing",
    title: "Exchange Lifetime Wisdom & Modern Skills",
    description: "Generations learning side-by-side, from traditional culinary heritage to digital apps.",
  },
  {
    src: "/hero-section-video/hero-video-2.mp4",
    tag: "Everyday Support",
    title: "Practical Help & Neighborly Care",
    description: "Lending a patient hand with errands, technology setup, and daily household needs.",
  },
  {
    src: "/hero-section-video/hero-video-3.mp4",
    tag: "Companionship",
    title: "Meaningful Connection & Warm Friendship",
    description: "Sharing stories, casual tea chats, and peaceful neighborhood walks across generations.",
  },
];

interface HeroVideoSliderProps {
  externalIndex?: number;
  onSlideChange?: (index: number) => void;
  className?: string;
}

export function HeroVideoSlider({ externalIndex, onSlideChange, className = "" }: HeroVideoSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Sync with external index if provided
  useEffect(() => {
    if (externalIndex !== undefined && externalIndex >= 0 && externalIndex < HERO_VIDEOS.length) {
      setActiveIndex(externalIndex);
      setIsPlaying(true);
    }
  }, [externalIndex]);

  // Notify parent of active slide changes
  useEffect(() => {
    onSlideChange?.(activeIndex);
  }, [activeIndex, onSlideChange]);

  // Handle active video playback transitions
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activeIndex) {
        video.currentTime = 0;
        if (isPlaying) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Browser autoplay policy fallback
            });
          }
        }
      } else {
        video.pause();
      }
    });
  }, [activeIndex, isPlaying]);

  // Update muted state across all videos
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  // Advance automatically when the current video finishes
  const handleVideoEnded = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % HERO_VIDEOS.length);
  }, []);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + HERO_VIDEOS.length) % HERO_VIDEOS.length);
    setIsPlaying(true);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % HERO_VIDEOS.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    const currentVideo = videoRefs.current[activeIndex];
    if (!currentVideo) return;
    if (isPlaying) {
      currentVideo.pause();
      setIsPlaying(false);
    } else {
      currentVideo.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const currentSlide = HERO_VIDEOS[activeIndex];

  return (
    <div
      className={`relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-border/80 shadow-2xl bg-stone-900 group select-none ${className}`}
      role="region"
      aria-label="Tsunagu Generations video showcase"
    >
      {/* Stacked Video Elements for Seamless Crossfade */}
      {HERO_VIDEOS.map((video, idx) => (
        <video
          key={video.src}
          ref={(el) => {
            videoRefs.current[idx] = el;
          }}
          src={video.src}
          autoPlay
          muted={isMuted}
          playsInline
          preload="metadata"
          onEnded={idx === activeIndex ? handleVideoEnded : undefined}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
            idx === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        />
      ))}

      {/* Top Glass Badge */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] sm:text-xs font-semibold text-white shadow-sm">
          <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
          <span>{currentSlide.tag}</span>
        </div>
      </div>

      {/* Top-Right Sound & Play Controls */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleMute}
          className="p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/20 text-white transition-colors cursor-pointer"
          title={isMuted ? "Unmute video" : "Mute video"}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/20 text-white transition-colors cursor-pointer"
          title={isPlaying ? "Pause video" : "Play video"}
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </button>
      </div>

      {/* Navigation Arrows (visible on hover or tap) */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Previous video"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Next video"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      {/* Bottom Gradient Overlay & Slide Caption / Indicators */}
      <div className="absolute inset-x-0 bottom-0 z-20 pt-12 pb-3.5 sm:pb-4 px-3 sm:px-5 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
          {/* Active slide title & description */}
          <div className="space-y-0.5 text-left max-w-sm sm:max-w-md">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
              {currentSlide.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-white/80 line-clamp-1">
              {currentSlide.description}
            </p>
          </div>

          {/* Interactive Slide Dots / Indicators */}
          <div
            className="flex items-center gap-1.5 self-center sm:self-end shrink-0"
            role="tablist"
            aria-label="Video slide selector"
          >
            {HERO_VIDEOS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                role="tab"
                aria-selected={idx === activeIndex}
                aria-label={`Go to slide ${idx + 1}: ${HERO_VIDEOS[idx].tag}`}
                className={`transition-all rounded-full cursor-pointer ${
                  idx === activeIndex
                    ? "h-2 w-6 sm:w-7 bg-amber-400 shadow-sm"
                    : "h-2 w-2 sm:w-2.5 bg-white/40 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
