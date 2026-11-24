"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Notification } from "@/lib/types";
import { requireUser } from "@/lib/services/shared";
import { createClient } from "@/lib/supabase/client";
import { createUuid } from "@/lib/utils";

type NotificationInput = Omit<Notification, "id" | "read" | "createdAt">;

/* -------------------------------------------------------------------------- */
/* Sound                                                                      */
/* -------------------------------------------------------------------------- */

const SOUND_PREF_KEY = "tsunagu_sound_enabled";
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

/**
 * Browsers block audio until the user interacts with the page. Call once on
 * mount: the shared AudioContext is resumed on the first tap / key press so
 * later alerts can play even when they arrive in the background.
 */
export function unlockAudioOnFirstInteraction() {
  if (typeof window === "undefined") return () => {};
  const unlock = () => {
    const ctx = getAudioContext();
    ctx?.resume().catch(() => {});
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  return () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SOUND_PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_PREF_KEY, enabled ? "on" : "off");
  } catch {
    // storage unavailable (private mode) — preference just won't persist
  }
}

function tone(ctx: AudioContext, freq: number, start: number, duration: number, volume: number, type: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/**
 * Plays a short synthesized alert.
 * - "message": quick two-note "pop" (Messenger-style)
 * - "notification": softer three-note chime (bell-style)
 * - "in-chat": very quiet tick for messages in the conversation you're viewing
 */
export function playAlertSound(kind: "message" | "notification" | "in-chat" = "notification") {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const t = ctx.currentTime + 0.01;
    if (kind === "message") {
      tone(ctx, 880, t, 0.12, 0.22, "triangle"); // A5
      tone(ctx, 1318.5, t + 0.09, 0.18, 0.18, "triangle"); // E6
    } else if (kind === "in-chat") {
      tone(ctx, 1046.5, t, 0.08, 0.06, "sine"); // C6, very soft
    } else {
      tone(ctx, 659.25, t, 0.35, 0.16); // E5
      tone(ctx, 830.61, t + 0.12, 0.35, 0.14); // G#5
      tone(ctx, 987.77, t + 0.24, 0.5, 0.12); // B5
    }
  } catch {
    // Ignore autoplay or audio context errors
  }
}

/** @deprecated kept for backwards compatibility — use playAlertSound */
export function playNotificationSound() {
  playAlertSound("notification");
}

/* -------------------------------------------------------------------------- */
/* Active conversation tracking                                               */
/* -------------------------------------------------------------------------- */

let activeConversationId: string | null = null;

/** Set by the open chat thread so incoming messages for it don't raise a toast. */
export function setActiveConversation(id: string | null) {
  activeConversationId = id;
}

export function getActiveConversation() {
  return activeConversationId;
}

/** Extracts the conversation id from a message notification link. */
const isChatType = (t: string) => t === "message" || t === "direct_message";

