"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Star, HeartHandshake, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useActivity, leaveReview } from "@/lib/services/reviewService";
import { usePublicProfile } from "@/lib/services/profileService";
import { useSession } from "@/lib/services/authService";
import { RatingStars } from "@/components/common/RatingStars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = Array.isArray(params.activityId) ? params.activityId[0] : params.activityId;
  const activityData = useActivity(activityId);
  const session = useSession();
  const otherProfile = usePublicProfile(activityData?.otherId ?? "");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activityData) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Activity not found</h2>
        <p className="text-muted-foreground">
          You can leave reviews only for activities that you have completed together.
        </p>
        <Button variant="outline" onClick={() => router.push("/my-activity")}>
          Back to My Activity
        </Button>
      </div>
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
      router.push(`/profile/${otherProfile?.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to submit review.");
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <Card className="border-2 border-border bg-card shadow-md">
          <CardHeader className="text-center space-y-2 border-b border-border pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <HeartHandshake className="h-7 w-7" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-foreground">
              Rate Your Exchange
            </CardTitle>
            <CardDescription className="text-base">
              Activity: <strong className="text-foreground">{activity.title}</strong>
              {otherProfile && (
                <span> with <strong className="text-primary">{otherProfile.fullName}</strong></span>
              )}
            </CardDescription>
          </CardHeader>

          {mine ? (
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-success font-bold text-lg">
                <CheckCircle2 className="h-6 w-6" />
                <span>You already reviewed this activity!</span>
              </div>
              <div className="flex justify-center">
                <RatingStars rating={mine.rating} size="lg" />
              </div>
              {mine.comment && (
                <p className="italic text-muted-foreground text-base">“{mine.comment}”</p>
              )}
              <div className="pt-4">
                <Button variant="outline" onClick={() => router.push("/my-activity")}>
                  Return to My Activity
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-6">
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Rating Stars Selector */}
                <div className="space-y-2 text-center">
                  <label className="text-base font-bold text-foreground block">
                    How was your experience?
                  </label>
                  <div className="flex justify-center py-2">
                    <RatingStars
                      rating={rating}
                      interactive={true}
                      onRate={(stars) => setRating(stars)}
                      size="lg"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Tap a star to rate from 1 to 5</span>
                </div>

                {/* Optional Comment */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Share a short note or thank-you comment (optional, max 200 chars):
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="Kenji was so patient and friendly during our exchange..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={200}
                  />
                  <span className="text-xs text-muted-foreground text-right block">
                    {comment.length}/200 characters
                  </span>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border pt-4 flex justify-between gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" size="lg" className="font-bold" disabled={submitting}>
                  {submitting ? "Submitting review..." : "Submit Review"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </AuthGuard>
  );
}
