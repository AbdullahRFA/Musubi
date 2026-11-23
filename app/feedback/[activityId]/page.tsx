"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Star, HeartHandshake, CheckCircle2, AlertCircle, SearchX } from "lucide-react";
import { useActivity, leaveReview } from "@/lib/services/reviewService";
import { usePublicProfile } from "@/lib/services/profileService";
import { RatingStars } from "@/components/common/RatingStars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { AuthGuard } from "@/components/common/AuthGuard";

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent!",
};

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = Array.isArray(params.activityId) ? params.activityId[0] : params.activityId;
  const activityData = useActivity(activityId);
  const otherProfile = usePublicProfile(activityData?.otherId ?? "");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activityData) {
    return (
      <AuthGuard>
        <div className="page-container py-16 sm:py-24">
          <div className="mx-auto max-w-md text-center space-y-4 animate-fade-up">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Activity not found</h1>
            <p className="text-muted-foreground">You can leave reviews only for activities that you have completed together.</p>
            <Button variant="outline" onClick={() => router.push("/my-activity")}>
              Back to My Activity
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const { activity, mine } = activityData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Please select a star rating between 1 and 5.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await leaveReview(activity.id, rating, comment);
      router.push(otherProfile ? `/profile/${otherProfile.id}` : "/my-activity?tab=completed");
    } catch (err: any) {
      setError(err?.message || "Failed to submit review.");
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="page-container max-w-2xl py-6 sm:py-12">
        <div className="overflow-hidden rounded-3xl border-2 border-border bg-card shadow-lift animate-fade-up">
          {/* Header */}
          <header className="relative overflow-hidden text-center space-y-3 border-b border-border px-5 py-8 sm:px-10 bg-gradient-to-b from-amber-50 to-transparent">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-40 w-72 rounded-full bg-amber-200/40 blur-3xl" aria-hidden="true" />
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-4 ring-card shadow-soft animate-float">
              {otherProfile?.avatarUrl ? (
                <img src={otherProfile.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <HeartHandshake className="h-8 w-8" />
              )}
            </div>
            <h1 className="relative text-2xl sm:text-3xl font-black text-foreground tracking-tight">Rate Your Exchange</h1>
            <p className="relative text-sm sm:text-base text-muted-foreground">
              Activity: <strong className="text-foreground">{activity.title}</strong>
              {otherProfile && (
                <>
                  {" "}
                  with <strong className="text-primary">{otherProfile.fullName}</strong>
                </>
              )}
            </p>
          </header>

          {mine ? (
            <div className="px-5 py-8 sm:px-10 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-success font-bold text-lg">
                <CheckCircle2 className="h-6 w-6" />
                You already reviewed this activity!
              </div>
              <div className="flex justify-center">
                <RatingStars rating={mine.rating} size="lg" />
              </div>
              {mine.comment && <p className="italic text-muted-foreground text-base">“{mine.comment}”</p>}
              <Button variant="outline" onClick={() => router.push("/my-activity?tab=completed")}>
                Return to My Activity
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-7 px-5 py-6 sm:px-10 sm:py-8">
                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <fieldset className="space-y-2 text-center">
                  <legend className="text-base font-bold text-foreground mb-2 w-full">How was your experience?</legend>
                  <div className="flex justify-center py-1">
                    <RatingStars rating={rating} interactive onRate={setRating} size="lg" />
                  </div>
                  <p key={rating} className="text-lg font-bold text-amber-700 animate-in fade-in zoom-in-95" aria-live="polite">
                    {RATING_LABELS[rating]}
                  </p>
                  <span className="text-xs text-muted-foreground">Tap a star to rate from 1 to 5</span>
                </fieldset>

                <div className="space-y-1.5">
                  <label htmlFor="feedback-comment" className="text-sm font-semibold text-foreground">
                    Share a short note or thank-you comment (optional):
                  </label>
                  <Textarea
                    id="feedback-comment"
                    rows={4}
                    placeholder={`${otherProfile?.fullName?.split(" ")[0] ?? "They"} was so patient and friendly during our exchange...`}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={200}
                  />
                  <span className={`text-xs text-right block tabular-nums ${comment.length > 180 ? "text-amber-700 font-semibold" : "text-muted-foreground"}`}>
                    {comment.length}/200 characters
                  </span>
                </div>
              </div>

              <footer className="border-t border-border bg-muted/20 px-5 py-4 sm:px-10 flex flex-col-reverse min-[420px]:flex-row justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" className="font-bold px-8" disabled={submitting}>
                  {submitting ? (
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <Star className="h-4 w-4 fill-current" />
                  )}
                  {submitting ? "Submitting review..." : "Submit Review"}
                </Button>
              </footer>
            </form>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
