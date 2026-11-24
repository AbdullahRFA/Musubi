"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useConnectionCount, useMutualConnections } from "@/lib/services/connectionService";
import { initials } from "@/lib/utils";

function formatCount(n: number) {
  if (n >= 500) return "500+"; // LinkedIn-style cap
  return n.toLocaleString();
}

/**
 * LinkedIn-style connections tile for a profile:
 * "12 connections" and, on other members' profiles, "3 mutual connections"
 * with overlapping avatars. On my own profile it links to my connections.
 */
export function ProfileConnectionsCard({ userId, isMe, firstName }: { userId: string; isMe: boolean; firstName: string }) {
  const count = useConnectionCount(userId);
  const mutualIds = useMutualConnections(isMe ? null : userId);
  const users = useAppStore((s) => s.users);
  const mutuals = mutualIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as NonNullable<(typeof users)[number]>[];

  const loading = count === undefined;
  // Count unavailable (database function not installed yet) — hide on others' profiles
  if (count === null && !isMe) return null;
  const label = count === 1 ? "connection" : "connections";

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">Connections</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
          <Users className="h-4 w-4" />
        </span>
      </div>

      {loading ? (
        <div className="mt-1 h-8 w-24 animate-pulse rounded-md bg-muted" aria-label="Loading connections" />
      ) : (
        <p className="-mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold tabular-nums text-foreground">{formatCount(count ?? 0)}</span>
          <span className="text-sm font-semibold text-muted-foreground">{label}</span>
        </p>
      )}

      {/* Mutual connections (other profiles only) */}
      {!isMe && mutuals.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex -space-x-2">
            {mutuals.slice(0, 3).map((m) => (
              <span
                key={m.id}
                title={m.fullName}
                className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-secondary text-[9px] font-bold text-secondary-foreground"
              >
                {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(m.fullName)}
              </span>
            ))}
          </div>
          <span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
            {mutuals.length === 1
              ? `${mutuals[0].fullName.split(" ")[0]} is a mutual connection`
              : `${mutuals[0].fullName.split(" ")[0]} and ${mutuals.length - 1} other mutual connection${mutuals.length > 2 ? "s" : ""}`}
          </span>
        </div>
      )}

      {isMe ? (
        <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-bold text-primary">
          {count ? "View your connections" : "Find people to connect with"}
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      ) : (
        !loading &&
        mutuals.length === 0 &&
        count === 0 && <span className="mt-2 block text-xs text-muted-foreground">Be the first to connect with {firstName}.</span>
      )}
    </>
  );

  const shell = "group block rounded-xl border p-4 transition-all duration-200";
  return isMe ? (
    <Link
      href={count ? "/connections" : "/connections?tab=find"}
      className={`${shell} border-primary/25 bg-primary/[0.04] hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.07] hover:shadow-soft`}
    >
      {body}
    </Link>
  ) : (
    <div className={`${shell} border-border bg-muted/40 hover:bg-muted/70`}>{body}</div>
  );
}