export function conversationIdFromHref(href: string): string | null {
  // Direct messages: /connections/chat/<connectionId> -> "dm:<connectionId>"
  const dm = href.match(/^\/connections\/chat\/([^/?#]+)/);
  if (dm) return `dm:${decodeURIComponent(dm[1])}`;
  const path = href.match(/^\/chat\/([^/?#]+)/);
  if (path) return decodeURIComponent(path[1]);
  const query = href.match(/[?&]id=([^&#]+)/);
  return href.startsWith("/chat") && query ? decodeURIComponent(query[1]) : null;
}

export function rowToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    read: Boolean(row.read),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/**
 * Dispatches a notification to Supabase and updates local store
 */
export async function pushNotification(input: NotificationInput): Promise<Notification> {
  const supabase = createClient();

  // Notifications are almost always addressed to *another* user. RLS only lets
  // the recipient SELECT their rows, so `insert().select()` (RETURNING) fails
  // with a policy error and rolls the insert back — the recipient never gets
  // it. Generate the id client-side and insert without reading the row back.
  const item: Notification = {
    ...input,
    id: createUuid(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("notifications").insert({
    id: item.id,
    user_id: item.userId,
    type: item.type,
    title: item.title,
    body: item.body,
    href: item.href,
    read: false,
    created_at: item.createdAt,
  });

  if (error) {
    console.error("pushNotification Supabase error:", error);
  }

  // Only reflect locally if the notification is for the current user
  const currentUserId = useAppStore.getState().sessionUserId;
  if (item.userId === currentUserId) {
    useAppStore.setState((state) => ({
      notifications: [item, ...state.notifications.filter((n) => n.id !== item.id)],
    }));
  }

  return item;
}

/**
 * Fetch notifications from Supabase for the current user
 */
export async function fetchNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const currentUserId = authUser?.id || useAppStore.getState().sessionUserId;
  if (!currentUserId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", currentUserId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  const items = data.map(rowToNotification);

  useAppStore.setState((state) => {
    const remoteIds = new Set(items.map((n) => n.id));
    const kept = state.notifications.filter((n) => !remoteIds.has(n.id));
    return { notifications: [...items, ...kept] };
  });

  return items;
}

/**
 * Hook to retrieve user's notifications, auto-fetching on mount
 */
export function useNotifications(): Notification[] {
  const sessionUserId = useAppStore((state) => state.sessionUserId);
  const session = useAppStore((state) =>
    state.users.find((u) => u.id === state.sessionUserId)
  );
  const userId = session?.id || sessionUserId;
  const notifications = useAppStore((state) => state.notifications);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  return useMemo(
    () =>
      notifications
        .filter((item) => item.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications, userId],
  );
}

function useCurrentUserId() {
  const sessionUserId = useAppStore((state) => state.sessionUserId);
  const session = useAppStore((state) => state.users.find((u) => u.id === state.sessionUserId));
  return session?.id || sessionUserId;
}

/** Unread activity notifications (everything except chat messages) — drives the bell badge. */
export function useUnreadCount(): number {
  const userId = useCurrentUserId();
  const notifications = useAppStore((state) => state.notifications);
  return useMemo(
    () => notifications.filter((item) => !item.read && item.userId === userId && !isChatType(item.type)).length,
    [notifications, userId],
  );
}

/** Unread chat messages — drives the messenger badge. */
export function useUnreadMessageCount(): number {
  const userId = useCurrentUserId();
  const notifications = useAppStore((state) => state.notifications);
  return useMemo(
    () => notifications.filter((item) => !item.read && item.userId === userId && item.type === "message").length,
    [notifications, userId],
  );
}

/** Unread direct messages (connections) — drives the Connections badge. */
export function useUnreadDmCount(): number {
  const userId = useCurrentUserId();
  const notifications = useAppStore((state) => state.notifications);
  return useMemo(
    () => notifications.filter((item) => !item.read && item.userId === userId && item.type === "direct_message").length,
    [notifications, userId],
  );
}

/** Unread connection requests — also drives the Connections badge. */
export function useUnreadConnectionRequestCount(): number {
  const userId = useCurrentUserId();
  const notifications = useAppStore((state) => state.notifications);
  return useMemo(
    () => notifications.filter((item) => !item.read && item.userId === userId && item.type === "connection_request").length,
    [notifications, userId],
  );
}

/** Map of conversationId -> number of unread messages. */
export function useUnreadByConversation(): Record<string, number> {
  const userId = useCurrentUserId();
  const notifications = useAppStore((state) => state.notifications);
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notifications) {
      if (n.read || n.userId !== userId || !isChatType(n.type)) continue;
      const id = conversationIdFromHref(n.href);
      if (id) counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [notifications, userId]);
}

/**
 * Marks every unread message notification for a conversation as read
 * (called when the user opens / is viewing that chat).
 */
export async function markConversationRead(conversationId: string): Promise<void> {
  const userId = useAppStore.getState().sessionUserId;
  if (!userId) return;
  const ids = useAppStore
    .getState()
    .notifications.filter(
      (n) => !n.read && n.userId === userId && isChatType(n.type) && conversationIdFromHref(n.href) === conversationId,
    )
    .map((n) => n.id);
  if (ids.length === 0) return;

  // Optimistic local update so badges clear instantly
  useAppStore.setState((state) => ({
    notifications: state.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
  }));

  const supabase = createClient();
  await supabase.from("notifications").update({ read: true }).in("id", ids).eq("user_id", userId);
}

/** Marks all unread activity (non-message) notifications as read. */
export async function markAllActivityRead(): Promise<void> {
  const me = requireUser();
  const ids = useAppStore
    .getState()
    .notifications.filter((n) => !n.read && n.userId === me.id && !isChatType(n.type))
    .map((n) => n.id);
  if (ids.length === 0) return;
  useAppStore.setState((state) => ({
    notifications: state.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
  }));
  const supabase = createClient();
  await supabase.from("notifications").update({ read: true }).in("id", ids).eq("user_id", me.id);
}

export async function markNotificationRead(id: string): Promise<void> {
  const me = requireUser();
  const supabase = createClient();

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", me.id);

  useAppStore.setState((state) => ({
    notifications: state.notifications.map((item) =>
      item.id === id && item.userId === me.id ? { ...item, read: true } : item,
    ),
  }));
}

export async function markAllNotificationsRead(): Promise<void> {
  const me = requireUser();
  const supabase = createClient();

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", me.id);

  useAppStore.setState((state) => ({
    notifications: state.notifications.map((item) =>
      item.userId === me.id ? { ...item, read: true } : item,
    ),
  }));
}

/** Marks every unread notification of one type as read (e.g. when opening the Requests tab). */
export async function markAllNotificationsReadOfType(type: Notification["type"]): Promise<void> {
  const userId = useAppStore.getState().sessionUserId;
  if (!userId) return;
  const ids = useAppStore
    .getState()
    .notifications.filter((n) => !n.read && n.userId === userId && n.type === type)
    .map((n) => n.id);
  if (ids.length === 0) return;
  useAppStore.setState((state) => ({
    notifications: state.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
  }));
  await createClient().from("notifications").update({ read: true }).in("id", ids).eq("user_id", userId);
}
