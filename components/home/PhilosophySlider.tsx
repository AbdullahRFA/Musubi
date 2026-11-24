"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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

// Create a 3-repetition virtual track (9 cards) for seamless infinite looping
const EXTENDED_SLIDES = [...SLIDES, ...SLIDES, ...SLIDES];

export function PhilosophySlider() {
  const { t } = useLanguage();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // trackIndex starts at 3 (first card of canonical middle set: SLIDES[0])
  const [trackIndex, setTrackIndex] = useState(3);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Drag / touch gesture state
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isPointerDown = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const hasMoved = useRef(false);

  // Autoplay timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wheelDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Measure container width responsively
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      } else if (typeof window !== "undefined") {
        setContainerWidth(window.innerWidth);
      }
    };

    updateWidth();

    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      updateWidth();
    });
    ro.observe(el);

    window.addEventListener("resize", updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // Compute responsive card width:
  // Desktop (lg+): ~68% of container (capped at 820px) — proportional to site grid
  // Tablet (md): ~80% for modest side peeks
  // Mobile (<640px): ~86% with slight next-card hint
  const cardWidth = useMemo(() => {
    if (containerWidth >= 1024) {
      return Math.min(containerWidth * 0.64, 940);
    }
    if (containerWidth >= 640) {
      return containerWidth * 0.8;
    }
    return containerWidth * 0.86;
  }, [containerWidth]);

  const gap = useMemo(() => {
    if (containerWidth >= 1024) return 32;
    if (containerWidth >= 640) return 16;
    return 12;
  }, [containerWidth]);

  // Track position translation so active card is centered in viewport/container
  const trackTranslation = useMemo(() => {
    const centerOffset = (containerWidth - cardWidth) / 2;
    return centerOffset - trackIndex * (cardWidth + gap) + dragOffset;
  }, [containerWidth, cardWidth, gap, trackIndex, dragOffset]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Slide navigation
  const nextSlide = useCallback(() => {
    setIsTransitioning(true);
    setTrackIndex((prev) => {
      const nextIdx = prev + 1;
      setActiveIndex(nextIdx % SLIDES.length);
      return nextIdx;
    });
  }, []);

  const prevSlide = useCallback(() => {
    setIsTransitioning(true);
    setTrackIndex((prev) => {
      const prevIdx = prev - 1;
      setActiveIndex(((prevIdx % SLIDES.length) + SLIDES.length) % SLIDES.length);
      return prevIdx;
    });
  }, []);

  const goToSlide = useCallback((targetSlideIdx: number) => {
    setIsTransitioning(true);
    setActiveIndex(targetSlideIdx);
    setTrackIndex((prev) => {
      const currentSlideIdx = ((prev % SLIDES.length) + SLIDES.length) % SLIDES.length;
      const diff = targetSlideIdx - currentSlideIdx;
      return prev + diff;
    });
  }, []);

  // Seamless silent wrap when moving outside canonical index range [3, 4, 5]
  const handleTransitionEnd = useCallback(() => {
    if (trackIndex < 3 || trackIndex >= 6) {
      setIsTransitioning(false);
      const normalized = (((trackIndex % SLIDES.length) + SLIDES.length) % SLIDES.length) + 3;
      setTrackIndex(normalized);
    }
  }, [trackIndex]);

  // Re-enable transitions after browser paints silent wrap
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Fallback transition watchdog
  useEffect(() => {
    if (isTransitioning) {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        handleTransitionEnd();
      }, 450);
    }
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, [isTransitioning, trackIndex, handleTransitionEnd]);

  // Autoplay: next slide every 5 s. Pauses only while a card is being dragged
  // (hovering no longer pauses it — the large cards are almost always under
  // the mouse). Any slide change restarts the 5 s countdown. Skipped for
  // people who ask their device to reduce motion.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isDragging || reduceMotion) {
      resetTimer();
      return;
    }
    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") nextSlide();
    }, 5000);

    return () => resetTimer();
  }, [isDragging, reduceMotion, nextSlide, resetTimer, trackIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextSlide();
      }
    },
    [prevSlide, nextSlide]
  );

  // Trackpad horizontal swiping
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 28) {
        if (wheelDebounceRef.current) return;
        if (e.deltaX > 28) {
          nextSlide();
        } else if (e.deltaX < -28) {
          prevSlide();
        }
        wheelDebounceRef.current = setTimeout(() => {
          wheelDebounceRef.current = null;
        }, 400);
      }
    },
    [nextSlide, prevSlide]
  );

  // Mouse Drag Gestures
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    isPointerDown.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    hasMoved.current = false;
    setIsDragging(true);
    setIsTransitioning(false);
    resetTimer();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPointerDown.current) return;
    const deltaX = e.clientX - dragStartX.current;
    if (Math.abs(deltaX) > 4 || hasMoved.current) {
      hasMoved.current = true;
      setDragOffset(deltaX);
    }
  };

  const handleMouseUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    setIsDragging(false);

    const finalOffset = dragOffset;
    setDragOffset(0);
    setIsTransitioning(true);

    const threshold = containerWidth < 640 ? 35 : 55;
    if (finalOffset < -threshold) {
      nextSlide();
    } else if (finalOffset > threshold) {
      prevSlide();
    }
  };

  // Touch Drag Gestures (iOS / Android / Tablets)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isPointerDown.current = true;
    dragStartX.current = e.touches[0].clientX;
    dragStartY.current = e.touches[0].clientY;
    hasMoved.current = false;
    setIsDragging(true);
    setIsTransitioning(false);
    resetTimer();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPointerDown.current || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - dragStartX.current;
    const deltaY = currentY - dragStartY.current;

    // Only capture if horizontal movement dominates vertical scroll
    if (Math.abs(deltaX) > Math.abs(deltaY) || hasMoved.current) {
      hasMoved.current = true;
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    setIsDragging(false);

    const finalOffset = dragOffset;
    setDragOffset(0);
    setIsTransitioning(true);

    const threshold = containerWidth < 640 ? 35 : 55;
    if (finalOffset < -threshold) {
      nextSlide();
    } else if (finalOffset > threshold) {
      prevSlide();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none"
      onMouseLeave={() => {
        if (isPointerDown.current) handleMouseUp();
      }}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      role="region"
      aria-roledescription="carousel"
      aria-label="Community exchange showcase carousel"
      tabIndex={0}
    >
      {/* ================================================================= */}
      {/* 1. Track Container with Smooth Transform and Drag Gestures         */}
      {/* ================================================================= */}
      <div
        className="w-full touch-pan-y cursor-grab active:cursor-grabbing py-2"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex items-stretch"
          style={{
            transform: `translate3d(${trackTranslation}px, 0, 0)`,
            transition: isTransitioning
              ? "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
            gap: `${gap}px`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {EXTENDED_SLIDES.map((slide, index) => {
            const realIndex = index % SLIDES.length;
            const isCenter = index === trackIndex;
            const title = t(`about.slides.${realIndex}.title`, slide.title);
            const desc = t(`about.slides.${realIndex}.desc`, slide.desc);

            return (
              <div
                key={`slide-${index}-${slide.id}`}
                className={`shrink-0 transition-all duration-300 ${
                  isCenter
                    ? "opacity-100 scale-100 z-10"
                    : "opacity-60 hover:opacity-85 scale-[0.98] cursor-pointer z-0"
                }`}
                style={{ width: `${cardWidth}px` }}
                onClick={() => {
                  if (hasMoved.current) return;
                  if (!isCenter) {
                    goToSlide(realIndex);
                  }
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${title} (${realIndex + 1} of ${SLIDES.length})`}
                aria-hidden={!isCenter}
              >
                {/* Single-Column Card Container */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-border bg-card shadow-lift flex flex-col h-full transition-shadow duration-300">
                  {/* Full-width edge-to-edge image across entire card width */}
                  <div className="relative w-full aspect-[16/9] max-h-[460px] overflow-hidden bg-muted">
                    <img
                      src={slide.image}
                      alt={title}
                      draggable={false}
                      className="h-full w-full object-cover object-center pointer-events-none select-none"
                      loading={realIndex === 0 ? "eager" : "lazy"}
                    />
                  </div>

                  {/* Bottom card footer: bold title & description matching site card typography */}
                  <div className="p-5 sm:p-7 lg:p-8 space-y-1.5 sm:space-y-2.5 bg-card flex-1 flex flex-col justify-center">
                    <h3 className="text-xl sm:text-2xl lg:text-[1.75rem] font-black text-foreground tracking-tight">
                      {title}
                    </h3>
                    <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. External Navigation & Controls Bar Directly Below Carousel      */}
      {/* ================================================================= */}
      <div
        className="mx-auto px-4 sm:px-6 lg:px-8 mt-5 sm:mt-6 flex items-center justify-between"
        style={{
          width: `${cardWidth}px`,
          maxWidth: "100%",
        }}
      >
        {/* Far Left: Circular Previous Arrow Button */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border-2 border-border bg-card hover:border-[#315B4B] hover:bg-[#E7EEE4] text-foreground hover:text-[#315B4B] shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315B4B]"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Center: Pagination Indicator Dots */}
        <div className="flex items-center gap-2.5 sm:gap-3" role="tablist" aria-label="Slide indicators">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(idx)}
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Slide ${idx + 1}: ${slide.title}`}
              className={`h-2.5 sm:h-3 rounded-full transition-all duration-300 ease-smooth ${
                idx === activeIndex
                  ? "w-8 sm:w-10 bg-[#315B4B] shadow-xs"
                  : "w-2.5 sm:w-3 bg-border hover:bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>

        {/* Far Right: Circular Next Arrow Button */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border-2 border-border bg-card hover:border-[#315B4B] hover:bg-[#E7EEE4] text-foreground hover:text-[#315B4B] shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315B4B]"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>
    </div>
  );
}
