"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  MapPin,
  Clock,
  BookOpen,
  HandHelping,
  Coins,
  Send,
  Edit,
  Trash2,
  XCircle,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { usePost, closePost, deletePost } from "@/lib/services/postService";
import { usePublicProfile } from "@/lib/services/profileService";
import { useSession } from "@/lib/services/authService";
import { respondToPost, useRequestsForPost } from "@/lib/services/requestService";
import { exchangeLabel, groupShort } from "@/lib/constants";
import { initials, money, formatDay } from "@/lib/utils";
import { PostStatusBadge, RequestStatusBadge } from "@/components/common/StatusBadge";
import { RatingStars } from "@/components/common/RatingStars";
import { SafetyBanner } from "@/components/common/SafetyBanner";
import { DemoPaymentBanner } from "@/components/common/DemoPaymentBanner";
import { DynamicMap } from "@/components/maps/DynamicMap";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Post not found</h2>
        <p className="text-muted-foreground">This post may have been removed or closed.</p>
        <Link href="/posts">
          <Button variant="outline">Back to community posts</Button>
        </Link>
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

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Status */}
      <SafetyBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Post Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 border-border bg-card shadow-sm">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      post.postType === "offer"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {post.postType === "offer" ? "Offering Help" : "Requesting Help"}
                  </span>
                  <Badge variant="outline" className="font-semibold text-xs">
                    {post.category}
                  </Badge>
                </div>
                <PostStatusBadge status={post.status} />
              </div>

              <CardTitle className="text-3xl font-extrabold leading-tight text-foreground">
                {post.title}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  {post.location}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="h-4 w-4 text-secondary" />
                  {post.availability}
                </span>
                <span>Posted {formatDay(post.createdAt)}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </h4>
                <p className="text-base sm:text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>

              {/* Skill Tag & Exchange Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/40 border border-border">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Required / Offered Skill
                  </span>
                  <div className="font-bold text-foreground text-base">{post.skill}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Exchange Arrangement
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-foreground text-base">
                    {post.exchangeMethod === "free" && <BookOpen className="h-5 w-5 text-emerald-600" />}
                    {post.exchangeMethod === "exchange" && <HandHelping className="h-5 w-5 text-primary" />}
                    {post.exchangeMethod === "paid" && <Coins className="h-5 w-5 text-amber-600" />}
                    <span>{exchangeLabel(post.exchangeMethod)}</span>
                    {post.amount && (
                      <span className="ml-1 text-sm text-primary font-mono">
                        ({money(post.amount)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {post.exchangeMethod === "paid" && <DemoPaymentBanner />}

              {/* Map Preview */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Approximate Meeting Area (Public Map)
                </h4>
                <DynamicMap
                  lat={post.lat}
                  lng={post.lng}
                  locationName={post.location}
                  title={post.title}
                />
              </div>
            </CardContent>

            {/* Post Owner Controls */}
            {isOwner && (
              <CardFooter className="border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Link href={`/posts/${post.id}/edit`} className="flex-1 sm:flex-initial">
                    <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto text-xs">
                      <Edit className="h-4 w-4" />
                      <span>Edit Post</span>
                    </Button>
                  </Link>
                  {post.status === "open" && (
                    <Button variant="outline" size="sm" onClick={handleClose} className="gap-1.5 text-muted-foreground flex-1 sm:flex-initial text-xs">
                      <XCircle className="h-4 w-4" />
                      <span>Close</span>
                    </Button>
                  )}
                  {post.status === "open" && (
                    <Button variant="ghost" size="sm" onClick={handleDelete} className="gap-1.5 text-destructive hover:bg-destructive/10 text-xs">
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  )}
                </div>

                <Link href="/requests" className="w-full sm:w-auto">
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto text-xs">
                    View Incoming Requests ({requests.length})
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>

          {/* Respond Form (For Non-Owner users) */}
          {!isOwner && post.status === "open" && (
            <Card className="border-2 border-primary/40 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  <span>Send a Service Request / Response</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Introduce yourself and let the author know how you can help or learn together.
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {!session ? (
                  <div className="rounded-xl border-2 border-dashed border-primary/40 bg-[#E7EEE4]/40 p-6 text-center space-y-3">
                    <p className="font-bold text-foreground text-base">
                      Interested in connecting with {author?.fullName || "this neighbor"}?
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Please log in or create a free Tsunagu Generations account to send a service request, exchange skills, or coordinate a meetup.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-xs mx-auto">
                      <Button asChild size="sm" className="w-full sm:w-auto bg-primary hover:bg-[#234336] text-white font-bold text-xs h-9 px-5 cursor-pointer">
                        <Link href="/login">Log In to Respond</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="w-full sm:w-auto font-bold text-xs h-9 px-5 border-2 border-border cursor-pointer">
                        <Link href="/register">Register</Link>
                      </Button>
                    </div>
                  </div>
                ) : myExistingRequest ? (
                  <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">You already responded to this post</span>
                      <RequestStatusBadge status={myExistingRequest.status} />
                    </div>
                    <p className="text-sm text-amber-800">
                      {myExistingRequest.status === "accepted" ? (
                        <>
                          Your request was accepted! You can now{" "}
                          <Link href="/chat" className="font-bold underline text-primary">
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
                      <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    {success && (
                      <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success font-semibold border border-success/20">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>{success}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">
                        Your message to the author (optional):
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Hi! I saw your post and I would love to connect. I'm usually free on weekends..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={280}
                      />
                      <span className="text-xs text-muted-foreground text-right block">
                        {message.length}/280 characters
                      </span>
                    </div>

                    <Button type="submit" size="lg" className="w-full font-bold gap-2" disabled={submitting}>
                      <Send className="h-4 w-4" />
                      <span>{submitting ? "Sending request..." : "Send Service Request"}</span>
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Author Profile Snapshot */}
        <div className="space-y-6">
          {author && (
            <Card className="border-2 border-border bg-card shadow-sm">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto h-20 w-20 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-2xl font-bold shadow-md mb-2">
                  {author.avatarUrl ? (
                    <img
                      src={author.avatarUrl}
                      alt={author.fullName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials(author.fullName)
                  )}
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {author.fullName}
                </CardTitle>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      author.userGroup === "og"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {groupShort(author.userGroup)}
                  </span>
                  <span className="text-xs text-muted-foreground">{author.location}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-sm">
                {/* Rating & Activities */}
                <div className="flex items-center justify-around rounded-md bg-muted/50 p-3 border border-border">
                  <div className="text-center">
                    <RatingStars rating={author.averageRating} count={author.reviewCount} size="sm" />
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">Rating</span>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <span className="font-bold text-foreground block text-base">
                      {author.completedCount}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">Exchanges</span>
                  </div>
                </div>

                {/* Bio snippet */}
                {author.bio && (
                  <p className="text-muted-foreground italic text-xs line-clamp-3">
                    “{author.bio}”
                  </p>
                )}

                {/* Skills tags */}
                {author.skills.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Expertise</span>
                    <div className="flex flex-wrap gap-1">
                      {author.skills.map((s) => (
                        <span key={s} className="bg-muted px-2 py-0.5 rounded text-xs font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                <Link href={`/profile/${author.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full font-semibold">
                    View Full Profile
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Safety Reminder */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2 text-xs text-muted-foreground">
            <h5 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <span>Community Safety</span>
            </h5>
            <p>
              Always arrange first meetings in public, accessible places like libraries, community centers, or parks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
