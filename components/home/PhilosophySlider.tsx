"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export interface SliderItem {
  id: string;
  image: string;
  title: string;
  desc: string;
}

export const SLIDES: SliderItem[] = [
  {
    id: "knowledge-sharing",
    image: "/images/landing-section2/landing-section2-img1.jpg",
    title: "Knowledge Sharing",
    desc: "Sharing traditional knowledge, creative skills and new ideas across generations.",
  },
  {
    id: "mutual-support",
    image: "/images/landing-section2/landing-section2-img2.jpg",
    title: "Mutual Support",
    desc: "Working together, exchanging practical skills and supporting everyday community life.",
  },
  {
    id: "companionship",
    image: "/images/landing-section2/landing-section2-img3.jpg",
    title: "Companionship",
    desc: "Building friendships through conversation, shared interests and meaningful moments.",
  },
];

export function PhilosophySlider() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Automatic slide rotation every 4.5s; pauses on hover or focus
  useEffect(() => {
    if (isHovered) {
      resetTimer();
      return;
    }
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => resetTimer();
  }, [isHovered, nextSlide, resetTimer]);

  const activeSlide = SLIDES[activeIndex];
  const title = t(`about.slides.${activeIndex}.title`, activeSlide.title);
  const desc = t(`about.slides.${activeIndex}.desc`, activeSlide.desc);

  return (
    <div
      className="relative w-full max-w-4xl lg:max-w-5xl mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Community exchange showcase slider"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-border bg-card shadow-lift transition-all duration-300">
        {/* ================================================================= */}
        {/* 1. Large 16:9 Image Area with Smooth Crossfade Transitions        */}
        {/* ================================================================= */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted select-none">
          {SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out ${
                idx === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={idx !== activeIndex}
            >
              <img
                src={slide.image}
                alt={t(`about.slides.${idx}.title`, slide.title)}
                className="h-full w-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}

          {/* Floating Left / Previous Arrow on Image */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/45 hover:bg-[#315B4B] text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Floating Right / Next Arrow on Image */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/45 hover:bg-[#315B4B] text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Subtle bottom edge gradient for smooth visual blend into the card base */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent pointer-events-none z-10" />
        </div>

        {/* ================================================================= */}
        {/* 2. Synchronized Title, Description, and Control Bar Inside Card   */}
        {/* ================================================================= */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border-t border-border/70">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E7EEE4] text-[#2F5344] px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-[#315B4B] animate-pulse" />
              <span>{`0${activeIndex + 1} / 0${SLIDES.length}`}</span>
            </div>

            <h3
              key={`title-${activeIndex}`}
              className="text-2xl sm:text-3xl font-black text-foreground tracking-tight transition-all duration-300 animate-in fade-in"
            >
              {title}
            </h3>

            <p
              key={`desc-${activeIndex}`}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed transition-all duration-300 animate-in fade-in max-w-2xl"
            >
              {desc}
            </p>
          </div>

          {/* Slide Indicator Dots & Navigation Controls */}
          <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
            {/* Dots */}
            <div className="flex items-center gap-2" role="tablist" aria-label="Slide indicators">
              {SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  role="tab"
                  aria-selected={idx === activeIndex}
                  aria-label={`Slide ${idx + 1}: ${slide.title}`}
                  className={`h-2.5 rounded-full transition-all duration-300 ease-smooth ${
                    idx === activeIndex
                      ? "w-8 bg-[#315B4B] shadow-sm"
                      : "w-2.5 bg-border hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>

            {/* Bottom Nav Arrows */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-border">
              <button
                type="button"
                onClick={prevSlide}
                className="h-10 w-10 rounded-full border-2 border-border hover:border-[#315B4B] hover:bg-[#E7EEE4] text-foreground hover:text-[#315B4B] flex items-center justify-center transition-all duration-200"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="h-10 w-10 rounded-full border-2 border-border hover:border-[#315B4B] hover:bg-[#E7EEE4] text-foreground hover:text-[#315B4B] flex items-center justify-center transition-all duration-200"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
