"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  ShieldAlert,
  Flag,
  UserX,
  Edit,
  Star,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { usePublicProfile } from "@/lib/services/profileService";
import { useReviewsForUser, useActivitiesForUser } from "@/lib/services/reviewService";
import { useSession } from "@/lib/services/authService";
import { reportContent, blockUser } from "@/lib/services/reportService";
import { groupShort, GROUP_LABEL, REPORT_REASONS, SAFETY_TEXT } from "@/lib/constants";
import { initials, formatDay, formatWhen } from "@/lib/utils";
import { RatingStars } from "@/components/common/RatingStars";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const profile = usePublicProfile(id);
  const session = useSession();
  const reviews = useReviewsForUser(id);
  const activities = useActivitiesForUser(id);

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Profile not found</h2>
        <p className="text-muted-foreground">This member may have deactivated their profile or been blocked.</p>
        <Link href="/posts">
          <Button variant="outline">Browse community posts</Button>
        </Link>
      </div>
    );
  }

  const isMe = session?.id === profile.id;

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);
    try {
      await reportContent("user", profile.id, selectedReason);
      setReportSuccess(true);
      setTimeout(() => {
        setReportModalOpen(false);
        setReportSuccess(false);
      }, 1500);
    } catch (err: any) {
      setReportError(err?.message || "Failed to submit report.");
    }
  };

  const handleBlock = async () => {
    if (confirm(`Are you sure you want to block ${profile.fullName}? You will no longer see their posts or messages.`)) {
      try {
        await blockUser(profile.id);
        router.push("/posts");
      } catch (err: any) {
        alert(err?.message || "Failed to block user.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Profile Card */}
      <Card className="border-2 border-border bg-card shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-amber-100 to-orange-100 border-b border-border" />

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* Avatar */}
            <div className="h-28 w-28 rounded-full border-4 border-card bg-secondary text-secondary-foreground flex items-center justify-center text-3xl font-extrabold shadow-md shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initials(profile.fullName)
              )}
            </div>

            {/* Actions for Me or Other */}
            <div className="flex flex-wrap items-center gap-2">
              {isMe ? (
                <Link href="/profile/edit">
                  <Button variant="outline" className="gap-2 font-bold">
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportModalOpen(true)}
                    className="text-muted-foreground hover:text-destructive gap-1 text-xs"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>Report</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBlock}
                    className="text-muted-foreground hover:text-destructive gap-1 text-xs"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    <span>Block</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Name & Generation Details */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold text-foreground">{profile.fullName}</h1>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  profile.userGroup === "og"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {groupShort(profile.userGroup)}
              </span>
              {profile.ageGroup && (
                <Badge variant="outline" className="text-xs">
                  Age {profile.ageGroup}
                </Badge>
              )}
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase">
              {GROUP_LABEL[profile.userGroup]}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-1">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                {profile.location || "Local community"}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Clock className="h-4 w-4 text-secondary" />
                Available: {profile.availability}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Member since {formatDay(profile.createdAt)}
              </span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-base text-foreground mt-4 leading-relaxed max-w-3xl">
              {profile.bio}
            </p>
          )}

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div className="rounded-lg bg-muted/40 p-3 border border-border text-center sm:text-left">
              <span className="text-xs font-bold text-muted-foreground uppercase block">
                Community Rating
              </span>
              <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <RatingStars rating={profile.averageRating} count={profile.reviewCount} />
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 border border-border text-center sm:text-left">
              <span className="text-xs font-bold text-muted-foreground uppercase block">
                Completed Exchanges
              </span>
              <span className="text-2xl font-extrabold text-foreground mt-1 block">
                {profile.completedCount}
              </span>
            </div>

            {profile.phoneShared && profile.phone && (
              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-300 text-center sm:text-left col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-emerald-900 uppercase block">
                  Consented Phone
                </span>
                <span className="text-base font-bold text-emerald-950 mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <Phone className="h-4 w-4 text-emerald-700" />
                  <span>{profile.phone}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Safety Notice per SRS */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 font-medium flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
        <span>{SAFETY_TEXT}</span>
      </div>

      {/* Skills, Needs, Interests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills Offered */}
        <Card className="border-2 border-border bg-card p-6 space-y-3">
          <h2 className="text-xl font-bold text-foreground">Skills & Knowledge I Can Share</h2>
          {profile.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">None listed yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="bg-primary/10 text-primary font-semibold text-sm px-3 py-1 rounded-md border border-primary/20">
                  {s}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Services Needed */}
        <Card className="border-2 border-border bg-card p-6 space-y-3">
          <h2 className="text-xl font-bold text-foreground">Help & Services I Need</h2>
          {profile.servicesNeeded.length === 0 ? (
            <p className="text-sm text-muted-foreground">None listed yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.servicesNeeded.map((n) => (
                <span key={n} className="bg-secondary/10 text-secondary font-semibold text-sm px-3 py-1 rounded-md border border-secondary/20">
                  {n}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Reviews & Activity History */}
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-foreground">Reviews & Feedback ({reviews.length})</h2>

        {reviews.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No reviews yet. Reviews appear once an exchange is marked completed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(({ review, author }) => (
              <Card key={review.id} className="p-5 border-2 border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs">
                      {author ? initials(author.fullName) : "?"}
                    </div>
                    <span className="font-bold text-foreground text-sm">
                      {author?.fullName ?? "Community Member"}
                    </span>
                  </div>
                  <RatingStars rating={review.rating} size="sm" />
                </div>

                {review.comment && (
                  <p className="text-sm text-foreground italic leading-relaxed">
                    “{review.comment}”
                  </p>
                )}

                <span className="text-[11px] text-muted-foreground block text-right">
                  {formatDay(review.createdAt)}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border-2 border-border bg-card p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-foreground">Report Inappropriate Profile</h3>
            <p className="text-sm text-muted-foreground">
              Please choose a reason for reporting {profile.fullName}:
            </p>

            {reportError && (
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                {reportError}
              </div>
            )}
            {reportSuccess && (
              <div className="text-xs text-success bg-success/10 p-2 rounded font-bold">
                Thank you. Your report has been submitted for review.
              </div>
            )}

            <form onSubmit={handleReport} className="space-y-4">
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full rounded-md border-2 border-border bg-background p-3 text-sm font-medium text-foreground"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setReportModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" className="font-bold">
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
