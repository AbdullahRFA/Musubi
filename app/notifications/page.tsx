"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Clock,
  Inbox,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Activity,
  Star,
  Coins,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import {
  useNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services/notificationService";
import type { Notification, NotificationType } from "@/lib/types";
import { formatWhen } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/common/AuthGuard";

const TYPE_STYLE: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  request_new: { icon: Inbox, className: "bg-blue-50 text-blue-700" },
  request_accepted: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700" },
  request_rejected: { icon: XCircle, className: "bg-rose-50 text-rose-700" },
  message: { icon: MessageSquare, className: "bg-[#E7EEE4] text-[#315B4B]" },
  activity: { icon: Activity, className: "bg-amber-50 text-amber-700" },
  completed: { icon: CheckCheck, className: "bg-emerald-50 text-emerald-700" },
  review: { icon: Star, className: "bg-amber-50 text-amber-600" },
  payment: { icon: Coins, className: "bg-blue-50 text-blue-700" },
};

function NotificationRow({ n }: { n: Notification }) {
  const style = TYPE_STYLE[n.type] ?? { icon: Bell, className: "bg-muted text-foreground" };
  const Icon = style.icon;
  return (
    <li>
      <Link
        href={n.href}
        onClick={() => !n.read && markNotificationRead(n.id)}
        className={`group flex items-start gap-3 sm:gap-4 rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 ${
          n.read
            ? "border-border/80 bg-card/60 hover:bg-card hover:border-border"
            : "border-primary/40 bg-[#fffdfa] shadow-xs hover:border-primary hover:shadow-soft"
        }`}
      >
        <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.className}`}>
          <Icon className="h-5 w-5" />
          {!n.read && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary ring-2 ring-card" aria-label="Unread" />
          )}
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-start justify-between gap-x-4 gap-y-1">
            <h3 className={`text-base font-bold ${n.read ? "text-foreground" : "text-primary"}`}>{n.title}</h3>
            <span className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatWhen(n.createdAt)}
            </span>
          </div>
          <p className={`text-sm ${n.read ? "text-muted-foreground" : "text-foreground/90"}`}>{n.body}</p>
        </div>

        <ChevronRight className="hidden sm:block h-5 w-5 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </Link>
    </li>
  );
}

export default function NotificationsPage() {
  const notifications = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unread = useMemo(() => notifications.filter((n) => !n.read), [notifications]);
  const read = useMemo(() => notifications.filter((n) => n.read), [notifications]);

  const filterBtn = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
      active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <AuthGuard>
      <div className="page-container max-w-4xl py-6 sm:py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </span>
              Notifications
              {unread.length > 0 && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm font-bold text-primary-foreground tabular-nums">
                  {unread.length}
                </span>
              )}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Updates on your service requests, chat replies, and community activities
            </p>
          </div>

          {unread.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllNotificationsRead()} className="gap-1.5 font-semibold self-start sm:self-auto">
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length > 0 && (
          <div role="group" aria-label="Filter notifications" className="inline-flex rounded-full border border-border bg-muted/60 p-1">
            <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={filterBtn(filter === "all")}>
              All ({notifications.length})
            </button>
            <button type="button" onClick={() => setFilter("unread")} aria-pressed={filter === "unread"} className={filterBtn(filter === "unread")}>
              Unread ({unread.length})
            </button>
          </div>
        )}

        {notifications.length === 0 || (filter === "unread" && unread.length === 0) ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card px-6 py-14 text-center space-y-3 animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <BellOff className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">You are all caught up!</p>
            <p className="text-sm text-muted-foreground">No {filter === "unread" ? "unread " : ""}notifications at the moment.</p>
          </div>
        ) : (
          <div key={filter} className="space-y-6 animate-fade-in">
            {unread.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New</h2>
                <ul className="space-y-3">
                  {unread.map((n) => (
                    <NotificationRow key={n.id} n={n} />
                  ))}
                </ul>
              </section>
            )}
            {filter === "all" && read.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Earlier</h2>
                <ul className="space-y-3">
                  {read.map((n) => (
                    <NotificationRow key={n.id} n={n} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
