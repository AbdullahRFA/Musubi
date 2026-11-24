"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, MessageCircle, UserCheck, UserPlus, X } from "lucide-react";
import { useSession } from "@/lib/services/authService";
import {
  acceptConnection,
  declineConnection,
  removeConnection,
  sendConnectionRequest,
  useConnectionWith,
} from "@/lib/services/connectionService";
import { Button } from "@/components/ui/button";

type Size = "sm" | "default";

/**
 * Facebook-style relationship button: Connect → Requested (cancel) →
 * Accept / Decline for incoming → Message once connected.
 */
export function ConnectionButton({ userId, size = "default", className = "" }: { userId: string; size?: Size; className?: string }) {
  const session = useSession();
  const router = useRouter();
  const state = useConnectionWith(userId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session?.id === userId) return null;

  const run = async (fn: () => Promise<void>) => {
    if (!session) {
      router.push("/login");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const spinner = <Loader2 className="h-4 w-4 animate-spin" />;
  let content: React.ReactNode;

  switch (state.kind) {
    case "blocked":
      content = (
        <Button size={size} variant="outline" disabled className="gap-1.5 font-semibold">
          Blocked
        </Button>
      );
      break;
    case "connected":
      content = (
        <Button asChild size={size} className="gap-1.5 font-bold">
          <Link href={`/connections/chat/${state.connection.id}`}>
            <MessageCircle className="h-4 w-4" />
            Message
          </Link>
        </Button>
      );
      break;
    case "outgoing":
      content = (
        <Button
          size={size}
          variant="outline"
          disabled={busy}
          onClick={() => run(() => removeConnection(state.connection.id))}
          className="group gap-1.5 font-semibold"
          title="Cancel request"
        >
          {busy ? spinner : <Clock className="h-4 w-4 group-hover:hidden" />}
          {!busy && <X className="hidden h-4 w-4 group-hover:block" />}
          <span className="group-hover:hidden">Requested</span>
          <span className="hidden group-hover:inline">Cancel request</span>
        </Button>
      );
      break;
    case "incoming":
      content = (
        <div className="flex items-center gap-1.5">
          <Button size={size} disabled={busy} onClick={() => run(() => acceptConnection(state.connection.id))} className="gap-1.5 font-bold">
            {busy ? spinner : <UserCheck className="h-4 w-4" />}
            Accept
          </Button>
          <Button
            size={size}
            variant="outline"
            disabled={busy}
            onClick={() => run(() => declineConnection(state.connection.id))}
            className="font-semibold"
            aria-label="Decline request"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
      break;
    default:
      content = (
        <Button size={size} variant="secondary" disabled={busy} onClick={() => run(() => sendConnectionRequest(userId))} className="gap-1.5 font-bold">
          {busy ? spinner : <UserPlus className="h-4 w-4" />}
          Connect
        </Button>
      );
  }

  return (
    <div className={`inline-flex flex-col items-stretch ${className}`}>
      {content}
      {error && (
        <span role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
