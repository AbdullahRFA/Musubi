"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  MessageSquare,
  Search,
  Sparkles,
  Type,
  User,
  LogOut,
  Menu,
  X,
  Compass,
  FileCheck2,
  Info,
} from "lucide-react";
import { useSession, signOut } from "@/lib/services/authService";
import { useUnreadCount } from "@/lib/services/notificationService";
import { Button } from "@/components/ui/button";
import { groupShort } from "@/lib/constants";
import { initials } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const unreadCount = useUnreadCount();
  const [largeText, setLargeText] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tsunagu_large_text");
    if (saved === "true") {
      setLargeText(true);
      document.documentElement.classList.add("large-text");
    }
  }, []);

  const toggleLargeText = () => {
    const next = !largeText;
    setLargeText(next);
    localStorage.setItem("tsunagu_large_text", String(next));
    if (next) {
      document.documentElement.classList.add("large-text");
    } else {
      document.documentElement.classList.remove("large-text");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navLinks = [
    { href: "/posts", label: "Posts", icon: Compass },
    { href: "/search", label: "Search", icon: Search },
    { href: "/my-activity", label: "My Activity", icon: FileCheck2 },
    { href: "/about", label: "About & Safety", icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-6">
          <Link
            href={session ? "/dashboard" : "/"}
            className="flex flex-col group focus:outline-none"
            aria-label="Tsunagu Generations Home"
          >
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-primary group-hover:text-[#832c0f] transition-colors">
                Tsunagu
              </span>
              <span className="font-bold text-xl text-foreground">
                Generations
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              Wisdom of the past · Energy of today
            </span>
          </Link>

          {/* Desktop Navigation (Max 5 items) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${
                    active
                      ? "bg-muted text-primary font-semibold"
                      : "text-foreground hover:bg-muted/70 hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Controls & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick-Post Wizard Button (Prominent, especially for O.G.) */}
          <Link href="/quick-post" className="hidden sm:inline-flex">
            <Button
              variant="default"
              size="default"
              className="gap-2 bg-primary hover:bg-[#832c0f] text-white font-bold shadow"
            >
              <Sparkles className="h-5 w-5 animate-pulse text-amber-200" />
              <span>Quick Post</span>
            </Button>
          </Link>

          {/* Larger Text Accessibility Toggle */}
          <button
            type="button"
            onClick={toggleLargeText}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md border-2 text-sm font-semibold transition-all ${
              largeText
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
            title="Toggle Larger Text for easier reading"
            aria-pressed={largeText}
            aria-label="Toggle larger readable text"
          >
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Larger Text</span>
            <span className="text-xs uppercase font-mono">{largeText ? "ON" : "OFF"}</span>
          </button>

          {/* If Logged In: Notifications, Chat, Profile Menu */}
          {session ? (
            <>
              {/* Chat Icon */}
              <Link
                href="/chat"
                className="relative p-2.5 rounded-md text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors"
                aria-label="Messages"
              >
                <MessageSquare className="h-5 w-5" />
              </Link>

              {/* Notification Bell */}
              <Link
                href="/notifications"
                className="relative p-2.5 rounded-md text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-white shadow">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Avatar & Name Link */}
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <Link
                  href={`/profile/${session.id}`}
                  className="flex items-center gap-2 p-1 rounded-md hover:bg-muted transition-colors"
                  title="View your profile"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-sm shadow-inner">
                    {session.avatarUrl ? (
                      <img
                        src={session.avatarUrl}
                        alt={session.fullName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      initials(session.fullName)
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col text-left text-xs leading-tight">
                    <span className="font-bold text-foreground truncate max-w-[110px]">
                      {session.fullName}
                    </span>
                    <span className="text-primary font-semibold">
                      {groupShort(session.userGroup)}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            /* If Logged Out */
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="font-semibold">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="default" size="sm" className="font-semibold">
                  Register
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-muted text-foreground"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3">
          <Link
            href="/quick-post"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-md bg-primary text-white font-bold shadow text-center"
          >
            <Sparkles className="h-5 w-5 text-amber-200" />
            <span>Create Quick Post</span>
          </Link>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-md border border-border bg-muted/40 font-medium text-foreground hover:bg-muted"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {session ? (
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Link
                href={`/profile/${session.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                  {initials(session.fullName)}
                </div>
                <div>
                  <div className="font-bold text-foreground">{session.fullName}</div>
                  <div className="text-xs text-primary font-semibold">{groupShort(session.userGroup)}</div>
                </div>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="pt-3 border-t border-border grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Log In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="default" className="w-full">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
