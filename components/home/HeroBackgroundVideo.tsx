"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export interface HeroVideoItem {
  src: string;
  tag: string;
  title: string;
}

export const HERO_VIDEOS: HeroVideoItem[] = [
  {
    src: "/hero-section-video/hero-video-0.mp4",
    tag: "Connecting Generations",
    title: "Bringing Generations Together",
  },
  {
    src: "/hero-section-video/hero-video-1.mp4",
    tag: "Knowledge Sharing",
    title: "Exchanging Lifetime Wisdom & Modern Skills",
  },
  {
    src: "/hero-section-video/hero-video-2.mp4",
    tag: "Daily Assistance",
    title: "Practical Everyday Help & Neighborly Care",
  },
  {
    src: "/hero-section-video/hero-video-3.mp4",
    tag: "Companionship",
    title: "Meaningful Connection & Lasting Friendship",
  },
];

interface HeroBackgroundVideoProps {
  children: React.ReactNode;
  className?: string;
}

export function HeroBackgroundVideo({ children, className = "" }: HeroBackgroundVideoProps) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Sequential playback: advance automatically when current video ends
  const handleVideoEnded = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % HERO_VIDEOS.length);
  }, []);

  // Handle active video transitions & crossfade
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activeIndex) {
        video.currentTime = 0;
        if (isPlaying) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Browser policy fallback
            });
          }
        }
      } else {
        const timer = setTimeout(() => {
          if (idx !== activeIndex && video) {
            video.pause();
          }
        }, 900);
        return () => clearTimeout(timer);
      }
    });
  }, [activeIndex, isPlaying]);

  // Sync muted state
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
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

  const currentTag = t(`hero.slides.${activeIndex}.tag`, HERO_VIDEOS[activeIndex].tag);
  const currentTitle = t(`hero.slides.${activeIndex}.title`, HERO_VIDEOS[activeIndex].title);

  return (
    <section
      className={`relative w-full min-h-[calc(100svh-3.5rem)] sm:min-h-[calc(100svh-4rem)] flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1C332A] via-[#243F34] to-[#14231D] text-white ${className}`}
      role="region"
      aria-label="Tsunagu Generations hero with full background video"
    >
      {/* 1. Edge-to-Edge Background Videos (Stacked with Crossfade) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
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
            loop={false}
            // Only fetch the active and upcoming clip; saves bandwidth on mobile
            preload={idx === activeIndex || idx === (activeIndex + 1) % HERO_VIDEOS.length ? "auto" : "none"}
            onEnded={idx === activeIndex ? handleVideoEnded : undefined}
            onError={() => setHasError(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
              idx === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          />
        ))}
      </div>

      {/* 2. Fallback Ambient Glow Pattern if Videos are Loading / Blocked */}
      <div
        className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
          hasError ? "opacity-100" : "opacity-20"
        } bg-[radial-gradient(circle_at_20%_30%,_rgba(229,181,94,0.2),_transparent_50%),radial-gradient(circle_at_80%_70%,_rgba(102,194,165,0.2),_transparent_50%)]`}
      />

      {/* 3. Subtle Light Overlay — Keeps Video Bright, Vibrant & Clear */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 z-10 pointer-events-none" />

      {/* 4. Top Decorative / Theme Tracker Bar */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/95 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-amber-300">0{activeIndex + 1}</span>
          <span className="text-white/40">/</span>
          <span className="font-mono text-white/70">0{HERO_VIDEOS.length}</span>
          <span className="hidden sm:inline text-white/40">·</span>
          <span className="hidden sm:inline text-white/90">{currentTag}</span>
        </div>

        {/* Sound & Play Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 hover:scale-105 backdrop-blur-md border border-white/20 text-white transition-all duration-200"
            title={isMuted ? "Unmute video" : "Mute video"}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-white/80" /> : <Volume2 className="h-4 w-4 text-white" />}
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 hover:scale-105 backdrop-blur-md border border-white/20 text-white transition-all duration-200"
            title={isPlaying ? "Pause background video" : "Play background video"}
            aria-label={isPlaying ? "Pause background video" : "Play background video"}
          >
            {isPlaying ? <Pause className="h-4 w-4 text-white/80" /> : <Play className="h-4 w-4 text-white" />}
          </button>
        </div>
      </div>

      {/* 5. Main Hero Content Overlay (Injected as Children) */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 my-auto py-10 sm:py-16 lg:py-20">
        {children}
      </div>

      {/* 6. Bottom Navigation Bar: Slide Indicators & Chapters */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 sm:pb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/15 pt-5">
        {/* Caption */}
        <div key={activeIndex} className="text-xs sm:text-sm text-white/80 font-medium animate-fade-in">
          <span className="text-amber-300 font-bold mr-1.5">{t("hero.nowPlaying", "Now Playing:")}</span>
          <span>{currentTitle}</span>
        </div>

        {/* Slide Indicators / Tabs */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Hero video slides">
          {HERO_VIDEOS.map((video, idx) => (
            <button
              key={video.src}
              type="button"
              onClick={() => goToSlide(idx)}
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-500 ease-smooth ${
                idx === activeIndex
                  ? "w-8 sm:w-10 bg-amber-400 shadow-md"
                  : "w-2.5 sm:w-3 bg-white/40 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scroll cue (desktop only) */}
      <a
        href="#explore"
        className="hidden lg:flex absolute bottom-24 left-1/2 -translate-x-1/2 z-20 h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white/80 hover:text-white hover:border-white transition-colors animate-float"
        aria-label="Scroll to content"
      >
        <ChevronDown className="h-5 w-5" />
      </a>
    </section>
  );
}
