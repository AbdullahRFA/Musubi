"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Notification } from "@/lib/types";
import { requireUser } from "@/lib/services/shared";
import { createClient } from "@/lib/supabase/client";

type NotificationInput = Omit<Notification, "id" | "read" | "createdAt">;

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
  const newRow = {
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    read: false,
  };

  const { data, error } = await supabase
    .from("notifications")
    .insert(newRow)
    .select()
    .single();

  let item: Notification;
  if (!error && data) {
    item = rowToNotification(data);
  } else {
    item = {
      ...input,
      id: "n_" + Math.random().toString(36).substring(2, 9),
      read: false,
      createdAt: new Date().toISOString(),
    };
  }

  useAppStore.setState((state) => ({
    notifications: [item, ...state.notifications],
  }));

  return item;
}

/**
 * Fetch notifications from Supabase for the current user
 */
export async function fetchNotifications(): Promise<Notification[]> {
  const user = useAppStore.getState().users.find((u) => u.id === useAppStore.getState().sessionUserId);
  if (!user) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
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
  const userId = useAppStore((state) => state.sessionUserId);
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

export function useUnreadCount(): number {
  const items = useNotifications();
  return items.filter((item) => !item.read).length;
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
