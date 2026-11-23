"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Pin,
  ArrowUpRight,
  ArrowDownLeft,
  type LucideIcon,
} from "lucide-react";
import { usePosts } from "@/lib/services/postService";
import { useMyRequests, confirmCompletion } from "@/lib/services/requestService";
import { useMyActivities } from "@/lib/services/reviewService";
import { useTransactions } from "@/lib/services/transactionService";
import { useSession } from "@/lib/services/authService";
import { useUsers } from "@/lib/services/demoService";
import { useAppStore } from "@/lib/store/useAppStore";
import { PostCard } from "@/components/posts/PostCard";
import { RequestStatusBadge, TransactionStatusBadge } from "@/components/common/StatusBadge";
import { formatWhen, formatDay, money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/common/AuthGuard";

type TabId = "posts" | "requests" | "inprogress" | "completed" | "transactions";
const TAB_IDS: TabId[] = ["posts", "requests", "inprogress", "completed", "transactions"];

function ActivityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabParam && TAB_IDS.includes(tabParam) ? tabParam : "posts");

  const session = useSession();
  const allPosts = usePosts();
  const { incoming, outgoing, inProgress } = useMyRequests();
  const myActivities = useMyActivities();
  const transactions = useTransactions();
  const allUsers = useUsers();
  const conversations = useAppStore((state) => state.conversations);

  // "my post - only currently requested posts"
  const myPosts = allPosts.filter((p) => p.authorId === session?.id && p.status === "open");
  const allRequests = [...incoming, ...outgoing];

  const getUser = (id: string) => allUsers.find((u) => u.id === id);

  const handleConfirmDone = async (requestId: string) => {
    if (!confirm("Confirm marking this exchange as completed?")) return;
    try {
      const res = await confirmCompletion(requestId);
      if (res.completed && res.activityId) {
        router.push(`/feedback/${res.activityId}`);
      } else {
        alert("You marked this activity completed! Waiting for the other person to confirm.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update completion.");
    }
  };

  const selectTab = (id: TabId) => {
    setActiveTab(id);
    // Keep the URL shareable / back-button friendly without a navigation
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url.toString());
  };

  const tabs: { id: TabId; label: string; count: number; icon: LucideIcon }[] = [
    { id: "posts", label: "My Posts", count: myPosts.length, icon: Compass },
    { id: "requests", label: "My Requests", count: allRequests.length, icon: Inbox },
    { id: "inprogress", label: "In Progress", count: inProgress.length, icon: Clock },
    { id: "completed", label: "Completed", count: myActivities.length, icon: CheckCircle2 },
    { id: "transactions", label: "Transactions", count: transactions.length, icon: Coins },
  ];

  return (
    <div className="pb-12 sm:pb-16">
      {/* ---------- Header ---------- */}
      <section className="border-b border-border bg-gradient-to-b from-card to-background">
        <div className="page-container max-w-6xl pt-8 sm:pt-12 space-y-6">
          <div className="space-y-1 animate-fade-up">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">My Activity Hub</h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Track your currently open posts, pending requests, active in-progress exchanges, and completed history.
            </p>
          </div>

          {/* Summary tiles double as tab shortcuts on larger screens */}
          <div className="hidden md:grid grid-cols-5 gap-3 animate-fade-up [animation-delay:100ms]">
            {tabs.map(({ id, label, count, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                className={`group rounded-xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  activeTab === id ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${activeTab === id ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                <div className="text-2xl font-black tabular-nums text-foreground">{count}</div>
                <div className="text-xs font-semibold text-muted-foreground">{label}</div>
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Activity sections"
            className="-mx-4 px-4 sm:mx-0 sm:px-0 flex overflow-x-auto gap-1 sm:gap-4 scrollbar-none snap-x"
          >
            {tabs.map(({ id, label, count, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectTab(id)}
                  className={`snap-start flex items-center gap-1.5 pb-3 pt-1 px-2 font-bold text-sm sm:text-base border-b-4 transition-colors duration-200 shrink-0 whitespace-nowrap ${
                    isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                      isActive ? "bg-primary/10 text-primary" : "bg-muted"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div key={activeTab} role="tabpanel" className="page-container max-w-6xl pt-6 sm:pt-8 space-y-4 animate-fade-in">
        {/* 1. MY POSTS */}
        {activeTab === "posts" && (
          <>
            <SectionHeader title="Your Community Posts">
              <Button asChild size="sm" className="gap-1.5 font-bold">
                <Link href="/posts/new">
                  <PlusCircle className="h-4 w-4" />
                  New Post
                </Link>
              </Button>
            </SectionHeader>
            {myPosts.length === 0 ? (
              <Empty icon={Compass} text="You haven't created any posts yet.">
                <Button asChild>
                  <Link href="/quick-post">Try Quick Post Wizard</Link>
                </Button>
              </Empty>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {myPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}

        {/* 2. REQUESTS */}
        {activeTab === "requests" && (
          <>
            <SectionHeader title="All Requests">
              <Button asChild variant="outline" size="sm">
                <Link href="/requests">Manage in Requests Inbox</Link>
              </Button>
            </SectionHeader>
            {allRequests.length === 0 ? (
              <Empty icon={Inbox} text="No requests sent or received yet.">
                <Button asChild variant="outline">
                  <Link href="/posts">Browse community posts</Link>
                </Button>
              </Empty>
            ) : (
              <div className="space-y-3">
                {allRequests.map((r) => {
                  const isMine = r.requesterId === session?.id;
                  const other = getUser(isMine ? r.ownerId : r.requesterId);
                  return (
                    <Link
                      key={r.id}
                      href="/requests"
                      className="group flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-soft"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold uppercase ${
                              isMine ? "text-blue-700" : "text-primary"
                            }`}
                          >
                            {isMine ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                            {isMine ? "Sent to" : "Received from"}
                          </span>
                          <strong className="text-foreground truncate">{other?.fullName}</strong>
                          <RequestStatusBadge status={r.status} />
                        </div>
                        {r.message && <p className="text-sm text-muted-foreground italic line-clamp-2">“{r.message}”</p>}
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 3. IN PROGRESS */}
        {activeTab === "inprogress" && (
          <>
            <SectionHeader
              title="Active In-Progress Exchanges"
              subtitle="Accepted requests · Completed when both parties confirm"
            />
            {inProgress.length === 0 ? (
              <Empty icon={Clock} text="No exchanges in progress right now." />
            ) : (
              <div className="space-y-4">
                {inProgress.map((req) => {
                  const isRequester = req.requesterId === session?.id;
                  const other = getUser(isRequester ? req.ownerId : req.requesterId);
                  const conversation = conversations.find((c) => c.requestId === req.id);
                  const chatHref = conversation ? `/chat?id=${conversation.id}` : "/chat";
                  const post = allPosts.find((p) => p.id === req.postId);
                  const myDone = isRequester ? req.requesterDone : req.ownerDone;
                  const otherDone = isRequester ? req.ownerDone : req.requesterDone;

                  return (
                    <article
                      key={req.id}
                      className="rounded-2xl border-2 border-primary/30 bg-card p-4 sm:p-5 shadow-xs transition-shadow duration-300 hover:shadow-soft"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-lg text-foreground">Exchange with {other?.fullName}</h3>
                            {!myDone && otherDone && (
                              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full animate-pulse">
                                Partner marked completed!
                              </span>
                            )}
                            {!myDone && !otherDone && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E7EEE4] text-[#315B4B]">
                                In Progress
                              </span>
                            )}
                          </div>
                          {post && (
                            <Link
                              href={`/posts/${post.id}`}
                              className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline underline-offset-4"
                            >
                              <Pin className="h-3.5 w-3.5 shrink-0" />
                              <span className="line-clamp-1">{post.title}</span>
                            </Link>
                          )}
                          <p className="text-xs text-muted-foreground">Connected since {formatWhen(req.updatedAt)}</p>
                        </div>

                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:flex md:items-center gap-2 shrink-0">
                          <Button asChild size="sm" variant="secondary" className="gap-1.5 font-bold">
                            <Link href={chatHref}>
                              <MessageSquare className="h-4 w-4" />
                              Open Chat
                            </Link>
                          </Button>
                          {myDone ? (
                            <span className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-2 rounded-lg">
                              <Clock className="h-4 w-4 text-amber-700" />
                              Waiting for partner to confirm
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirmDone(req.id)}
                              className="gap-1.5 font-bold hover:border-emerald-600 hover:text-emerald-700"
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 4. COMPLETED */}
        {activeTab === "completed" && (
          <>
            <SectionHeader title="Completed Activities History" />
            {myActivities.length === 0 ? (
              <Empty icon={CheckCircle2} text="No completed activities recorded yet." />
            ) : (
              <div className="space-y-3">
                {myActivities.map((act) => {
                  const partner = getUser(act.participantIds.find((id) => id !== session?.id) ?? "");
                  return (
                    <article
                      key={act.id}
                      className="rounded-2xl border-2 border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:border-success/40 hover:shadow-soft"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-base sm:text-lg text-foreground">{act.title}</h3>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">{act.category}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Completed with <strong className="text-foreground">{partner?.fullName ?? "Partner"}</strong> on{" "}
                            {formatDay(act.completedAt)}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="gap-1.5 font-semibold shrink-0">
                        <Link href={`/feedback/${act.id}`}>
                          <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                          Rate & Review
                        </Link>
                      </Button>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 5. TRANSACTIONS */}
        {activeTab === "transactions" && (
          <>
            <SectionHeader title="Demo Transaction Records">
              <Button asChild variant="outline" size="sm">
                <Link href="/transactions">View Full Log</Link>
              </Button>
            </SectionHeader>
            {transactions.length === 0 ? (
              <Empty icon={Coins} text="No demo transactions recorded yet." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-xl border-2 border-border bg-card p-4 flex items-center justify-between gap-3 transition-colors hover:border-primary/30"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-lg text-foreground">{money(tx.amount)}</div>
                      <span className="text-xs text-muted-foreground">Recorded {formatWhen(tx.createdAt)}</span>
                    </div>
                    <TransactionStatusBadge status={tx.status} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Empty({ icon: Icon, text, children }: { icon: LucideIcon; text: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card px-6 py-12 text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-base font-semibold text-foreground">{text}</p>
      {children}
    </div>
  );
}

export default function MyActivityPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center gap-3 p-8 text-muted-foreground">
            <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Loading activity hub...
          </div>
        }
      >
        <ActivityContent />
      </Suspense>
    </AuthGuard>
  );
}
