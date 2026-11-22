"use client";

import Link from "next/link";
import {
  Sparkles,
  PlusCircle,
  Compass,
  Search,
  MessageSquare,
  FileCheck2,
  Users,
  Smile,
  ArrowRight,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "@/lib/services/authService";
import { usePosts } from "@/lib/services/postService";
import { useMyRequests } from "@/lib/services/requestService";
import { useUnreadCount } from "@/lib/services/notificationService";
import { groupShort, GROUP_LABEL } from "@/lib/constants";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SafetyBanner } from "@/components/common/SafetyBanner";

export default function DashboardPage() {
  const session = useSession();
  const allPosts = usePosts();
  const { incoming, outgoing } = useMyRequests();
  const unreadCount = useUnreadCount();

  const isOG = session?.userGroup === "og";
  const myPosts = allPosts.filter((p) => p.authorId === session?.id);
  const pendingIncoming = incoming.filter((r) => r.status === "pending");
  const communityPosts = allPosts.filter((p) => p.authorId !== session?.id).slice(0, 3);

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-foreground">
                Hello, {session?.fullName}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isOG
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {session ? groupShort(session.userGroup) : ""}
              </span>
            </div>
            <p className="text-base text-muted-foreground">
              {session ? GROUP_LABEL[session.userGroup] : ""} · Location:{" "}
              <span className="font-semibold text-foreground">{session?.location || "Not set"}</span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/quick-post">
              <Button
                size="lg"
                className="gap-2 font-bold shadow-md bg-primary hover:bg-[#832c0f] text-white"
              >
                <Sparkles className="h-5 w-5 text-amber-200" />
                <span>Quick Post (Simplified)</span>
              </Button>
            </Link>
            <Link href="/posts/new">
              <Button variant="outline" size="lg" className="gap-2 font-semibold">
                <PlusCircle className="h-5 w-5" />
                <span>Standard Post</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Safety Banner */}
        <SafetyBanner />

        {/* Action / Attention Alerts */}
        {pendingIncoming.length > 0 && (
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-amber-900">
                You have {pendingIncoming.length} pending service request
                {pendingIncoming.length > 1 ? "s" : ""} to review!
              </h3>
              <p className="text-sm text-amber-800">
                Neighbors are interested in connecting on your posts. Review them to unlock chat.
              </p>
            </div>
            <Link href="/requests">
              <Button size="sm" className="bg-amber-800 hover:bg-amber-900 text-white font-bold whitespace-nowrap">
                Review Requests
              </Button>
            </Link>
          </div>
        )}

        {/* Dashboard Grid Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/my-activity?tab=posts" className="block group">
            <Card className="p-5 border-2 border-border bg-card group-hover:border-primary transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">My Posts</span>
                <Compass className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-foreground">{myPosts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Offers and requests active</p>
            </Card>
          </Link>

          <Link href="/requests" className="block group">
            <Card className="p-5 border-2 border-border bg-card group-hover:border-primary transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Pending Requests</span>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-foreground">{pendingIncoming.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting your response</p>
            </Card>
          </Link>

          <Link href="/chat" className="block group">
            <Card className="p-5 border-2 border-border bg-card group-hover:border-primary transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Active Chats</span>
                <MessageSquare className="h-5 w-5 text-secondary" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-foreground">Conversations</div>
              <p className="text-xs text-muted-foreground mt-1">Unlocked service discussions</p>
            </Card>
          </Link>

          <Link href="/my-activity?tab=completed" className="block group">
            <Card className="p-5 border-2 border-border bg-card group-hover:border-primary transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Completed Activities</span>
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-foreground">History</div>
              <p className="text-xs text-muted-foreground mt-1">Exchanges & reviews</p>
            </Card>
          </Link>
        </div>

        {/* Older Generation Guided Helper (Special O.G. Card) */}
        {isOG && (
          <div className="rounded-xl border-2 border-primary/40 bg-gradient-to-r from-amber-50 to-orange-50 p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold shadow">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Need help or want to share?</h2>
                <p className="text-base text-muted-foreground">
                  Our Quick Post wizard has pre-written templates so you don&apos;t have to type long descriptions.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link href="/quick-post">
                <Button size="lg" className="font-bold text-base bg-primary hover:bg-[#832c0f] text-white">
                  Try Quick Post Wizard
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" size="lg" className="font-semibold text-base">
                  Search Neighbors Who Can Help
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Recent Community Posts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Community Activity Around You</h2>
              <p className="text-sm text-muted-foreground">Latest posts from neighbors</p>
            </div>
            <Link href="/posts">
              <Button variant="outline" size="sm" className="font-semibold gap-1">
                <span>View all</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {communityPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
