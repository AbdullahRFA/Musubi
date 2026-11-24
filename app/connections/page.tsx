"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ban,
  Image as ImageIcon,
  Inbox,
  Loader2,
  MessageCircle,
  Search,
  Send,
  ShieldOff,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AuthGuard } from "@/components/common/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectionButton } from "@/components/connections/ConnectionButton";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchProfiles } from "@/lib/services/profileService";
import { fetchBlocks } from "@/lib/services/reportService";
import {
  acceptConnection,
  blockMember,
  declineConnection,
  removeConnection,
  unblockMember,
  useConnections,
} from "@/lib/services/connectionService";
import { useLastMessages } from "@/lib/services/dmService";
import { markAllNotificationsReadOfType, useUnreadByConversation } from "@/lib/services/notificationService";
import { timeAgo } from "@/components/notifications/notificationStyles";
import { groupShort } from "@/lib/constants";
import { initials } from "@/lib/utils";
import type { Connection, Profile } from "@/lib/types";

type Tab = "connections" | "requests" | "find" | "blocked";
const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "connections", label: "Connections", icon: Users },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "find", label: "Find people", icon: Search },
  { id: "blocked", label: "Blocked", icon: Ban },
];

function Avatar({ person, size = "h-12 w-12" }: { person: Profile | undefined; size?: string }) {
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold ring-2 ring-card shadow-xs`}>
      {person?.avatarUrl ? <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : initials(person?.fullName ?? "?")}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, action }: { icon: typeof Users; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-14 text-center animate-fade-up">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-extrabold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function useAction() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (id: string, fn: () => Promise<void>) => {
    setError(null);
    setBusyId(id);
    try {
      await fn();
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  };
  return { busyId, error, run, clearError: () => setError(null) };
}

/* -------------------------------------------------------------------------- */

function ConnectionsHub() {
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = (params.get("tab") as Tab) || "connections";
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === initialTab) ? initialTab : "connections");

  const myId = useAppStore((s) => s.sessionUserId);
  const users = useAppStore((s) => s.users);
  const blocks = useAppStore((s) => s.blocks);
  const { loaded, accepted, incoming, outgoing, otherOf } = useConnections();
  const unreadBy = useUnreadByConversation();
  const lastMessages = useLastMessages(accepted.map((c) => c.id));
  const { busyId, error, run, clearError } = useAction();

  useEffect(() => {
    fetchProfiles();
    fetchBlocks();
  }, []);

  // Opening the Requests tab clears the request badge
  useEffect(() => {
    if (tab === "requests") markAllNotificationsReadOfType("connection_request");
  }, [tab, incoming.length]);

  const switchTab = (next: Tab) => {
    setTab(next);
    clearError();
    router.replace(next === "connections" ? "/connections" : `/connections?tab=${next}`, { scroll: false });
  };

  const byId = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const blockedByMe = blocks.filter((b) => b.blockerId === myId);
  const hiddenIds = new Set(blocks.filter((b) => b.blockerId === myId || b.blockedId === myId).map((b) => (b.blockerId === myId ? b.blockedId : b.blockerId)));

  // Conversations sorted by latest activity
  const sortedAccepted = useMemo(() => {
    return accepted
      .filter((c) => !hiddenIds.has(otherOf(c)))
      .slice()
      .sort((a, b) => {
        const ta = lastMessages[a.id]?.createdAt ?? a.updatedAt;
        const tb = lastMessages[b.id]?.createdAt ?? b.updatedAt;
        return tb.localeCompare(ta);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accepted, lastMessages, blocks]);

  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");

  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.id !== myId && !hiddenIds.has(u.id))
      .filter((u) => !q || u.fullName.toLowerCase().includes(q) || (u.location ?? "").toLowerCase().includes(q) || u.skills.some((s) => s.toLowerCase().includes(q)))
      .slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, query, myId, blocks]);

  const counts: Record<Tab, number> = {
    connections: sortedAccepted.length,
    requests: incoming.length,
    find: 0,
    blocked: blockedByMe.length,
  };

  const preview = (c: Connection) => {
    const m = lastMessages[c.id];
    if (!m) return "You're connected — say hello!";
    const prefix = m.senderId === myId ? "You: " : "";
    if (m.deletedAt) return `${prefix}Message deleted`;
    if (!m.body && m.imagePath) return `${prefix}📷 Photo`;
    return `${prefix}${m.body}`;
  };

  return (
    <div className="page-container max-w-4xl py-6 sm:py-10 space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-border bg-gradient-to-br from-amber-50 via-orange-50 to-[#E7EEE4] px-5 py-6 sm:px-8 sm:py-8 shadow-soft animate-fade-up">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-secondary/15 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Your connections</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Connect with members across generations and keep in touch with private messages.
            </p>
          </div>
          <div className="flex gap-3 text-center">
            <div className="rounded-2xl bg-card/80 px-4 py-2 shadow-xs">
              <p className="text-xl font-black text-primary tabular-nums">{sortedAccepted.length}</p>
              <p className="text-xs font-semibold text-muted-foreground">Connected</p>
            </div>
            <div className="rounded-2xl bg-card/80 px-4 py-2 shadow-xs">
              <p className="text-xl font-black text-secondary tabular-nums">{incoming.length}</p>
              <p className="text-xs font-semibold text-muted-foreground">Requests</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div role="tablist" aria-label="Connections sections" className="flex gap-1 overflow-x-auto rounded-2xl border-2 border-border bg-card p-1 shadow-xs scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => switchTab(id)}
              className={`relative flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {counts[id] > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                    active ? "bg-primary-foreground/20" : id === "requests" ? "bg-destructive text-destructive-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {counts[id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
          <button onClick={clearError} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!loaded ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div role="tabpanel" className="animate-in fade-in duration-300">
          {/* ---------------- Connections / inbox ---------------- */}
          {tab === "connections" &&
            (sortedAccepted.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No connections yet"
                body="Find members you'd like to keep in touch with and send them a connection request."
                action={
                  <Button onClick={() => switchTab("find")} className="gap-2 font-bold">
                    <UserPlus className="h-4 w-4" /> Find people
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {sortedAccepted.length > 6 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search your connections" className="pl-9" />
                  </div>
                )}
                <ul className="overflow-hidden rounded-3xl border-2 border-border bg-card shadow-xs divide-y divide-border">
                  {sortedAccepted
                    .filter((c) => !filter || (byId.get(otherOf(c))?.fullName ?? "").toLowerCase().includes(filter.toLowerCase()))
                    .map((c) => {
                      const other = byId.get(otherOf(c));
                      const unread = unreadBy[`dm:${c.id}`] ?? 0;
                      const last = lastMessages[c.id];
                      return (
                        <li key={c.id} className="group flex items-center gap-3 px-3 py-3 sm:px-4 transition-colors hover:bg-muted/50">
                          <Link href={`/connections/chat/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="relative">
                              <Avatar person={other} />
                              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-primary" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className={`truncate text-sm sm:text-base ${unread ? "font-black" : "font-bold"} text-foreground`}>
                                  {other?.fullName ?? "Member"}
                                </p>
                                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(last?.createdAt ?? c.updatedAt)}</span>
                              </div>
                              <p className={`flex items-center gap-1 truncate text-sm ${unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                {last && !last.body && last.imagePath && !last.deletedAt && <ImageIcon className="h-3.5 w-3.5 shrink-0" />}
                                <span className="truncate">{preview(c)}</span>
                              </p>
                            </div>
                            {unread > 0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                                {unread > 9 ? "9+" : unread}
                              </span>
                            )}
                          </Link>
                          <div className="flex shrink-0 items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex" title="Message">
                              <Link href={`/connections/chat/${c.id}`} aria-label="Message">
                                <MessageCircle className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busyId === c.id}
                              title="Remove connection"
                              aria-label={`Remove ${other?.fullName ?? "connection"}`}
                              onClick={() => {
                                if (confirm(`Remove ${other?.fullName ?? "this member"} from your connections? Your messages with them will be deleted.`)) {
                                  run(c.id, () => removeConnection(c.id));
                                }
                              }}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              {busyId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}

          {/* ---------------- Requests ---------------- */}
          {tab === "requests" && (
            <div className="space-y-8">
              <section className="space-y-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">Received ({incoming.length})</h2>
                {incoming.length === 0 ? (
                  <EmptyState icon={Inbox} title="No pending requests" body="When someone wants to connect with you, their request will appear here." />
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {incoming.map((c) => {
                      const other = byId.get(c.requesterId);
                      return (
                        <li key={c.id} className="card-hover flex flex-col gap-4 rounded-2xl border-2 border-border bg-card p-4 animate-fade-up">
                          <Link href={`/profile/${c.requesterId}`} className="flex items-center gap-3 min-w-0">
                            <Avatar person={other} size="h-14 w-14" />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-foreground hover:text-primary">{other?.fullName ?? "Member"}</p>
                              <p className="text-xs text-muted-foreground">
                                {other ? `${groupShort(other.userGroup)} · ` : ""}
                                {timeAgo(c.updatedAt)}
                              </p>
                            </div>
                          </Link>
                          <div className="grid grid-cols-2 gap-2">
                            <Button disabled={busyId === c.id} onClick={() => run(c.id, () => acceptConnection(c.id))} className="gap-1.5 font-bold">
                              {busyId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                              Accept
                            </Button>
                            <Button variant="outline" disabled={busyId === c.id} onClick={() => run(c.id, () => declineConnection(c.id))} className="font-semibold">
                              Decline
                            </Button>
                          </div>
                          <button
                            type="button"
                            disabled={busyId === c.id}
                            onClick={() => {
                              if (confirm(`Block ${other?.fullName ?? "this member"}? They won't be able to find you, message you, or send requests.`)) {
                                run(c.id, () => blockMember(c.requesterId));
                              }
                            }}
                            className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Ban className="h-3.5 w-3.5" /> Block
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">Sent ({outgoing.length})</h2>
                {outgoing.length === 0 ? (
                  <p className="rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">You haven&apos;t sent any requests.</p>
                ) : (
                  <ul className="overflow-hidden rounded-2xl border-2 border-border bg-card divide-y divide-border">
                    {outgoing.map((c) => {
                      const other = byId.get(c.addresseeId);
                      return (
                        <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                          <Link href={`/profile/${c.addresseeId}`} className="flex min-w-0 flex-1 items-center gap-3">
                            <Avatar person={other} size="h-10 w-10" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">{other?.fullName ?? "Member"}</p>
                              <p className="text-xs text-muted-foreground">Requested {timeAgo(c.createdAt)}</p>
                            </div>
                          </Link>
                          <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => run(c.id, () => removeConnection(c.id))} className="gap-1.5 font-semibold">
                            {busyId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            Cancel
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          )}

          {/* ---------------- Find people ---------------- */}
          {tab === "find" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, place or skill"
                  className="pl-9"
                  autoFocus
                  aria-label="Search members"
                />
              </div>
              {people.length === 0 ? (
                <EmptyState icon={Search} title="No members found" body="Try a different name, place or skill." />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {people.map((person) => (
                    <li key={person.id} className="card-hover flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-3 sm:p-4">
                      <Link href={`/profile/${person.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar person={person} />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-foreground hover:text-primary">{person.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {groupShort(person.userGroup)}
                            {person.location ? ` · ${person.location}` : ""}
                          </p>
                        </div>
                      </Link>
                      <ConnectionButton userId={person.id} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ---------------- Blocked ---------------- */}
          {tab === "blocked" &&
            (blockedByMe.length === 0 ? (
              <EmptyState icon={ShieldOff} title="You haven't blocked anyone" body="Blocked members can't see your posts, message you or send you connection requests." />
            ) : (
              <ul className="overflow-hidden rounded-2xl border-2 border-border bg-card divide-y divide-border">
                {blockedByMe.map((b) => {
                  const other = byId.get(b.blockedId);
                  return (
                    <li key={b.blockedId} className="flex items-center gap-3 px-4 py-3">
                      <Avatar person={other} size="h-10 w-10" />
                      <p className="min-w-0 flex-1 truncate font-semibold text-foreground">{other?.fullName ?? "Member"}</p>
                      <Button size="sm" variant="outline" disabled={busyId === b.blockedId} onClick={() => run(b.blockedId, () => unblockMember(b.blockedId))} className="font-semibold">
                        {busyId === b.blockedId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unblock"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ))}
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Send className="h-3.5 w-3.5" />
        These private messages are separate from the chats about posts and requests.
      </p>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <ConnectionsHub />
      </Suspense>
    </AuthGuard>
  );
}
