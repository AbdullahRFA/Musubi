"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
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

  return (
    <section
      className={`relative w-full min-h-[calc(100svh-3.5rem)] sm:min-h-[calc(100svh-4rem)] flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1C332A] via-[#243F34] to-[#14231D] text-white ${className}`}
      role="region"
      aria-label="Musubi hero with full background video"
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
            style={{ filter: "brightness(1.18) contrast(1.05) saturate(1.08)" }}
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
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/18 to-black/5 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 z-10 pointer-events-none" />

      {/* 4. Top Decorative / Category Tracker Bar */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 flex items-center justify-between gap-3">
        {/* Dynamic Category Badge */}
        <div className="inline-flex items-center gap-2.5 sm:gap-3 rounded-full bg-black/55 backdrop-blur-md border border-white/25 px-4 sm:px-5 py-2 sm:py-2.5 shadow-lg">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 ring-4 ring-emerald-400/20" />
          <span className="text-sm sm:text-base font-bold text-white tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {currentTag}
          </span>
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

      {/* Subtle bottom buffer to keep content vertically balanced */}
      <div className="relative z-20 h-4 sm:h-8 pointer-events-none" aria-hidden="true" />
    </section>
  );
}
