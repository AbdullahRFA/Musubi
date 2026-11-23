"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import {
  Compass,
  Inbox,
  Clock,
  CheckCircle2,
  Coins,
  MessageSquare,
  Star,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { usePosts } from "@/lib/services/postService";
import { useMyRequests, confirmCompletion } from "@/lib/services/requestService";
import { useMyActivities } from "@/lib/services/reviewService";
import { useTransactions } from "@/lib/services/transactionService";
import { useSession } from "@/lib/services/authService";
import { useUsers } from "@/lib/services/demoService";
import { PostCard } from "@/components/posts/PostCard";
import { PostStatusBadge, RequestStatusBadge, TransactionStatusBadge } from "@/components/common/StatusBadge";
import { formatWhen, formatDay, money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";

function ActivityContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as any) || "posts";

  const [activeTab, setActiveTab] = useState<
    "posts" | "requests" | "inprogress" | "completed" | "transactions"
  >(initialTab);

  const session = useSession();
  const allPosts = usePosts();
  const { incoming, outgoing, inProgress } = useMyRequests();
  const myActivities = useMyActivities();
  const transactions = useTransactions();
  const allUsers = useUsers();

  // "my post - only currently requested posts"
  const myPosts = allPosts.filter((p) => p.authorId === session?.id && p.status === "open");

  const getUser = (id: string) => allUsers.find((u) => u.id === id);

  const handleConfirmDone = async (requestId: string) => {
    if (!confirm("Confirm marking this exchange as completed?")) return;
    try {
      const res = await confirmCompletion(requestId);
      if (res.completed && res.activityId) {
        window.location.href = `/feedback/${res.activityId}`;
      } else {
        alert("You marked this activity completed! Waiting for the other person to confirm.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update completion.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b-2 border-border pb-6 space-y-1">
        <h1 className="text-3xl font-extrabold text-foreground">My Activity Hub</h1>
        <p className="text-base text-muted-foreground">
          Track your currently open posts, pending requests, active in-progress exchanges, and completed history.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b-2 border-border gap-1.5 sm:gap-6 scrollbar-none touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap">
        {[
          { id: "posts", label: "My Posts", count: myPosts.length, icon: Compass },
          { id: "requests", label: "My Requests", count: incoming.length + outgoing.length, icon: Inbox },
          { id: "inprogress", label: "In Progress", count: inProgress.length, icon: Clock },
          { id: "completed", label: "Completed", count: myActivities.length, icon: CheckCircle2 },
          { id: "transactions", label: "Transactions", count: transactions.length, icon: Coins },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 pb-2.5 pt-1 px-2 font-bold text-xs sm:text-base border-b-4 transition-all -mb-[2px] shrink-0 whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. MY POSTS TAB */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Your Community Posts</h2>
            <Link href="/posts/new">
              <Button size="sm" className="gap-1.5 font-bold">
                <PlusCircle className="h-4 w-4" />
                <span>New Post</span>
              </Button>
            </Link>
          </div>

          {myPosts.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 text-center space-y-3">
              <p className="text-base font-semibold text-foreground">You haven&apos;t created any posts yet.</p>
              <Link href="/quick-post">
                <Button variant="default">Try Quick Post Wizard</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. MY REQUESTS TAB */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">All Requests</h2>
            <Link href="/requests">
              <Button variant="outline" size="sm">
                Manage in Requests Inbox
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {[...incoming, ...outgoing].map((r) => {
              const other = getUser(r.requesterId === session?.id ? r.ownerId : r.requesterId);
              const isMine = r.requesterId === session?.id;
              return (
                <Card key={r.id} className="p-4 border-2 border-border bg-card flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        {isMine ? "Sent to" : "Received from"}
                      </span>
                      <strong className="text-foreground">{other?.fullName}</strong>
                      <RequestStatusBadge status={r.status} />
                    </div>
                    {r.message && <p className="text-sm text-muted-foreground mt-1 italic">“{r.message}”</p>}
                  </div>
                  <Link href="/requests">
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. IN PROGRESS TAB */}
      {activeTab === "inprogress" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Active In-Progress Exchanges</h2>
            <span className="text-xs text-muted-foreground">
              Accepted requests · Completed when both parties confirm
            </span>
          </div>

          {inProgress.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 text-center">
              <p className="text-base text-muted-foreground">No exchanges in progress right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inProgress.map((req) => {
                const other = getUser(req.requesterId === session?.id ? req.ownerId : req.requesterId);
                const post = allPosts.find((p) => p.id === req.postId);
                const isRequester = req.requesterId === session?.id;
                const hasMyDone = isRequester ? req.requesterDone : req.ownerDone;

                return (
                  <Card key={req.id} className="p-5 border-2 border-primary/40 bg-card space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-foreground">
                            Exchange with {other?.fullName}
                          </h3>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E7EEE4] text-[#315B4B]">
                            In Progress
                          </span>
                        </div>
                        {post && (
                          <p className="text-xs sm:text-sm text-primary font-medium">
                            📌 Post: {post.title}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Connected since {formatWhen(req.updatedAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href="/chat">
                          <Button size="sm" variant="default" className="gap-1.5 font-bold bg-[#315B4B] hover:bg-[#254639] text-white">
                            <MessageSquare className="h-4 w-4" />
                            <span>Open Chat</span>
                          </Button>
                        </Link>

                        {hasMyDone ? (
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-amber-700" />
                            <span>Waiting for partner to confirm</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConfirmDone(req.id)}
                            className="gap-1.5 font-bold text-foreground hover:border-emerald-600 border-2"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>Mark Completed</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. COMPLETED ACTIVITIES TAB */}
      {activeTab === "completed" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Completed Activities History</h2>

          {myActivities.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 text-center">
              <p className="text-base text-muted-foreground">No completed activities recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myActivities.map((act) => {
                const partnerId = act.participantIds.find((id) => id !== session?.id);
                const partner = getUser(partnerId ?? "");
                return (
                  <Card key={act.id} className="p-5 border-2 border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <h3 className="font-bold text-lg text-foreground">{act.title}</h3>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{act.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Completed with <strong className="text-foreground">{partner?.fullName ?? "Partner"}</strong> on {formatDay(act.completedAt)}
                      </p>
                    </div>

                    <Link href={`/feedback/${act.id}`}>
                      <Button variant="outline" size="sm" className="gap-1 font-semibold">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                        <span>Rate & Review</span>
                      </Button>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TRANSACTIONS TAB */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Demo Transaction Records</h2>
            <Link href="/transactions">
              <Button variant="outline" size="sm">
                View Full Log
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className="p-4 border-2 border-border bg-card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 font-mono font-bold text-base">
                    <span>{money(tx.amount)}</span>
                    <TransactionStatusBadge status={tx.status} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Recorded {formatWhen(tx.createdAt)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyActivityPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8 text-center">Loading activity hub...</div>}>
        <ActivityContent />
      </Suspense>
    </AuthGuard>
  );
}
