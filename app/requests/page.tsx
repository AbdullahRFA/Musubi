"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Compass,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  useMyRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  confirmCompletion,
} from "@/lib/services/requestService";
import { useSession } from "@/lib/services/authService";
import { usePosts } from "@/lib/services/postService";
import { useUsers } from "@/lib/services/demoService";
import { RequestStatusBadge } from "@/components/common/StatusBadge";
import { groupShort } from "@/lib/constants";
import { formatWhen, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SafetyBanner } from "@/components/common/SafetyBanner";

export default function RequestsPage() {
  const session = useSession();
  const { incoming, outgoing } = useMyRequests();
  const allPosts = usePosts();
  const allUsers = useUsers();

  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const [loadingId, setLoadingId] = useState<string | null>(null);
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
    } catch (err: any) {
      setActionError(err?.message || "Failed to accept request.");
    } finally {
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
        window.location.href = `/feedback/${res.activityId}`;
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to update completion.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6 space-y-1">
          <h1 className="text-3xl font-extrabold text-foreground">Service Requests</h1>
          <p className="text-base text-muted-foreground">
            Manage pending responses and connection requests. Once accepted, exchanges move to{" "}
            <Link href="/my-activity?tab=inprogress" className="text-primary font-bold hover:underline">
              In Progress
            </Link>{" "}
            and unlock private chat.
          </p>
        </div>

        <SafetyBanner />

        {actionError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b-2 border-border gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("incoming")}
            className={`flex items-center gap-2 pb-3 font-bold text-lg border-b-4 transition-all -mb-[2px] ${
              activeTab === "incoming"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Inbox className="h-5 w-5" />
            <span>Incoming for Me ({incoming.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("outgoing")}
            className={`flex items-center gap-2 pb-3 font-bold text-lg border-b-4 transition-all -mb-[2px] ${
              activeTab === "outgoing"
                ? "border-secondary text-secondary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Send className="h-5 w-5" />
            <span>Sent by Me ({outgoing.length})</span>
          </button>
        </div>

        {/* INCOMING REQUESTS TAB */}
        {activeTab === "incoming" && (
          <div className="space-y-4">
            {incoming.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 text-center space-y-3">
                <p className="text-base font-semibold text-foreground">No incoming requests right now.</p>
                <p className="text-sm text-muted-foreground">
                  When neighbors respond to your posts or send you a direct connection request, they will appear here.
                </p>
              </div>
            ) : (
              incoming.map((req) => {
                const requester = getUser(req.requesterId);
                const post = getPost(req.postId);
                const isBusy = loadingId === req.id;

                return (
                  <Card key={req.id} className="border-2 border-border bg-card shadow-xs">
                    <CardContent className="p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                            {requester ? initials(requester.fullName) : "?"}
                          </div>
                          <div>
                            <Link href={`/profile/${req.requesterId}`} className="font-bold text-foreground hover:text-primary transition-colors text-base">
                              {requester?.fullName ?? "Community Member"}
                            </Link>
                            {requester && (
                              <span className="ml-2 text-xs font-semibold text-primary">
                                {groupShort(requester.userGroup)}
                              </span>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Sent {formatWhen(req.createdAt)}
                            </div>
                          </div>
                        </div>

                        <RequestStatusBadge status={req.status} />
                      </div>

                      {/* Associated Post or Direct */}
                      <div className="text-sm">
                        {post ? (
                          <div className="text-foreground">
                            Regarding post:{" "}
                            <Link href={`/posts/${post.id}`} className="font-bold text-primary hover:underline">
                              “{post.title}”
                            </Link>
                          </div>
                        ) : (
                          <div className="font-semibold text-secondary">Direct connection request</div>
                        )}
                      </div>

                      {/* Message body */}
                      {req.message && (
                        <div className="rounded-md bg-muted/50 p-3.5 border border-border/80 text-sm text-foreground italic">
                          “{req.message}”
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
                        {req.status === "pending" && (
                          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(req.id)}
                              disabled={isBusy}
                              className="font-bold bg-primary hover:bg-[#234336] text-white gap-1.5 w-full sm:w-auto text-xs h-8"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Accept</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(req.id)}
                              disabled={isBusy}
                              className="text-muted-foreground hover:text-destructive w-full sm:w-auto text-xs h-8"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Decline</span>
                            </Button>
                          </div>
                        )}

                        {req.status === "accepted" && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                            <Link href="/chat" className="w-full sm:w-auto">
                              <Button size="sm" variant="default" className="gap-1.5 font-bold w-full sm:w-auto text-xs h-8">
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>Go to Chat</span>
                              </Button>
                            </Link>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfirmDone(req.id)}
                              disabled={isBusy || req.ownerDone}
                              className={`gap-1.5 font-semibold w-full sm:w-auto text-xs h-8 ${
                                req.ownerDone ? "text-success border-success" : ""
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>
                                {req.ownerDone ? "Waiting for other" : "Mark Completed"}
                              </span>
                            </Button>
                          </div>
                        )}

                        {req.status === "completed" && (
                          <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Activity completed & archived
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* OUTGOING REQUESTS TAB */}
        {activeTab === "outgoing" && (
          <div className="space-y-4">
            {outgoing.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 text-center space-y-3">
                <p className="text-base font-semibold text-foreground">You haven&apos;t sent any requests yet.</p>
                <Link href="/posts">
                  <Button variant="default">Browse Community Posts</Button>
                </Link>
              </div>
            ) : (
              outgoing.map((req) => {
                const owner = getUser(req.ownerId);
                const post = getPost(req.postId);
                const isBusy = loadingId === req.id;

                return (
                  <Card key={req.id} className="border-2 border-border bg-card shadow-xs">
                    <CardContent className="p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {owner ? initials(owner.fullName) : "?"}
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Sent to:</span>
                            <Link href={`/profile/${req.ownerId}`} className="font-bold text-foreground hover:text-primary transition-colors text-base">
                              {owner?.fullName ?? "Community Member"}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              Sent {formatWhen(req.createdAt)}
                            </div>
                          </div>
                        </div>

                        <RequestStatusBadge status={req.status} />
                      </div>

                      {post ? (
                        <div className="text-sm text-foreground">
                          For post:{" "}
                          <Link href={`/posts/${post.id}`} className="font-bold text-primary hover:underline">
                            “{post.title}”
                          </Link>
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-secondary">Direct connection request</div>
                      )}

                      {req.message && (
                        <div className="rounded-md bg-muted/50 p-3.5 border border-border/80 text-sm text-foreground italic">
                          “{req.message}”
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {req.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(req.id)}
                            disabled={isBusy}
                            className="text-muted-foreground hover:text-destructive text-xs"
                          >
                            Cancel Request
                          </Button>
                        )}

                        {req.status === "accepted" && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                            <Link href="/chat" className="w-full sm:w-auto">
                              <Button size="sm" variant="default" className="gap-1.5 font-bold w-full sm:w-auto text-xs h-8">
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>Go to Chat</span>
                              </Button>
                            </Link>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfirmDone(req.id)}
                              disabled={isBusy || req.requesterDone}
                              className={`gap-1.5 font-semibold w-full sm:w-auto text-xs h-8 ${
                                req.requesterDone ? "text-success border-success" : ""
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>
                                {req.requesterDone ? "Waiting for author" : "Mark Completed"}
                              </span>
                            </Button>
                          </div>
                        )}

                        {req.status === "completed" && (
                          <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Activity completed & archived
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
