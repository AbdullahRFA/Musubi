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
    lg: "h-7 w-7",
  };

  const currentScore = rating ?? 0;

  return (
    <div className="flex items-center gap-1.5" aria-label={`Rating: ${rating ?? "No reviews"} out of 5`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            className={`transition-transform ${interactive ? "cursor-pointer hover:scale-110 p-1" : "cursor-default"}`}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`${starSizes[size]} ${
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
