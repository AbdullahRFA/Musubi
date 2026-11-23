"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, MessageSquare, User } from "lucide-react";
import { useSession } from "@/lib/services/authService";
import { useLanguage } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const session = useSession();
  const { t } = useLanguage();

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
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-0.5 text-[10px] font-semibold transition-colors min-w-[44px] ${
                item.isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-full p-0.5 ${
                  item.highlight
                    ? "bg-primary text-white shadow-xs -mt-2 p-1.5 border border-card"
                    : item.isActive
                    ? "bg-primary/10 text-primary"
                    : ""
                }`}
              >
                <Icon className={item.highlight ? "h-5 w-5" : "h-4 w-4"} />
              </div>
              <span className="tracking-tight mt-0.5 text-[10px] truncate max-w-[56px] text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
