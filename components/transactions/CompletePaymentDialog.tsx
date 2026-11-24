"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchTransactions, getPaymentRequirement, payDemo, usePaymentRequirement } from "@/lib/services/transactionService";
import { initials, money } from "@/lib/utils";

type Step = "pay" | "processing" | "paid";

/**
 * Shown when the payer of a paid activity tries to mark it completed before
 * paying. Step 1: pay (demo). Step 2: mark the task completed.
 */
export function CompletePaymentDialog({
  requestId,
  open,
  onOpenChange,
  onMarkCompleted,
  completing = false,
}: {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful payment when the member presses "Mark as completed". */
  onMarkCompleted: () => void | Promise<void>;
  completing?: boolean;
}) {
  const req = usePaymentRequirement(requestId);
  const users = useAppStore((s) => s.users);
  const payee = users.find((u) => u.id === req.payeeId);
  const [step, setStep] = useState<Step>("pay");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setStep(req.paid ? "paid" : "pay");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestId]);

  const handlePay = async () => {
    if (!requestId) return;
    setError(null);
    setStep("processing");
    try {
      await payDemo(requestId);
      setStep("paid");
    } catch (err: any) {
      // Another tab may already have paid
      if (getPaymentRequirement(requestId).paid) setStep("paid");
      else {
        setError(err?.message || "The demo payment didn't go through. Please try again.");
        setStep("pay");
      }
    }
  };

  const amount = req.amount ?? 0;
  const busy = step === "processing" || completing;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title={step === "paid" ? "Payment complete" : "Complete the payment first"}
      description={
        step === "paid"
          ? "Thank you! You can now mark this task as completed."
          : "This activity was agreed as a paid exchange. Please complete the payment before marking the task as completed."
      }
      className="sm:max-w-md"
    >
      <div className="space-y-5">
        {/* Summary card */}
        <div className="overflow-hidden rounded-2xl border-2 border-border bg-gradient-to-br from-blue-50 via-card to-emerald-50">
          <div className="flex items-center justify-between gap-3 px-4 pt-4">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Amount due</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-900">
              <ShieldCheck className="h-3.5 w-3.5" /> Demo
            </span>
          </div>
          <p className="px-4 pb-1 text-4xl font-black tabular-nums text-foreground">{money(amount)}</p>
          {req.postTitle && <p className="truncate px-4 pb-3 text-sm text-muted-foreground">For “{req.postTitle}”</p>}
          <div className="flex items-center gap-3 border-t border-border/70 bg-card/70 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
              {payee?.avatarUrl ? <img src={payee.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(payee?.fullName ?? "?")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Paying to</p>
              <p className="truncate text-sm font-bold text-foreground">{payee?.fullName ?? "Community member"}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Steps */}
        <ol className="flex items-center gap-2 text-xs font-bold">
          <li className={`flex items-center gap-1.5 ${step === "paid" ? "text-emerald-700" : "text-primary"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step === "paid" ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground"}`}>
              {step === "paid" ? <CheckCircle2 className="h-4 w-4" /> : 1}
            </span>
            Pay
          </li>
          <li aria-hidden="true" className={`h-0.5 flex-1 rounded-full ${step === "paid" ? "bg-emerald-600" : "bg-border"}`} />
          <li className={`flex items-center gap-1.5 ${step === "paid" ? "text-primary" : "text-muted-foreground"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step === "paid" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</span>
            Mark completed
          </li>
        </ol>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {step === "paid" ? (
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-900">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              <p className="text-sm font-semibold">{money(amount)} paid successfully. A receipt is in your Transactions.</p>
            </div>
            <Button onClick={() => onMarkCompleted()} disabled={completing} size="lg" className="w-full gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700">
              {completing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              Mark as completed
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button onClick={handlePay} disabled={busy || !requestId} size="lg" className="w-full gap-2 font-bold">
              {step === "processing" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Processing payment…
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" /> Pay {money(amount)} now
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy} className="w-full font-semibold">
              Not now
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Demo payment — no real money is charged.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}

/**
 * Wraps "Mark completed": if the signed-in member still owes a demo payment,
 * opens the payment popup instead; otherwise runs the completion straight away.
 */
export function usePaymentGatedCompletion(complete: (requestId: string) => Promise<void>) {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  /** Returns true if the completion ran, false if the payment popup opened instead. */
  const start = useCallback(
    async (id: string) => {
      if (getPaymentRequirement(id).mustPay) {
        setRequestId(id);
        setOpen(true);
        return false;
      }
      await complete(id);
      return true;
    },
    [complete],
  );

  const dialog = (
    <CompletePaymentDialog
      requestId={requestId}
      open={open}
      onOpenChange={setOpen}
      completing={completing}
      onMarkCompleted={async () => {
        if (!requestId) return;
        setCompleting(true);
        try {
          await complete(requestId);
          setOpen(false);
        } finally {
          setCompleting(false);
        }
      }}
    />
  );

  return { start, dialog, openFor: (id: string) => (setRequestId(id), setOpen(true)) };
}
