"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  MapPin,
  Clock,
  Send,
  Edit,
  Trash2,
  XCircle,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CalendarDays,
  Inbox,
  SearchX,
  Flag,
} from "lucide-react";
import { usePost, closePost, deletePost } from "@/lib/services/postService";
import { usePublicProfile } from "@/lib/services/profileService";
import { useSession } from "@/lib/services/authService";
import { respondToPost, useRequestsForPost } from "@/lib/services/requestService";
import { exchangeLabel, groupShort } from "@/lib/constants";
import { initials, formatDay } from "@/lib/utils";
import { PostStatusBadge, RequestStatusBadge } from "@/components/common/StatusBadge";
import { RatingStars } from "@/components/common/RatingStars";
import { SafetyBanner } from "@/components/common/SafetyBanner";
import { ReportDialog } from "@/components/common/ReportDialog";
import { DemoPaymentBanner } from "@/components/common/DemoPaymentBanner";
import { DynamicMap } from "@/components/maps/DynamicMap";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExchangeBadge, PostTypeBadge, POST_TYPE_ACCENT } from "@/components/posts/PostBadges";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const post = usePost(id);
  const session = useSession();
  const author = usePublicProfile(post?.authorId ?? "");
  const requests = useRequestsForPost(id);

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  if (!post) {
    return (
      <div className="page-container py-16 sm:py-24">
        <div className="mx-auto max-w-md text-center space-y-4 animate-fade-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Post not found</h1>
          <p className="text-muted-foreground">This post may have been removed or closed.</p>
          <Button asChild variant="outline">
            <Link href="/posts">Back to community posts</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = session?.id === post.authorId;
  const myExistingRequest = requests.find((r) => r.requesterId === session?.id);

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await respondToPost(post.id, message);
      setSuccess("Your service request was sent to the author!");
      setMessage("");
    } catch (err: any) {
      setError(err?.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (confirm("Are you sure you want to close this post? Any pending requests will be declined.")) {
      try {
        await closePost(post.id);
      } catch (err: any) {
        alert(err?.message || "Failed to close post.");
      }
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to permanently delete this post?")) {
      try {
        await deletePost(post.id);
        router.push("/posts");
      } catch (err: any) {
        alert(err?.message || "Failed to delete post.");
      }
    }
  };

  const isOffer = post.postType === "offer";

  const AuthorAvatar = ({ className }: { className: string }) =>
    author ? (
      <div
        className={`rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold overflow-hidden shrink-0 ${className}`}
      >
        {author.avatarUrl ? (
          <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials(author.fullName)
        )}
      </div>
    ) : null;

  return (
    <div className="page-container max-w-6xl py-6 sm:py-10 space-y-5 sm:space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground animate-fade-in">
        <Link href="/posts" className="group inline-flex items-center gap-1 font-semibold hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Community Posts
        </Link>
        <ChevronRight className="h-4 w-4 opacity-50" />
        <span className="truncate">{post.category}</span>
      </nav>

      <SafetyBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* ---------- Main column ---------- */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <article className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-sm animate-fade-up">
            <div className={`h-1.5 w-full ${POST_TYPE_ACCENT[post.postType] ?? POST_TYPE_ACCENT.request}`} />

            <header className="p-5 sm:p-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <PostTypeBadge type={post.postType} />
                  <Badge variant="outline" className="font-semibold text-xs py-0.5">
                    {post.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <PostStatusBadge status={post.status} />
                  {!isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => (session ? setReportOpen(true) : router.push("/login"))}
                      className="min-h-[36px] px-2.5 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="Report this post"
                      title="Report this post"
                    >
                      <Flag className="h-4 w-4" />
                      <span className="hidden sm:inline">Report</span>
                    </Button>
                  )}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight text-foreground break-words">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium min-w-0">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{post.location}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-4 w-4 text-secondary shrink-0" />
                  {post.availability}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  Posted {formatDay(post.createdAt)}
                </span>
              </div>

              {/* Compact author row on mobile / tablet */}
              {author && (
                <Link
                  href={`/profile/${author.id}`}
                  className="lg:hidden group flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                >
                  <AuthorAvatar className="h-10 w-10 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {author.fullName}
                    </p>
                    <RatingStars rating={author.averageRating} count={author.reviewCount} size="sm" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </header>

            <div className="px-5 sm:px-7 pb-6 sm:pb-7 space-y-6">
              <section className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</h2>
                <p className="text-base sm:text-lg leading-relaxed text-foreground whitespace-pre-wrap break-words">
                  {post.description}
                </p>
              </section>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-xl bg-muted/40 border border-border">
                <div className="space-y-1">
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {isOffer ? "Offered Skill / Service" : "Requested Skill / Service"}
                  </dt>
                  <dd className="font-bold text-foreground text-base">{post.skill}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exchange Arrangement</dt>
                  <dd className="flex flex-wrap items-center gap-2 font-bold text-foreground text-base">
                    <span>{exchangeLabel(post.exchangeMethod)}</span>
                    <ExchangeBadge method={post.exchangeMethod} amount={post.amount} />
                  </dd>
                </div>
              </dl>

              {post.exchangeMethod === "paid" && <DemoPaymentBanner />}

              <section className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Approximate Meeting Area (Public Map)
                </h2>
                <DynamicMap lat={post.lat} lng={post.lng} locationName={post.location} title={post.title} />
              </section>
            </div>

            {/* Owner controls */}
            {isOwner && (
              <footer className="border-t border-border bg-muted/20 px-5 sm:px-7 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href={`/posts/${post.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  {post.status === "open" && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleClose} className="gap-1.5 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        Close
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
                <Button asChild variant="secondary" size="sm" className="gap-1.5">
                  <Link href="/requests">
                    <Inbox className="h-4 w-4" />
                    Incoming Requests
                    <span className="rounded-full bg-white/20 px-2 text-xs font-bold">{requests.length}</span>
                  </Link>
                </Button>
              </footer>
            )}
          </article>

          {/* ---------- Respond ---------- */}
          {!isOwner && post.status === "open" && (
            <section
              id="respond"
              className="rounded-2xl border-2 border-primary/30 bg-card shadow-sm p-5 sm:p-7 space-y-4 scroll-mt-24 animate-fade-up [animation-delay:100ms]"
            >
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
                  <Send className="h-5 w-5 text-primary" />
                  Send a Service Request / Response
                </h2>
                <p className="text-sm text-muted-foreground">
                  Introduce yourself and let the author know how you can help or learn together.
                </p>
              </div>

              {!session ? (
                <div className="rounded-xl border-2 border-dashed border-primary/30 bg-[#E7EEE4]/40 p-5 sm:p-6 text-center space-y-3">
                  <p className="font-bold text-foreground text-base">
                    Interested in connecting with {author?.fullName || "this neighbor"}?
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Please log in or create a free Tsunagu Generations account to send a service request, exchange
                    skills, or coordinate a meetup.
                  </p>
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 pt-2 max-w-sm mx-auto">
                    <Button asChild className="font-bold">
                      <Link href="/login">Log In to Respond</Link>
                    </Button>
                    <Button asChild variant="outline" className="font-bold">
                      <Link href="/register">Register</Link>
                    </Button>
                  </div>
                </div>
              ) : myExistingRequest ? (
                <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-amber-900">You already responded to this post</span>
                    <RequestStatusBadge status={myExistingRequest.status} />
                  </div>
                  <p className="text-sm text-amber-800">
                    {myExistingRequest.status === "accepted" ? (
                      <>
                        Your request was accepted! You can now{" "}
                        <Link href="/chat" className="font-bold underline text-primary hover:text-[#7c2d12]">
                          chat securely
                        </Link>{" "}
                        to coordinate details.
                      </>
                    ) : (
                      "The post owner will review your response. You'll receive a notification when they reply."
                    )}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRespond} className="space-y-4">
                  {error && (
                    <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}
                  {success && (
                    <div role="status" className="flex items-start gap-2 rounded-lg bg-success/10 p-3 text-sm text-success font-semibold border border-success/20 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      {success}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="respond-message" className="text-sm font-semibold text-foreground">
                      Your message to the author (optional):
                    </label>
                    <Textarea
                      id="respond-message"
                      rows={4}
                      placeholder="Hi! I saw your post and I would love to connect. I'm usually free on weekends..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={280}
                    />
                    <span
                      className={`text-xs text-right block tabular-nums ${
                        message.length > 250 ? "text-amber-700 font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {message.length}/280 characters
                    </span>
                  </div>

                  <Button type="submit" size="lg" className="w-full font-bold" disabled={submitting}>
                    {submitting ? (
                      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submitting ? "Sending request..." : "Send Service Request"}
                  </Button>
                </form>
              )}
            </section>
          )}
        </div>

        {/* ---------- Sidebar (desktop) ---------- */}
        <aside className="hidden lg:block lg:sticky lg:top-24 space-y-4">
          {author && (
            <div className="rounded-2xl border-2 border-border bg-card shadow-sm p-6 space-y-5 animate-fade-up [animation-delay:150ms]">
              <div className="text-center space-y-2">
                <AuthorAvatar className="mx-auto h-20 w-20 text-2xl ring-4 ring-muted shadow-soft" />
                <h2 className="text-xl font-bold text-foreground">{author.fullName}</h2>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      author.userGroup === "og" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {groupShort(author.userGroup)}
                  </span>
                  {author.location && <span className="text-xs text-muted-foreground">{author.location}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-border rounded-xl bg-muted/50 border border-border py-3">
                <div className="text-center px-2 space-y-1">
                  <div className="flex justify-center">
                    <RatingStars rating={author.averageRating} size="sm" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Rating ({author.reviewCount})
                  </span>
                </div>
                <div className="text-center px-2">
                  <span className="font-bold text-foreground block text-lg tabular-nums">{author.completedCount}</span>
                  <span className="text-[11px] text-muted-foreground block">Exchanges</span>
                </div>
              </div>

              {author.bio && <p className="text-muted-foreground italic text-sm line-clamp-4">“{author.bio}”</p>}

              {author.skills.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Expertise</span>
                  <div className="flex flex-wrap gap-1.5">
                    {author.skills.map((s) => (
                      <span key={s} className="bg-muted px-2.5 py-1 rounded-full text-xs font-semibold text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Button asChild variant="outline" size="sm" className="group w-full font-semibold">
                <Link href={`/profile/${author.id}`}>
                  View Full Profile
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          )}
        </aside>
      </div>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="post"
        targetId={post.id}
        targetLabel={`“${post.title}”`}
      />

      {/* Sticky respond CTA on mobile for non-owners */}
      {!isOwner && post.status === "open" && session && !myExistingRequest && (
        <a
          href="#respond"
          className="lg:hidden fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
        >
          <Send className="h-4 w-4" />
          Respond
        </a>
      )}
    </div>
  );
}
