"use client";

import Link from "next/link";
import { Bell, CheckCheck, Clock, ExternalLink } from "lucide-react";
import {
  useNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services/notificationService";
import { formatWhen } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function NotificationsPage() {
  const notifications = useNotifications();

  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
              <Bell className="h-7 w-7 text-primary" />
              <span>Notifications</span>
            </h1>
            <p className="text-base text-muted-foreground">
              Updates on your service requests, chat replies, and community activities
            </p>
          </div>

          {notifications.some((n) => !n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllNotificationsRead()}
              className="gap-1.5 font-semibold text-xs"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark all as read</span>
            </Button>
          )}
        </div>

        {/* List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">You are all caught up!</p>
              <p className="text-sm text-muted-foreground">No notifications at the moment.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => !n.read && markNotificationRead(n.id)}
                className={`block rounded-lg border-2 transition-all p-4 sm:p-5 ${
                  n.read
                    ? "border-border/80 bg-card/60 text-muted-foreground hover:bg-muted/40"
                    : "border-primary/50 bg-[#fffdfa] shadow-xs hover:border-primary"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                      )}
                      <h3
                        className={`text-base font-bold ${
                          n.read ? "text-foreground" : "text-primary"
                        }`}
                      >
                        {n.title}
                      </h3>
                    </div>
                    <p className="text-sm text-foreground/90 pl-4">{n.body}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatWhen(n.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
