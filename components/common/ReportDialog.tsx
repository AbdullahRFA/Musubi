"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Flag } from "lucide-react";
import type { ReportTarget } from "@/lib/types";
import { REPORT_REASONS } from "@/lib/constants";
import { reportContent } from "@/lib/services/reportService";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Accessible report dialog for posts and user profiles. Reasons are shown as
 * large radio cards so they're easy to tap for older users.
 */
export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTarget;
  targetId: string;
  /** Human-readable name of what is being reported, e.g. the post title. */
  targetLabel: string;
}) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Reset whenever the dialog is reopened
  useEffect(() => {
    if (open) {
      setReason(REPORT_REASONS[0]);
      setError(null);
      setDone(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await reportContent(targetType, targetId, reason);
      setDone(true);
      setTimeout(() => onOpenChange(false), 1800);
    } catch (err: any) {
      setError(err?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const noun = targetType === "post" ? "post" : "profile";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !submitting && onOpenChange(next)}
      title={targetType === "post" ? "Report this post" : "Report Inappropriate Profile"}
      description={
        done ? undefined : (
          <>
            Why are you reporting <strong className="text-foreground">{targetLabel}</strong>? Your report is private.
          </>
        )
      }
    >
      {done ? (
        <div role="status" className="py-4 text-center space-y-3 animate-in fade-in zoom-in-95">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="font-bold text-foreground">Thank you. Your report has been submitted for review.</p>
          <p className="text-sm text-muted-foreground">The {noun}&apos;s owner won&apos;t be told who reported it.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div role="alert" className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <fieldset>
            <legend className="sr-only">Reason</legend>
            <div role="radiogroup" className="grid gap-2">
              {REPORT_REASONS.map((r) => {
                const selected = reason === r;
                return (
                  <label
                    key={r}
                    className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      selected
                        ? "border-destructive/60 bg-destructive/5 text-foreground"
                        : "border-border bg-background text-foreground hover:border-destructive/30 hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`report-reason-${targetId}`}
                      value={r}
                      checked={selected}
                      onChange={() => setReason(r)}
                      className="h-4 w-4 accent-[#9f1239]"
                    />
                    {r}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" className="font-bold gap-1.5" disabled={submitting}>
              {submitting ? (
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
