"use client";

import { useState } from "react";
import { Coins, Clock, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownLeft, Receipt } from "lucide-react";
import { useTransactions, payDemo } from "@/lib/services/transactionService";
import { useMyRequests } from "@/lib/services/requestService";
import { usePosts } from "@/lib/services/postService";
import { useUsers } from "@/lib/services/demoService";
import { useSession } from "@/lib/services/authService";
import { money, formatWhen } from "@/lib/utils";
import { TransactionStatusBadge } from "@/components/common/StatusBadge";
import { DemoPaymentBanner } from "@/components/common/DemoPaymentBanner";
import { Button } from "@/components/ui/button";
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
    return post && post.exchangeMethod === "paid" && post.amount;
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

  // Summary figures for successful demo transactions
  const successful = transactions.filter((tx) => tx.status === "successful");
  const totalSent = successful.filter((tx) => tx.payerId === session?.id).reduce((sum, tx) => sum + tx.amount, 0);
  const totalReceived = successful.filter((tx) => tx.payeeId === session?.id).reduce((sum, tx) => sum + tx.amount, 0);

  const stats = [
    { label: "Sent (demo)", value: money(totalSent), icon: ArrowUpRight, className: "text-rose-700 bg-rose-50" },
    { label: "Received (demo)", value: money(totalReceived), icon: ArrowDownLeft, className: "text-emerald-700 bg-emerald-50" },
    { label: "Records", value: String(transactions.length), icon: Receipt, className: "text-blue-700 bg-blue-50" },
  ];

  return (
    <AuthGuard>
      <div className="page-container max-w-4xl py-6 sm:py-10 space-y-6">
        <div className="space-y-1 animate-fade-up">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Coins className="h-5 w-5" />
            </span>
            Demo Payments & Records
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Simulated demonstration payments for exchange services.</p>
        </div>

        <DemoPaymentBanner />

        {/* Summary */}
        <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 animate-fade-up [animation-delay:100ms]">
          {stats.map(({ label, value, icon: Icon, className }) => (
            <div
              key={label}
              className="flex min-[480px]:flex-col items-center min-[480px]:items-start gap-3 rounded-2xl border-2 border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${className}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-foreground tabular-nums">{value}</div>
                <div className="text-xs font-semibold text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/20 animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Action needed */}
        {payableRequests.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Action Needed: Pending Demo Settlements</h2>
            <div className="space-y-3">
              {payableRequests.map((req) => {
                const post = allPosts.find((p) => p.id === req.postId);
                const isPayer = post?.postType === "offer" ? req.requesterId === session?.id : req.ownerId === session?.id;
                const otherUser = getUser(req.requesterId === session?.id ? req.ownerId : req.requesterId);
                const isBusy = processingId === req.id;
                const amount = money(post?.amount ?? 15);

                return (
                  <article
                    key={req.id}
                    className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-shadow hover:shadow-soft"
                  >
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-bold text-base sm:text-lg text-foreground break-words">{post?.title ?? "Service Agreement"}</h3>
                      <p className="text-sm text-muted-foreground">
                        Partner: <strong className="text-foreground">{otherUser?.fullName}</strong>
                        <span className="mx-1.5">·</span>
                        Agreed Demo Amount: <strong className="text-primary font-mono text-base">{amount}</strong>
                      </p>
                    </div>

                    {isPayer ? (
                      <Button
                        onClick={() => handlePay(req.id)}
                        disabled={isBusy}
                        className="w-full md:w-auto shrink-0 font-bold bg-blue-700 hover:bg-blue-800 hover:shadow-md text-white gap-2"
                      >
                        {isBusy ? (
                          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : (
                          <Coins className="h-4 w-4" />
                        )}
                        {isBusy ? "Processing demo transaction..." : `Pay (Demo) ${amount}`}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-900 bg-blue-100 px-3 py-2 rounded-lg shrink-0">
                        <Clock className="h-4 w-4" />
                        Waiting for partner to trigger demo payment
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Log */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Transaction Log</h2>

          {transactions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border bg-card px-6 py-12 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Receipt className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground">No transaction history yet.</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                When you initiate demo payments on accepted posts, receipts will show up here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {transactions.map((tx) => {
                const isPayer = tx.payerId === session?.id;
                const counterpart = getUser(isPayer ? tx.payeeId : tx.payerId);
                const DirIcon = isPayer ? ArrowUpRight : ArrowDownLeft;

                return (
                  <li
                    key={tx.id}
                    className="rounded-2xl border-2 border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 hover:border-primary/20 hover:shadow-soft"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          isPayer ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <DirIcon className="h-5 w-5" />
                      </span>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-base text-foreground font-mono">{money(tx.amount)}</span>
                          <span className="text-xs text-muted-foreground font-mono">(DEMO)</span>
                          <TransactionStatusBadge status={tx.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isPayer ? "Sent to " : "Received from "}
                          <strong className="text-foreground">{counterpart?.fullName ?? "Partner"}</strong>
                          {" · "}Recorded {formatWhen(tx.createdAt)}
                        </p>
                      </div>
                    </div>

                    {tx.status === "failed" && isPayer && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePay(tx.requestId)}
                        disabled={processingId === tx.requestId}
                        className="gap-1.5 font-bold text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                      >
                        <RefreshCw className={`h-4 w-4 ${processingId === tx.requestId ? "animate-spin" : ""}`} />
                        Retry Simulation
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AuthGuard>
  );
}
