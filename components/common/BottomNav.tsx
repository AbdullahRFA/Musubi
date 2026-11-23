"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, MessageSquare, User } from "lucide-react";
import { useSession } from "@/lib/services/authService";
import { useUnreadMessageCount } from "@/lib/services/notificationService";
import { useLanguage } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const session = useSession();
  const { t } = useLanguage();
  const unreadMessages = useUnreadMessageCount();

  // Bottom navigation is shown exclusively to authenticated users on mobile viewports
  if (!session) return null;

  const navItems = [
    {
      href: "/",
      label: t("bottomNav.home", "Home"),
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/search",
      label: t("bottomNav.discover", "Discover"),
      icon: Compass,
      isActive: pathname.startsWith("/search") || pathname.startsWith("/posts"),
    },
    {
      href: "/quick-post",
      label: t("bottomNav.create", "Create"),
      icon: PlusCircle,
      isActive: pathname.startsWith("/quick-post") || pathname.startsWith("/posts/new"),
      highlight: true,
    },
    {
      href: "/chat",
      label: t("bottomNav.messages", "Messages"),
      icon: MessageSquare,
      isActive: pathname.startsWith("/chat"),
    },
    {
      href: `/profile/${session.id}`,
      label: t("bottomNav.profile", "Profile"),
      icon: User,
      isActive: pathname.startsWith(`/profile/${session.id}`),
    },
  ];

  return (
    <>
      {/* Spacer so page content and footer are never hidden behind the fixed bar */}
      <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" aria-hidden="true" />
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/85 shadow-[0_-4px_16px_rgba(36,28,22,0.06)] pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile Navigation"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.isActive ? "page" : undefined}
                className={`group relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 text-[11px] font-semibold transition-colors duration-200 ${
                  item.isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Active indicator */}
                {!item.highlight && (
                  <span
                    className={`absolute top-0 h-0.5 w-8 rounded-full bg-primary transition-transform duration-300 ${
                      item.isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
                    item.highlight
                      ? "h-11 w-11 -mt-5 bg-primary text-primary-foreground shadow-glow ring-4 ring-card group-hover:scale-105 group-active:scale-95"
                      : `h-8 w-12 ${item.isActive ? "bg-primary/10" : "group-hover:bg-muted"}`
                  }`}
                >
                  <Icon className={item.highlight ? "h-6 w-6" : "h-5 w-5"} />
                  {item.href === "/chat" && unreadMessages > 0 && (
                    <span className="absolute -top-0.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white ring-2 ring-card">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center px-0.5 leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
