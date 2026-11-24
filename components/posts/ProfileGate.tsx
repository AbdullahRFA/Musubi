"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, Circle, UserRoundPen } from "lucide-react";
import { useProfileCompletion } from "@/lib/profileCompletion";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Blocks post creation until the member's profile is complete. Shows a
 * pop-up listing exactly what's missing, with a link to the profile editor
 * that returns here afterwards. The form itself is never rendered for an
 * incomplete profile.
 */
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, complete, items, percent } = useProfileCompletion();

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 p-8 text-muted-foreground">
        <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Checking your profile...
      </div>
    );
  }

  if (complete) return <>{children}</>;

  const editHref = `/profile/edit?next=${encodeURIComponent(pathname || "/quick-post")}`;

  return (
    <>
      {/* Placeholder behind the pop-up so the page never shows an unusable form */}
      <div className="page-container max-w-3xl py-16">
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
          <UserRoundPen className="mx-auto h-10 w-10 text-primary" />
          <p className="text-lg font-bold text-foreground">Complete your profile to create a post</p>
          <Button asChild>
            <Link href={editHref}>Complete my profile</Link>
          </Button>
        </div>
      </div>

      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) router.push("/posts");
        }}
        title="Complete your profile first"
        description="Neighbours trust posts more when they can see who is asking. Please finish these details, then you can create your post."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Profile completeness</span>
              <span className="tabular-nums text-primary">{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-2.5 text-sm">
                {item.done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/60" />
                )}
                <span className={item.done ? "text-muted-foreground line-through" : "font-semibold text-foreground"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.push("/posts")}>
              Not now
            </Button>
            <Button asChild className="font-bold">
              <Link href={editHref}>
                <UserRoundPen className="h-4 w-4" />
                Complete my profile
              </Link>
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
