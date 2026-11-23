"use client";

import Link from "next/link";
import { useState, memo } from "react";
import {
  MapPin,
  Clock,
  ArrowRight,
  HandHelping,
  Coins,
  Sparkles,
  Send,
  MessageCircle,
  CheckCircle2,
  Gift,
  ArrowLeftRight,
} from "lucide-react";
import type { Post } from "@/lib/types";
import { usePublicProfile } from "@/lib/services/profileService";
import { useSession } from "@/lib/services/authService";
import { respondToPost } from "@/lib/services/requestService";
import { initials, money } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const PostCard = memo(function PostCard({ post }: { post: Post }) {
  const author = usePublicProfile(post.authorId);
  const session = useSession();

  const [respondOpen, setRespondOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = session?.id === post.authorId;
  const isOffer = post.postType === "offer";

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
    <Card className="flex flex-col justify-between hover:shadow-md transition-all duration-200 border-2 border-border bg-card rounded-xl overflow-hidden w-full">
      {/* Top Banner Accent */}
      <div className={`h-1.5 w-full ${isOffer ? "bg-[#315B4B]" : "bg-[#2563eb]"}`} />

      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Offer (Green) / Request (Blue) Dual-Encoded Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider border ${
                isOffer
                  ? "bg-[#E7EEE4] text-[#234336] border-[#315B4B]/40"
                  : "bg-blue-50 text-blue-800 border-blue-300"
              }`}
            >
              {isOffer ? (
                <>
                  <Sparkles className="h-3 w-3 text-[#315B4B]" />
                  <span>OFFER</span>
                </>
              ) : (
                <>
                  <HandHelping className="h-3 w-3 text-blue-600" />
                  <span>REQUEST</span>
                </>
              )}
            </span>

            {/* Category Badge */}
            <Badge variant="outline" className="text-[11px] sm:text-xs font-semibold bg-muted/60 text-foreground border-border py-0.5">
              {post.category}
            </Badge>
          </div>

          {/* Exchange Method */}
          <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs shrink-0">
            {post.exchangeMethod === "free" && (
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <Gift className="h-3 w-3" />
                <span>Free</span>
              </span>
            )}
            {post.exchangeMethod === "exchange" && (
              <span className="inline-flex items-center gap-1 text-[#234336] bg-[#E7EEE4] px-2 py-0.5 rounded-md border border-[#315B4B]/30">
                <ArrowLeftRight className="h-3 w-3" />
                <span>Skill Exchange</span>
              </span>
            )}
            {post.exchangeMethod === "paid" && (
              <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Coins className="h-3 w-3" />
                <span>{post.amount ? money(post.amount) : "Paid"} (Demo)</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <Link href={`/posts/${post.id}`} className="group block">
          <h3 className="font-extrabold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0 space-y-3 flex-1">
        {/* Description snippet */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {post.description}
        </p>

        {/* Location & Availability Chips */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-border/70 text-[11px] sm:text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground truncate max-w-[200px]">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{post.location}</span>
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <Clock className="h-3 w-3 text-secondary shrink-0" />
            <span>{post.availability}</span>
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 sm:p-5 pt-2.5 border-t border-border/70 mt-auto flex flex-col gap-2.5">
        {/* Author Snapshot & Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2.5">
          {author ? (
            <Link
              href={`/profile/${author.id}`}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity min-w-0"
            >
              <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                {author.avatarUrl ? (
                  <img
                    src={author.avatarUrl}
                    alt={author.fullName}
                    className="h-full w-full rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  initials(author.fullName)
                )}
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-bold text-foreground truncate max-w-[150px] sm:max-w-[130px]">
                  {author.fullName}
                </span>
                <span className="text-[10px] font-medium text-primary truncate">
                  {author.userGroup === "og" ? "Older Generation" : "Younger Generation"}
                </span>
              </div>
            </Link>
          ) : (
            <div className="text-xs text-muted-foreground">Neighbor in Nagasaki</div>
          )}

          {/* Action CTAs - Responsive Full Width Grid on Phone, Flex on Desktop */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
            {!isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRespondOpen(!respondOpen)}
                className="text-xs font-semibold gap-1 h-8 sm:h-8 px-2.5 border-border hover:bg-muted w-full sm:w-auto justify-center"
              >
                <MessageCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Respond</span>
              </Button>
            )}
            <Button
              asChild
              variant="default"
              size="sm"
              className={`text-xs font-bold gap-1 h-8 sm:h-8 px-3 bg-primary hover:bg-[#234336] text-white justify-center cursor-pointer ${
                isOwner ? "col-span-2 sm:col-span-1 w-full sm:w-auto" : "w-full sm:w-auto"
              }`}
            >
              <Link href={`/posts/${post.id}`}>
                <span>View Post</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Inline Response Drawer */}
        {respondOpen && (
          <form
            onSubmit={handleQuickRespond}
            className="w-full pt-2.5 mt-1 border-t border-border/60 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {sentSuccess ? (
              <div className="flex items-center gap-2 text-xs font-bold text-success bg-success/10 p-2.5 rounded-md border border-success/30">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Response sent! Post owner will review your request.</span>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold text-foreground">
                  Send a response to {author?.fullName || "the author"}:
                </p>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Write a friendly note..."
                    className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
                    required
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting}
                    className="text-xs font-bold bg-primary hover:bg-[#234336] text-white shrink-0 h-8 gap-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>{submitting ? "..." : "Send"}</span>
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </CardFooter>
    </Card>
  );
});
