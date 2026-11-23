"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, MessageSquare, ArrowRight, X } from "lucide-react";
import {
  useNotifications,
  markNotificationRead,
  playNotificationSound,
} from "@/lib/services/notificationService";
import type { Notification } from "@/lib/types";

export function NotificationToast() {
  const notifications = useNotifications();
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [lastShownId, setLastShownId] = useState<string | null>(null);

  // Request browser desktop notification permission once on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Show toast when a new unread notification arrives
  useEffect(() => {
    if (notifications.length > 0) {
      const newest = notifications[0];
      if (!newest.read && newest.id !== lastShownId) {
        // Only trigger toast for recently created notifications (within last 30s)
        const ageInMs = Date.now() - new Date(newest.createdAt).getTime();
        if (ageInMs < 30000) {
          setActiveToast(newest);
          setLastShownId(newest.id);
          playNotificationSound();

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(newest.title, {
                body: newest.body,
                icon: "/favicon.ico",
              });
            } catch (e) {
              // Ignore push errors on unsupported environments
            }
          }
        }
      }
    }
  }, [notifications, lastShownId]);

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
