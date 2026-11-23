"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Flag,
  UserX,
  Edit,
  KeyRound,
  Star,
  CheckCircle2,
  Calendar,
  Sparkles,
  HandHelping,
  type LucideIcon,
} from "lucide-react";
import { usePublicProfile } from "@/lib/services/profileService";
import { useReviewsForUser } from "@/lib/services/reviewService";
import { useSession } from "@/lib/services/authService";
import { reportContent, blockUser } from "@/lib/services/reportService";
import { groupShort, GROUP_LABEL, REPORT_REASONS } from "@/lib/constants";
import { initials, formatDay } from "@/lib/utils";
import { RatingStars } from "@/components/common/RatingStars";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SafetyBanner } from "@/components/common/SafetyBanner";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const profile = usePublicProfile(id);
  const session = useSession();
  const reviews = useReviewsForUser(id);

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="page-container py-16 sm:py-24">
        <div className="mx-auto max-w-md text-center space-y-4 animate-fade-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserX className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Profile not found</h1>
          <p className="text-muted-foreground">This member may have deactivated their profile or been blocked.</p>
          <Button asChild variant="outline">
            <Link href="/posts">Browse community posts</Link>
          </Button>
        </div>
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

  const generationLabel = profile.userGroup === "og" ? "Older Generation" : "Younger Generation";
  const ageText = profile.age ? `Age ${profile.age}` : profile.ageGroup ? `Age ${profile.ageGroup}` : null;

  return (
    <div className="page-container max-w-5xl py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* ---------- Profile header ---------- */}
      <section className="overflow-hidden rounded-3xl border-2 border-border bg-card shadow-sm animate-fade-up">
        {/* Cover */}
        <div className="relative h-28 sm:h-40 bg-gradient-to-br from-amber-100 via-orange-100 to-[#E7EEE4] border-b border-border overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/15 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-secondary/15 blur-2xl" aria-hidden="true" />
        </div>

        <div className="relative px-4 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-card bg-secondary text-secondary-foreground flex items-center justify-center text-3xl font-extrabold shadow-lift shrink-0 overflow-hidden">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" />
              ) : (
                initials(profile.fullName)
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isMe ? (
                <>
                  <Button asChild variant="outline" className="gap-2 font-bold">
                    <Link href="/profile/edit">
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="gap-2 font-semibold">
                    <Link href="/change-password">
                      <KeyRound className="h-4 w-4" />
                      Change Password
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportModalOpen(true)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
                  >
                    <Flag className="h-4 w-4" />
                    Report
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBlock}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
                  >
                    <UserX className="h-4 w-4" />
                    Block
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Name & generation */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground break-words">{profile.fullName}</h1>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  profile.userGroup === "og" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
                title={GROUP_LABEL[profile.userGroup]}
              >
                {groupShort(profile.userGroup)}
              </span>
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {ageText ? `${ageText} • ` : ""}
              {generationLabel}
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-x-5 text-sm text-muted-foreground pt-2">
              <div className="flex items-start gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {profile.neighborhoods && profile.neighborhoods.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {profile.neighborhoods.map((n) => (
                      <span
                        key={n}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#315B4B]/10 text-[#315B4B] border border-[#315B4B]/20"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span>{profile.location || "Local community"}</span>
                )}
              </div>
              {profile.availability && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-4 w-4 text-secondary shrink-0" />
                  Available: {profile.availability}
                </span>
              )}
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 shrink-0" />
                Member since {formatDay(profile.createdAt)}
              </span>
            </div>
          </div>

          {profile.bio && (
            <p className="text-base text-foreground mt-5 leading-relaxed max-w-3xl">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-border">
            <StatTile label="Community Rating">
              <RatingStars rating={profile.averageRating} count={profile.reviewCount} />
            </StatTile>
            <StatTile label="Completed Exchanges">
              <span className="text-2xl font-extrabold text-foreground tabular-nums">{profile.completedCount}</span>
            </StatTile>
            {profile.phoneShared && profile.phone && (
              <StatTile label="Consented Phone" tone="success" className="min-[420px]:col-span-2 lg:col-span-1">
                <a
                  href={`tel:${profile.phone}`}
                  className="text-base font-bold text-emerald-950 flex items-center gap-1.5 hover:underline"
                >
                  <Phone className="h-4 w-4 text-emerald-700" />
                  {profile.phone}
                </a>
              </StatTile>
            )}
          </div>
        </div>
      </section>

      <SafetyBanner />

      {/* ---------- Skills & needs ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <TagListCard icon={Sparkles} title="Skills & Knowledge I Can Share" items={profile.skills} />
        <TagListCard icon={HandHelping} title="Help & Services I Need" items={profile.servicesNeeded} />
      </div>

      {/* ---------- Reviews ---------- */}
      <section className="space-y-4 sm:space-y-6">
        <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-foreground">
          <Star className="h-6 w-6 text-amber-500 fill-amber-400" />
          Reviews & Feedback
          <span className="ml-1 rounded-full bg-muted px-2.5 py-0.5 text-sm font-bold text-muted-foreground">
            {reviews.length}
          </span>
        </h2>

        {reviews.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 sm:p-10 text-center space-y-2">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">No reviews yet. Reviews appear once an exchange is marked completed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(({ review, author }) => (
              <article
                key={review.id}
                className="card-hover rounded-2xl p-5 border-2 border-border bg-card space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={author ? `/profile/${author.id}` : "#"}
                    className="group flex items-center gap-2.5 min-w-0"
                  >
                    <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {author?.avatarUrl ? (
                        <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : author ? (
                        initials(author.fullName)
                      ) : (
                        "?"
                      )}
                    </div>
                    <span className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                      {author?.fullName ?? "Community Member"}
                    </span>
                  </Link>
                  <RatingStars rating={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground italic leading-relaxed">“{review.comment}”</p>
                )}
                <span className="text-xs text-muted-foreground block text-right">{formatDay(review.createdAt)}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Report dialog ---------- */}
      <Dialog
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        title="Report Inappropriate Profile"
        description={`Please choose a reason for reporting ${profile.fullName}:`}
      >
        {reportError && (
          <div role="alert" className="mb-3 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {reportError}
          </div>
        )}
        {reportSuccess && (
          <div role="status" className="mb-3 flex items-center gap-2 text-sm text-success bg-success/10 p-3 rounded-lg font-bold">
            <CheckCircle2 className="h-4 w-4" />
            Thank you. Your report has been submitted for review.
          </div>
        )}

        <form onSubmit={handleReport} className="space-y-4">
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            aria-label="Report reason"
            className="w-full min-h-[48px] rounded-md border-2 border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 focus-visible:border-primary"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setReportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" className="font-bold" disabled={reportSuccess}>
              Submit Report
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function StatTile({
  label,
  tone = "default",
  className = "",
  children,
}: {
  label: string;
  tone?: "default" | "success";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl p-4 border transition-colors duration-200 ${
        tone === "success" ? "bg-emerald-50 border-emerald-300" : "bg-muted/40 border-border hover:bg-muted/70"
      } ${className}`}
    >
      <span
        className={`text-xs font-bold uppercase tracking-wide block mb-1.5 ${
          tone === "success" ? "text-emerald-900" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function TagListCard({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border-2 border-border bg-card p-5 sm:p-6 space-y-4 transition-shadow duration-300 hover:shadow-soft">
      <h2 className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-foreground">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None listed yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="bg-[#315B4B] text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-xs transition-transform duration-200 hover:-translate-y-0.5"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
