"use client";

import Link from "next/link";
import { useState, memo } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, ArrowRight, Send, MessageCircle, CheckCircle2, Flag } from "lucide-react";
import type { Post } from "@/lib/types";
import { usePublicProfile } from "@/lib/services/profileService";
import { useSession } from "@/lib/services/authService";
import { respondToPost } from "@/lib/services/requestService";
import { initials } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExchangeBadge, PostTypeBadge, POST_TYPE_ACCENT } from "@/components/posts/PostBadges";
import { ReportDialog } from "@/components/common/ReportDialog";

export const PostCard = memo(function PostCard({ post }: { post: Post }) {
  const author = usePublicProfile(post.authorId);
  const session = useSession();

  const [respondOpen, setRespondOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const router = useRouter();

  const isOwner = session?.id === post.authorId;

  const handleQuickRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await respondToPost(post.id, responseMessage);
      setSentSuccess(true);
      setTimeout(() => {
        setRespondOpen(false);
        setSentSuccess(false);
        setResponseMessage("");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="group/card card-hover flex flex-col border-2 border-border bg-card rounded-2xl overflow-hidden w-full h-full">
      {/* Accent bar reflects the post type */}
      <div className={`h-1.5 w-full ${POST_TYPE_ACCENT[post.postType] ?? POST_TYPE_ACCENT.request}`} />

      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <PostTypeBadge type={post.postType} />
            <Badge variant="outline" className="text-[11px] sm:text-xs font-semibold bg-muted/60 text-foreground border-border py-0.5 px-2.5">
              {post.category}
            </Badge>
          </div>
          <ExchangeBadge method={post.exchangeMethod} amount={post.amount} />
        </div>

        <Link href={`/posts/${post.id}`} className="block">
          <h3 className="font-extrabold text-lg sm:text-xl text-foreground group-hover/card:text-primary transition-colors duration-200 leading-snug line-clamp-2">
            {post.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0 space-y-3 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{post.description}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3 border-t border-border/70 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground min-w-0 max-w-full">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{post.location}</span>
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5 text-secondary shrink-0" />
            <span>{post.availability}</span>
          </span>
          {!isOwner && (
            <button
              type="button"
              onClick={() => (session ? setReportOpen(true) : router.push("/login"))}
              className="ml-auto inline-flex min-h-[32px] items-center gap-1 rounded-full px-2.5 font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Report post: ${post.title}`}
              title="Report this post"
            >
              <Flag className="h-3.5 w-3.5" />
              Report
            </button>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 sm:p-5 pt-3 sm:pt-3 border-t border-border/70 mt-auto flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          {author ? (
            <Link
              href={`/profile/${author.id}`}
              className="group/author flex items-center gap-2 min-w-0 flex-1"
            >
              <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold ring-2 ring-card shadow-xs shrink-0 overflow-hidden transition-transform duration-200 group-hover/author:scale-105">
                {author.avatarUrl ? (
                  <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  initials(author.fullName)
                )}
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-sm font-bold text-foreground truncate group-hover/author:text-primary transition-colors">
                  {author.fullName}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                  {author.userGroup === "og" ? "Older Generation" : "Younger Generation"}
                </span>
              </div>
            </Link>
          ) : (
            <div className="text-xs text-muted-foreground flex-1">Neighbor in Nagasaki</div>
          )}

          <div className="flex items-center gap-2 shrink-0 w-full min-[400px]:w-auto">
            {!isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRespondOpen((v) => !v)}
                aria-expanded={respondOpen}
                className={`flex-1 min-[400px]:flex-none font-semibold gap-1.5 px-3 ${respondOpen ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                Respond
              </Button>
            )}
            <Button asChild size="sm" className="group/view flex-1 min-[400px]:flex-none font-bold gap-1.5 px-3">
              <Link href={`/posts/${post.id}`}>
                View
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover/view:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Inline response drawer */}
        {respondOpen && (
          <form
            onSubmit={handleQuickRespond}
            className="w-full pt-3 border-t border-border/60 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {sentSuccess ? (
              <div role="status" className="flex items-center gap-2 text-sm font-bold text-success bg-success/10 p-3 rounded-lg border border-success/30">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Response sent! Post owner will review your request.
              </div>
            ) : (
              <>
                <label htmlFor={`respond-${post.id}`} className="text-xs font-bold text-foreground block">
                  Send a response to {author?.fullName || "the author"}:
                </label>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex items-center gap-2">
                  <input
                    id={`respond-${post.id}`}
                    type="text"
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Write a friendly note..."
                    className="flex-1 min-w-0 min-h-[40px] rounded-lg border-2 border-border bg-background px-3 text-sm text-foreground transition-colors hover:border-primary/40 focus:outline-none focus:border-primary"
                    required
                    autoFocus
                  />
                  <Button type="submit" size="sm" disabled={submitting} className="font-bold shrink-0 gap-1.5" aria-label="Send response">
                    {submitting ? (
                      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="hidden min-[400px]:inline">Send</span>
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </CardFooter>
      {reportOpen && (
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetType="post"
          targetId={post.id}
          targetLabel={`“${post.title}”`}
        />
      )}
    </Card>
  );
});
