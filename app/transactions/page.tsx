"use client";

import Link from "next/link";
import { useState } from "react";
import { Coins, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useTransactions, payDemo } from "@/lib/services/transactionService";
import { useMyRequests } from "@/lib/services/requestService";
import { usePosts } from "@/lib/services/postService";
import { useUsers } from "@/lib/services/demoService";
import { useSession } from "@/lib/services/authService";
import { money, formatWhen } from "@/lib/utils";
import { TransactionStatusBadge } from "@/components/common/StatusBadge";
import { DemoPaymentBanner } from "@/components/common/DemoPaymentBanner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function TransactionsPage() {
  const session = useSession();
  const transactions = useTransactions();
  const { incoming, outgoing } = useMyRequests();
  const allPosts = usePosts();
  const allUsers = useUsers();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Find accepted requests that have a monetary payment attached
  const payableRequests = [...incoming, ...outgoing].filter((req) => {
    if (req.status !== "accepted") return false;
    const post = req.postId ? allPosts.find((p) => p.id === req.postId) : null;
    return post && post.exchangeMethod === "payment" && post.amount;
  });

  const getUser = (id: string) => allUsers.find((u) => u.id === id);

  const handlePay = async (requestId: string) => {
    setError(null);
    setProcessingId(requestId);
    try {
      await payDemo(requestId);
    } catch (err: any) {
      setError(err?.message || "Demo payment simulation encountered an issue.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6 space-y-1">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
            <Coins className="h-7 w-7 text-amber-600" />
            <span>Demo Payments & Records</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Simulated demonstration payments for exchange services.
          </p>
        </div>

        {/* Global Demo Banner */}
        <DemoPaymentBanner />

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pending / Active Requests requiring demo payment */}
        {payableRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Action Needed: Pending Demo Settlements</h2>
            <div className="grid grid-cols-1 gap-4">
              {payableRequests.map((req) => {
                const post = allPosts.find((p) => p.id === req.postId);
                const isPayer =
                  post?.postType === "offer"
                    ? req.requesterId === session?.id
                    : req.ownerId === session?.id;

                const otherUser = getUser(req.requesterId === session?.id ? req.ownerId : req.requesterId);
                const isBusy = processingId === req.id;

                return (
                  <Card key={req.id} className="border-2 border-blue-200 bg-blue-50/40 p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">
                          {post?.title ?? "Service Agreement"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Partner: <strong className="text-foreground">{otherUser?.fullName}</strong> · Agreed Demo Amount:{" "}
                          <strong className="text-primary font-mono text-base">{money(post?.amount ?? 15)}</strong>
                        </p>
                      </div>

                      {isPayer ? (
                        <Button
                          onClick={() => handlePay(req.id)}
                          disabled={isBusy}
                          className="font-bold bg-blue-700 hover:bg-blue-800 text-white gap-2"
                        >
                          <Coins className="h-4 w-4" />
                          <span>{isBusy ? "Processing demo transaction..." : `Pay (Demo) ${money(post?.amount ?? 15)}`}</span>
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-blue-900 bg-blue-100 px-3 py-1.5 rounded-md">
                          Waiting for partner to trigger demo payment
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Transaction History Table / Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Transaction Log</h2>

          {transactions.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 text-center space-y-2">
              <p className="text-base font-semibold text-foreground">No transaction history yet.</p>
              <p className="text-sm text-muted-foreground">
                When you initiate demo payments on accepted posts, receipts will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const payer = getUser(tx.payerId);
                const payee = getUser(tx.payeeId);
                const isPayer = tx.payerId === session?.id;

                return (
                  <Card key={tx.id} className="border-2 border-border bg-card p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground font-mono">
                            {money(tx.amount)}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">(DEMO)</span>
                          <TransactionStatusBadge status={tx.status} />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {isPayer ? (
                            <>Sent to <strong className="text-foreground">{payee?.fullName ?? "Partner"}</strong></>
                          ) : (
                            <>Received from <strong className="text-foreground">{payer?.fullName ?? "Partner"}</strong></>
                          )}
                          {" · "}Recorded {formatWhen(tx.createdAt)}
                        </p>
                      </div>

                      {tx.status === "failed" && isPayer && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePay(tx.requestId)}
                          disabled={processingId === tx.requestId}
                          className="gap-1.5 text-xs font-bold text-destructive hover:bg-destructive/10"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Retry Simulation</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
