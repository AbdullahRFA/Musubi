"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "See more" / "See less" controls with a progress bar, shared by the posts
 * and search pages so pagination looks and behaves the same everywhere.
 */
export function LoadMoreControls({
  shown,
  total,
  pageSize,
  onMore,
  onLess,
  noun = "posts",
}: {
  shown: number;
  total: number;
  pageSize: number;
  onMore: () => void;
  onLess: () => void;
  /** Plural noun for the "seen all" message, e.g. "posts" or "people". */
  noun?: string;
}) {
  const remaining = Math.max(0, total - shown);
  const canShowLess = shown > pageSize;
  if (total <= pageSize) return null;

  return (
    <div className="flex flex-col items-center gap-3 pt-2 pb-16 md:pb-4">
      <div className="flex w-full flex-col items-stretch justify-center gap-2.5 min-[480px]:w-auto min-[480px]:flex-row min-[480px]:items-center">
        {remaining > 0 && (
          <Button type="button" variant="outline" size="lg" onClick={onMore} className="group min-w-[13rem] gap-2 rounded-full font-bold">
            See more
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">{remaining} more</span>
            <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
          </Button>
        )}
        {canShowLess && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onLess}
            className="group gap-2 rounded-full font-semibold text-muted-foreground hover:text-foreground"
          >
            See less
            <ChevronUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
          </Button>
        )}
      </div>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-smooth"
          style={{ width: `${(Math.min(shown, total) / total) * 100}%` }}
        />
      </div>
      {remaining === 0 && (
        <p className="text-sm font-semibold text-muted-foreground">
          You&apos;ve seen all {total} {noun}.
        </p>
      )}
    </div>
  );
}

/** Skeleton card used while results load. */
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
      <div className="h-1.5 w-full bg-muted" />
      <div className="space-y-4 p-5 animate-pulse">
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-6 w-24 rounded-full bg-muted" />
        </div>
        <div className="h-6 w-4/5 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-11/12 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-2.5 pt-2">
          <div className="h-9 w-9 rounded-full bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 rounded-lg bg-muted" />
          <div className="h-10 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
