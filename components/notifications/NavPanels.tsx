"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, MessageCircle, Volume2, VolumeX } from "lucide-react";
import {
  useNotifications,
  useUnreadCount,
  useUnreadMessageCount,
  useUnreadByConversation,
  markNotificationRead,
  markAllActivityRead,
  markConversationRead,
  isSoundEnabled,
  setSoundEnabled,
} from "@/lib/services/notificationService";
import { useConversations } from "@/lib/services/chatService";
import { initials } from "@/lib/utils";
import { notificationStyle, timeAgo } from "@/components/notifications/notificationStyles";

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

/** Red count badge that pops and pings whenever the number goes up. */
export function CountBadge({ count, className = "" }: { count: number; className?: string }) {
  const prev = useRef(count);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (count > prev.current) setBump((b) => b + 1);
    prev.current = count;
  }, [count]);

  if (count <= 0) return null;
  return (
    <span className={`absolute flex ${className}`} aria-hidden="true">
      {bump > 0 && (
        <span key={bump} className="absolute inset-0 rounded-full bg-destructive opacity-60 animate-badge-ping" />
      )}
      <span
        key={`n-${bump}`}
        className="relative flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white ring-2 ring-card animate-in zoom-in-95"
      >
        {count > 9 ? "9+" : count}
      </span>
    </span>
  );
}

function usePanel() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const triggerClass = (open: boolean) =>
  `relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 ${
    open ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted hover:text-primary"
  }`;

const panelClass =
  "absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border-2 border-border bg-popover shadow-lift animate-in fade-in slide-in-from-top-2 duration-200 z-50";

/* -------------------------------------------------------------------------- */
/* Notifications (bell)                                                       */
/* -------------------------------------------------------------------------- */

export function NotificationsMenu({ label }: { label: string }) {
  const { open, setOpen, ref } = usePanel();
  const unread = useUnreadCount();

  return (
    <div ref={ref} className="relative">
      {/* Phones: go straight to the full page */}
      <Link href="/notifications" className={`md:hidden ${triggerClass(false)}`} aria-label={`${label}${unread ? ` (${unread})` : ""}`}>
        <Bell className="h-5 w-5" />
        <CountBadge count={unread} className="-top-0.5 -right-0.5" />
      </Link>
      {/* Desktop: Facebook-style dropdown */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${label}${unread ? ` (${unread} unread)` : ""}`}
        className={`hidden md:inline-flex ${triggerClass(open)}`}
      >
        <Bell className={`h-5 w-5 ${unread > 0 ? "origin-top animate-wiggle" : ""}`} key={unread} />
        <CountBadge count={unread} className="-top-0.5 -right-0.5" />
      </button>
      {open && <NotificationsPanel onClose={() => setOpen(false)} />}
    </div>
  );
}

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const all = useNotifications();
  const items = all.filter((n) => n.type !== "message");
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [sound, setSound] = useState(true);
  useEffect(() => setSound(isSoundEnabled()), []);

  const shown = (tab === "unread" ? items.filter((n) => !n.read) : items).slice(0, 8);
  const hasUnread = items.some((n) => !n.read);

  return (
    <div role="dialog" aria-label="Notifications" className={panelClass}>
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <h2 className="text-lg font-black text-foreground">Notifications</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!sound);
              setSound(!sound);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={sound ? "Mute alert sounds" : "Unmute alert sounds"}
            title={sound ? "Sound on" : "Sound off"}
          >
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          {hasUnread && (
            <button
              type="button"
              onClick={() => markAllActivityRead()}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 px-4 pb-2">
        {(["all", "unread"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`rounded-full px-3 py-1 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <ul className="max-h-[min(28rem,65vh)] overflow-y-auto overscroll-contain px-2 pb-2">
        {shown.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            {tab === "unread" ? "No unread notifications." : "You're all caught up!"}
          </li>
        ) : (
          shown.map((n) => {
            const { icon: Icon, className } = notificationStyle(n.type);
            return (
              <li key={n.id}>
                <Link
                  href={n.href}
                  onClick={() => {
                    if (!n.read) markNotificationRead(n.id);
                    onClose();
                  }}
                  className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors ${
                    n.read ? "hover:bg-muted/70" : "bg-primary/[0.05] hover:bg-primary/10"
                  }`}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${className}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${n.read ? "text-foreground" : "text-foreground font-semibold"}`}>
                      <span className="font-bold">{n.title}</span> · <span className="text-muted-foreground font-normal">{n.body}</span>
                    </p>
                    <span className={`text-xs ${n.read ? "text-muted-foreground" : "text-primary font-bold"}`}>{timeAgo(n.createdAt)}</span>
                  </div>
                  {!n.read && <span className="mt-4 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                </Link>
              </li>
            );
          })
        )}
      </ul>

      <Link
        href="/notifications"
        onClick={onClose}
        className="block border-t border-border py-3 text-center text-sm font-bold text-primary hover:bg-muted/60 transition-colors"
      >
        See all notifications
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Messages (messenger)                                                       */
/* -------------------------------------------------------------------------- */

export function MessagesMenu({ label }: { label: string }) {
  const { open, setOpen, ref } = usePanel();
  const unread = useUnreadMessageCount();

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${label}${unread ? ` (${unread} unread)` : ""}`}
        className={triggerClass(open)}
      >
        <MessageCircle className="h-5 w-5" />
        <CountBadge count={unread} className="-top-0.5 -right-0.5" />
      </button>
      {open && <MessagesPanel onClose={() => setOpen(false)} />}
    </div>
  );
}

function MessagesPanel({ onClose }: { onClose: () => void }) {
  const conversations = useConversations();
  const unreadBy = useUnreadByConversation();

  return (
    <div role="dialog" aria-label="Messages" className={panelClass}>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-black text-foreground">Chats</h2>
      </div>
      <ul className="max-h-[min(28rem,65vh)] overflow-y-auto overscroll-contain px-2 pb-2">
        {conversations.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            No conversations yet.
          </li>
        ) : (
          conversations.slice(0, 8).map(({ conversation, other, last }) => {
            const count = unreadBy[conversation.id] ?? 0;
            return (
              <li key={conversation.id}>
                <Link
                  href={`/chat?id=${conversation.id}`}
                  onClick={() => {
                    if (count) markConversationRead(conversation.id);
                    onClose();
                  }}
                  className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors ${
                    count ? "bg-[#315B4B]/[0.06] hover:bg-[#315B4B]/10" : "hover:bg-muted/70"
                  }`}
                >
                  <div className="h-12 w-12 shrink-0 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold overflow-hidden">
                    {other.avatarUrl ? (
                      <img src={other.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(other.fullName)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${count ? "font-black text-foreground" : "font-semibold text-foreground"}`}>
                      {other.fullName}
                    </p>
                    <p className={`text-xs truncate ${count ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {last ? last.body : "Say hello!"}
                      {last && <span className="text-muted-foreground font-normal"> · {timeAgo(last.createdAt)}</span>}
                    </p>
                  </div>
                  {count > 0 && (
                    <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })
        )}
      </ul>
      <Link
        href="/chat"
        onClick={onClose}
        className="block border-t border-border py-3 text-center text-sm font-bold text-[#315B4B] hover:bg-muted/60 transition-colors"
      >
        See all in Messages
      </Link>
    </div>
  );
}
