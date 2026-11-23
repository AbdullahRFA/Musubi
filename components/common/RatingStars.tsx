"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number | null;
  count?: number;
  interactive?: boolean;
  onRate?: (stars: number) => void;
  size?: "sm" | "md" | "lg";
}

export function RatingStars({
  rating,
  count,
  interactive = false,
  onRate,
  size = "md",
}: RatingStarsProps) {
  const starSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-8 w-8 sm:h-9 sm:w-9",
  };

  const [hover, setHover] = useState<number | null>(null);
  const currentScore = (interactive && hover) || rating || 0;

  return (
    <div className="flex items-center gap-1.5" aria-label={`Rating: ${rating ?? "No reviews"} out of 5`}>
      <div className="flex items-center" onMouseLeave={() => interactive && setHover(null)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onFocus={() => interactive && setHover(star)}
            onBlur={() => interactive && setHover(null)}
            aria-pressed={interactive ? star <= (rating ?? 0) : undefined}
            className={`transition-transform duration-150 ${
              interactive ? "cursor-pointer hover:scale-125 active:scale-95 p-1.5 rounded-full" : "cursor-default"
            }`}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`${starSizes[size]} transition-colors duration-150 ${
                star <= currentScore
                  ? "fill-amber-400 text-amber-500"
                  : "fill-transparent text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
      {rating !== null && (
        <span className="font-semibold text-foreground text-sm">
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-sm text-muted-foreground">({count})</span>
      )}
      {rating === null && count === undefined && (
        <span className="text-sm text-muted-foreground">No ratings yet</span>
      )}
    </div>
  );
}
