"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Notification } from "@/lib/types";
import { createId } from "@/lib/utils";
import { requireUser } from "@/lib/services/shared";

type NotificationInput = Omit<Notification, "id" | "read" | "createdAt">;

export function pushNotification(input: NotificationInput) {
  const item: Notification = {
    ...input,
    id: createId("n"),
    read: false,
    createdAt: new Date().toISOString(),
  };
  useAppStore.setState((state) => ({
    notifications: [item, ...state.notifications],
  }));
  return item;
}

export function useNotifications() {
  const userId = useAppStore((state) => state.sessionUserId);
  const notifications = useAppStore((state) => state.notifications);
  return useMemo(
    () =>
      notifications
        .filter((item) => item.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications, userId],
  );
}

export function useUnreadCount() {
  const items = useNotifications();
  return items.filter((item) => !item.read).length;
}

export async function markNotificationRead(id: string) {
  const me = requireUser();
  useAppStore.setState((state) => ({
    notifications: state.notifications.map((item) =>
      item.id === id && item.userId === me.id ? { ...item, read: true } : item,
    ),
  }));
}

export async function markAllNotificationsRead() {
  const me = requireUser();
  useAppStore.setState((state) => ({
    notifications: state.notifications.map((item) =>
      item.userId === me.id ? { ...item, read: true } : item,
    ),
  }));
}
