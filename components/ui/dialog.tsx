"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible modal built on Radix Dialog: focus trap, Escape to close,
 * scroll lock. Renders as a bottom sheet on phones and a centred card on
 * larger screens.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-200" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-[61] inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-3xl border-2 border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lift animate-in fade-in slide-in-from-bottom-4 duration-300",
            "sm:inset-0 sm:m-auto sm:h-fit sm:w-[calc(100%-2rem)] sm:max-w-md sm:rounded-2xl sm:p-6 sm:zoom-in-95",
            className
          )}
        >
          {/* Grab handle on mobile */}
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border sm:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-lg sm:text-xl font-bold text-foreground">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-sm text-muted-foreground">{description}</DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
