"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Send, CheckCircle2, XCircle, MessageSquare, Clock, AlertCircle } from "lucide-react";
import {
  useMyRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  confirmCompletion,
} from "@/lib/services/requestService";
import { reconcileMyPostStatuses } from "@/lib/services/postService";
import { useUsers } from "@/lib/services/demoService";
import { RequestStatusBadge } from "@/components/common/StatusBadge";
import { groupShort } from "@/lib/constants";
import { formatWhen, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function RequestsPage() {
  const router = useRouter();
  const conversations = useAppStore((state) => state.conversations);
  const { incoming, outgoing } = useMyRequests();
  // All posts in any status: an accepted/completed request's post is no longer
  // "open", so usePosts() would miss it and the card would say "Direct request"
  const allPosts = useAppStore((state) => state.posts);
  const allUsers = useUsers();

  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Repair posts left "in progress" after the helper confirmed completion last
  const requestsSignature = [...incoming, ...outgoing].map((r) => `${r.id}:${r.status}`).join(",");
  useEffect(() => {
    reconcileMyPostStatuses();
  }, [requestsSignature]);
  const [actionError, setActionError] = useState<string | null>(null);

  const getPost = (postId: string | null) => {
    if (!postId) return null;
    return allPosts.find((p) => p.id === postId) ?? null;
  };

  const getUser = (userId: string) => {
    return allUsers.find((u) => u.id === userId) ?? null;
  };

  const handleAccept = async (requestId: string) => {
    setActionError(null);
    setLoadingId(requestId);
    try {
      await acceptRequest(requestId);
      // Chat is now unlocked: take the member to the exchange so they can start talking
      router.push(`/my-activity?tab=inprogress&highlight=${encodeURIComponent(requestId)}`);
    } catch (err: any) {
      setActionError(err?.message || "Failed to accept request.");
      setLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm("Are you sure you want to decline this request?")) return;
    setActionError(null);
    setLoadingId(requestId);
    try {
      await rejectRequest(requestId);
    } catch (err: any) {
      setActionError(err?.message || "Failed to decline request.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!confirm("Cancel your pending request?")) return;
    setActionError(null);
    setLoadingId(requestId);
    try {
      await cancelRequest(requestId);
    } catch (err: any) {
      setActionError(err?.message || "Failed to cancel request.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmDone = async (requestId: string) => {
    setActionError(null);
    setLoadingId(requestId);
    try {
      const res = await confirmCompletion(requestId);
      if (res.completed && res.activityId) {
        router.push(`/feedback/${res.activityId}`);
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to update completion.");
    } finally {
      setLoadingId(null);
    }
  };

  const conversationHref = (requestId: string) => {
    const convo = conversations.find((c) => c.requestId === requestId);
    return convo ? `/chat?id=${convo.id}` : "/chat";
  };

  const tabs = [
    { id: "incoming" as const, label: "Incoming for Me", short: "Incoming", icon: Inbox, count: incoming.length, active: "border-primary text-primary" },
    { id: "outgoing" as const, label: "Sent by Me", short: "Sent", icon: Send, count: outgoing.length, active: "border-secondary text-secondary" },
  ];

  const list = activeTab === "incoming" ? incoming : outgoing;

  return (
    <AuthGuard>
      <div className="pb-12 sm:pb-16">
        <section className="border-b border-border bg-gradient-to-b from-card to-background">
          <div className="page-container max-w-5xl pt-8 sm:pt-12 space-y-5">
            <div className="space-y-1 animate-fade-up">
              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Service Requests</h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                Manage pending responses and connection requests. Once accepted, exchanges move to{" "}
                <Link href="/my-activity?tab=inprogress" className="text-primary font-bold hover:underline underline-offset-4">
                  In Progress
                </Link>{" "}
                and unlock private chat.
              </p>
            </div>

            <div role="tablist" aria-label="Request direction" className="flex gap-6">
              {tabs.map(({ id, label, short, icon: Icon, count, active }) => {
                const selected = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 pb-3 font-bold text-base sm:text-lg border-b-4 transition-colors duration-200 ${
                      selected ? active : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="page-container max-w-5xl pt-6 sm:pt-8 space-y-5">
          {actionError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/20 animate-in fade-in">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {actionError}
            </div>
          )}

          <div key={activeTab} role="tabpanel" className="space-y-4 animate-fade-in">
            {list.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border bg-card px-6 py-12 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  {activeTab === "incoming" ? (
                    <Inbox className="h-7 w-7 text-muted-foreground" />
                  ) : (
                    <Send className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                {activeTab === "incoming" ? (
                  <>
                    <p className="text-base font-semibold text-foreground">No incoming requests right now.</p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      When neighbors respond to your posts or send you a direct connection request, they will appear here.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold text-foreground">You haven&apos;t sent any requests yet.</p>
                    <Button asChild>
                      <Link href="/posts">Browse Community Posts</Link>
                    </Button>
                  </>
                )}
              </div>
            ) : (
              list.map((req) => {
                const incomingReq = activeTab === "incoming";
                const other = getUser(incomingReq ? req.requesterId : req.ownerId);
                const post = getPost(req.postId);
                const isBusy = loadingId === req.id;
                const myDone = incomingReq ? req.ownerDone : req.requesterDone;

                return (
                  <article
                    key={req.id}
                    className="rounded-2xl border-2 border-border bg-card shadow-xs p-4 sm:p-6 space-y-4 transition-all duration-300 hover:shadow-soft hover:border-primary/20"
                  >
                    {/* Person + status */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
                      <Link href={`/profile/${other?.id ?? ""}`} className="group flex items-center gap-3 min-w-0">
                        <div
                          className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden transition-transform group-hover:scale-105 ${
                            incomingReq ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
                          }`}
                        >
                          {other?.avatarUrl ? (
                            <img src={other.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : other ? (
                            initials(other.fullName)
                          ) : (
                            "?"
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-muted-foreground block">{incomingReq ? "From" : "Sent to"}</span>
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors truncate block">
                            {other?.fullName ?? "Community Member"}
                            {other && (
                              <span className="ml-2 text-xs font-semibold text-primary">{groupShort(other.userGroup)}</span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">Sent {formatWhen(req.createdAt)}</span>
                        </div>
                      </Link>
                      <RequestStatusBadge status={req.status} />
                    </div>

                    {/* Context */}
                    {post ? (
                      <p className="text-sm text-foreground">
                        {incomingReq ? "Regarding post: " : "For post: "}
                        <Link href={`/posts/${post.id}`} className="font-bold text-primary hover:underline underline-offset-4 break-words">
                          “{post.title}”
                        </Link>
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-secondary">Direct connection request</p>
                    )}

                    {req.message && (
                      <blockquote className="rounded-xl bg-muted/50 p-3.5 border-l-4 border-primary/40 text-sm text-foreground italic break-words">
                        “{req.message}”
                      </blockquote>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {req.status === "pending" &&
                        (incomingReq ? (
                          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                            <Button size="sm" onClick={() => handleAccept(req.id)} disabled={isBusy} className="font-bold gap-1.5">
                              {isBusy ? (
                                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(req.id)}
                              disabled={isBusy}
                              className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                            >
                              <XCircle className="h-4 w-4" />
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(req.id)}
                            disabled={isBusy}
                            className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel Request
                          </Button>
                        ))}

                      {req.status === "accepted" && (
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                          <Button asChild size="sm" className="gap-1.5 font-bold">
                            <Link href={conversationHref(req.id)}>
                              <MessageSquare className="h-4 w-4" />
                              Go to Chat
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmDone(req.id)}
                            disabled={isBusy || myDone}
                            className={`gap-1.5 font-semibold ${myDone ? "text-success border-success" : "hover:border-emerald-600 hover:text-emerald-700"}`}
                          >
                            {myDone ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {myDone ? (incomingReq ? "Waiting for other" : "Waiting for author") : "Mark Completed"}
                          </Button>
                        </div>
                      )}

                      {req.status === "completed" && (
                        <span className="text-sm font-semibold text-secondary flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          Activity completed & archived
                        </span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
