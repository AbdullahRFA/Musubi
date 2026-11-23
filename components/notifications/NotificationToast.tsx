"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, MessageSquare, ArrowRight, X } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import {
  fetchNotifications,
  rowToNotification,
  markNotificationRead,
  playNotificationSound,
} from "@/lib/services/notificationService";
import type { Notification } from "@/lib/types";

export function NotificationToast() {
  const sessionUserId = useAppStore((state) => state.sessionUserId);
  const session = useAppStore((state) =>
    state.users.find((u) => u.id === state.sessionUserId)
  );
  const userId = session?.id || sessionUserId;

  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  // Request browser desktop notification permission once on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Set up single Realtime listener + 3-second background polling for the logged-in user
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const supabase = createClient();
    // Unique channel identifier ensures no collision with previous or existing channels
    const uniqueChannelName = `notifs_live_${userId}_${Math.random().toString(36).substring(2, 8)}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = rowToNotification(payload.new);
            if (newNotif.userId === userId) {
              useAppStore.setState((state) => ({
                notifications: [
                  newNotif,
                  ...state.notifications.filter((n) => n.id !== newNotif.id),
                ],
              }));

              playNotificationSound();
              setActiveToast(newNotif);

              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                try {
                  new Notification(newNotif.title, {
                    body: newNotif.body,
                    icon: "/favicon.ico",
                  });
                } catch (e) {
                  // Ignore push errors on unsupported environments
                }
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = rowToNotification(payload.new);
            if (updated.userId === userId) {
              useAppStore.setState((state) => ({
                notifications: state.notifications.map((n) =>
                  n.id === updated.id ? updated : n
                ),
              }));
            }
          }
        }
      )
      .subscribe();

    // 3-second polling sync guarantees accuracy even when WebSocket is inactive or reconnecting
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [userId]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  const isMessage = activeToast.type === "message";

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-card border-2 border-primary shadow-xl rounded-xl p-4 text-foreground flex items-start gap-3 relative">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0 mt-0.5">
          {isMessage ? <MessageSquare className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <p className="font-bold text-sm text-foreground truncate">{activeToast.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activeToast.body}</p>

          <Link
            href={activeToast.href}
            onClick={() => {
              markNotificationRead(activeToast.id);
              setActiveToast(null);
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-2"
          >
            <span>View details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-md"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
