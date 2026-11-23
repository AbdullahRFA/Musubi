"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, MessageCircle, ArrowRight, X } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import {
  fetchNotifications,
  rowToNotification,
  markNotificationRead,
  markConversationRead,
  playAlertSound,
  unlockAudioOnFirstInteraction,
  conversationIdFromHref,
  getActiveConversation,
} from "@/lib/services/notificationService";
import type { Notification } from "@/lib/types";
import { fetchConversations } from "@/lib/services/chatService";

const TOAST_MS = 6000;
const BASE_TITLE = "Tsunagu Generations";

/**
 * Global live-notification engine (Messenger / Facebook style):
 * - Keeps the notification store in sync via Supabase Realtime + polling
 * - Detects newly arrived notifications from the store (regardless of how
 *   they arrived) and plays a sound, shows a toast and, when the tab is in
 *   the background, a system notification
 * - Messages for the conversation currently open are marked read silently
 * - Mirrors the unread count in the browser tab title, e.g. "(3) Tsunagu"
 */
export function NotificationToast() {
  const sessionUserId = useAppStore((state) => state.sessionUserId);
  const session = useAppStore((state) => state.users.find((u) => u.id === state.sessionUserId));
  const userId = session?.id || sessionUserId;
  const notifications = useAppStore((state) => state.notifications);

  const [toasts, setToasts] = useState<Notification[]>([]);
  const seenIds = useRef<Set<string> | null>(null);

  // Unlock audio on first interaction and ask for system-notification permission once
  useEffect(() => {
    const cleanup = unlockAudioOnFirstInteraction();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    return cleanup;
  }, []);

  // Realtime + polling: only keep the store in sync here; alerts are derived below
  useEffect(() => {
    seenIds.current = null; // re-seed for a new user without alerting on history
    if (!userId) return;

    let cancelled = false;
    // Seed "already seen" ids from the initial fetch so history never triggers alerts
    fetchNotifications().finally(() => {
      if (cancelled) return;
      const current = useAppStore.getState().notifications.filter((n) => n.userId === userId);
      seenIds.current = new Set(current.map((n) => n.id));
    });

    const supabase = createClient();
    const channel = supabase
      .channel(`notifs_live_${userId}_${Math.random().toString(36).substring(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const item = rowToNotification(payload.new);
            useAppStore.setState((state) => ({
              notifications: [item, ...state.notifications.filter((n) => n.id !== item.id)],
            }));
          } else if (payload.eventType === "UPDATE") {
            const item = rowToNotification(payload.new);
            useAppStore.setState((state) => ({
              notifications: state.notifications.map((n) => (n.id === item.id ? item : n)),
            }));
          }
        }
      )
      .subscribe();

    // Polling fallback keeps badges accurate when the socket is down / reconnecting
    const poll = setInterval(fetchNotifications, 3000);
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [userId]);

  // Detect new arrivals and alert
  useEffect(() => {
    if (!userId) return;
    const mine = notifications.filter((n) => n.userId === userId);

    // Not seeded yet (initial fetch still in flight) — nothing counts as new
    if (seenIds.current === null) return;

    const fresh = mine.filter((n) => !seenIds.current!.has(n.id));
    if (fresh.length === 0) return;
    fresh.forEach((n) => seenIds.current!.add(n.id));

    const unreadFresh = fresh.filter((n) => !n.read);
    if (unreadFresh.length === 0) return;

    // Keep chat list previews / ordering fresh, like Messenger
    if (unreadFresh.some((n) => n.type === "message")) fetchConversations().catch(() => {});

    const activeConvo = getActiveConversation();
    const pageVisible = typeof document !== "undefined" && document.visibilityState === "visible";

    const toAlert: Notification[] = [];
    let inChatOnly = false;

    for (const n of unreadFresh) {
      const convo = n.type === "message" ? conversationIdFromHref(n.href) : null;
      if (convo && convo === activeConvo && pageVisible) {
        // User is looking at this chat already — mark read, soft tick only
        markConversationRead(convo);
        inChatOnly = true;
      } else {
        toAlert.push(n);
      }
    }

    if (toAlert.length === 0) {
      if (inChatOnly) playAlertSound("in-chat");
      return;
    }

    playAlertSound(toAlert.some((n) => n.type === "message") ? "message" : "notification");

    // Newest first, at most 3 stacked toasts
    setToasts((current) => [...toAlert.reverse(), ...current.filter((t) => !toAlert.some((a) => a.id === t.id))].slice(0, 3));

    // System notification when the tab is in the background
    if (!pageVisible && "Notification" in window && Notification.permission === "granted") {
      for (const n of toAlert.slice(0, 2)) {
        try {
          const sys = new Notification(n.title, { body: n.body, icon: "/favicon.ico", tag: n.id });
          sys.onclick = () => {
            window.focus();
            window.location.href = n.href;
          };
        } catch {
          // Unsupported environment
        }
      }
    }
  }, [notifications, userId]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((t) => t.slice(0, -1)), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Unread count in the tab title
  useEffect(() => {
    if (typeof document === "undefined") return;
    const unread = userId ? notifications.filter((n) => n.userId === userId && !n.read).length : 0;
    const base = document.title.replace(/^\(\d+\+?\)\s*/, "") || BASE_TITLE;
    document.title = unread > 0 ? `(${unread > 99 ? "99+" : unread}) ${base}` : base;
  }, [notifications, userId]);

  if (toasts.length === 0) return null;

  const dismiss = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <div
      aria-live="polite"
      className="fixed top-[4.25rem] sm:top-20 inset-x-3 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm z-[55] space-y-2"
    >
      {toasts.map((toast) => {
        const isMessage = toast.type === "message";
        const open = () => {
          if (isMessage) {
            const convo = conversationIdFromHref(toast.href);
            if (convo) markConversationRead(convo);
          } else {
            markNotificationRead(toast.id);
          }
          dismiss(toast.id);
        };
        return (
          <div
            key={toast.id}
            role="status"
            className={`relative flex items-start gap-3 rounded-2xl border-2 bg-card/95 backdrop-blur-md p-4 text-foreground shadow-lift animate-in fade-in slide-in-from-top-4 duration-300 ${
              isMessage ? "border-[#315B4B]/50" : "border-primary/50"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isMessage ? "bg-[#315B4B] text-white" : "bg-primary/10 text-primary"
              }`}
            >
              {isMessage ? <MessageCircle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </span>

            <div className="flex-1 min-w-0 pr-6">
              <p className="font-bold text-sm text-foreground truncate">{toast.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{toast.body}</p>
              <Link
                href={toast.href}
                onClick={open}
                className={`group inline-flex items-center gap-1 text-xs font-bold mt-2 hover:underline underline-offset-4 ${
                  isMessage ? "text-[#315B4B]" : "text-primary"
                }`}
              >
                {isMessage ? "Reply" : "View details"}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
