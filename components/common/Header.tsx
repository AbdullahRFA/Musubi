"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, memo } from "react";
import {
  Bell,
  MessageSquare,
  Search,
  Sparkles,
  LogOut,
  Menu,
  X,
  Compass,
  FileCheck2,
} from "lucide-react";
import { useSession, signOut } from "@/lib/services/authService";
import { useUnreadCount } from "@/lib/services/notificationService";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

export const Header = memo(function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const unreadCount = useUnreadCount();
  const { language, setLanguage, t } = useLanguage();

  const [fontSize, setFontSize] = useState<"standard" | "large">("standard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedFont = localStorage.getItem("tsunagu_font_size");
    if (savedFont === "large") {
      setFontSize("large");
      document.documentElement.classList.add("large-text");
    }
  }, []);

  const handleToggleFontSize = (size: "standard" | "large") => {
    setFontSize(size);
    localStorage.setItem("tsunagu_font_size", size);
    if (size === "large") {
      document.documentElement.classList.add("large-text");
    } else {
      document.documentElement.classList.remove("large-text");
    }
  };

  const handleToggleLanguage = (lang: "en" | "ja") => {
    setLanguage(lang);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.push("/");
  };

  const postsLabel = session ? t("nav.posts") : t("nav.explore");

  const navLinks = [
    { href: "/posts", label: postsLabel, icon: Compass },
    { href: "/my-activity", label: t("nav.myActivity"), icon: FileCheck2 },
    { href: "/search", label: t("nav.search"), icon: Search },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-2 min-h-[56px]">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <Link
            href="/"
            className="flex flex-col group focus:outline-none"
            aria-label="Tsunagu Generations Home"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-primary group-hover:text-[#234336] transition-colors">
                Tsunagu
              </span>
              <span className="font-bold text-lg sm:text-xl text-foreground">
                Generations
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium hidden md:inline -mt-0.5">
              {t("brandSubtitle")}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm transition-colors ${
                    active
                      ? "bg-muted text-primary font-bold"
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-nowrap shrink-0">
          {/* Quick Post Button (authenticated only, hidden on phone) */}
          {session && (
            <Button
              asChild
              variant="default"
              size="sm"
              className="hidden sm:inline-flex gap-1.5 bg-primary hover:bg-[#234336] text-white font-bold shadow-xs h-8 px-2.5 text-xs cursor-pointer"
            >
              <Link href="/quick-post">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                <span>{t("nav.quickPost")}</span>
              </Link>
            </Button>
          )}

          {/* Font-Size Selector (Standard / Large) */}
          <div
            className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5 text-xs font-semibold shrink-0"
            role="group"
            aria-label={t("nav.fontSize")}
          >
            <button
              type="button"
              onClick={() => handleToggleFontSize("standard")}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md transition-all text-[11px] sm:text-xs ${
                fontSize === "standard"
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("nav.fontSizeStandard")}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => handleToggleFontSize("large")}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md transition-all text-[11px] sm:text-xs ${
                fontSize === "large"
                  ? "bg-primary text-white font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("nav.fontSizeLarge")}
            >
              A+
            </button>
          </div>

          {/* Language Selector (English / Japanese) */}
          <div
            className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5 text-xs font-semibold shrink-0"
            role="group"
            aria-label={t("nav.languageSelector")}
          >
            <button
              type="button"
              onClick={() => handleToggleLanguage("en")}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md transition-all text-[11px] sm:text-xs ${
                language === "en"
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleToggleLanguage("ja")}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md transition-all text-[11px] sm:text-xs ${
                language === "ja"
                  ? "bg-card text-primary font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="日本語"
            >
              JA
            </button>
          </div>

          {/* If Logged In: Notifications, Chat, Profile Menu */}
          {session ? (
            <>
              {/* Chat Icon (desktop/tablet; mobile has bottom nav) */}
              <Link
                href="/chat"
                className="hidden sm:inline-flex relative p-1.5 rounded-md text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors"
                aria-label={t("nav.messages")}
              >
                <MessageSquare className="h-4 w-4" />
              </Link>

              {/* Notification Bell */}
              <Link
                href="/notifications"
                className="relative p-1.5 rounded-md text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors shrink-0"
                aria-label={`${t("nav.notifications")} ${unreadCount > 0 ? `(${unreadCount})` : ""}`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white shadow">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Avatar & Name Link */}
              <div className="flex items-center gap-1 pl-1 border-l border-border shrink-0">
                <Link
                  href={`/profile/${session.id}`}
                  className="flex items-center gap-1.5 p-0.5 rounded-md hover:bg-muted transition-colors"
                  title={t("nav.viewProfile")}
                >
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-xs shadow-inner">
                    {initials(session.fullName)}
                  </div>
                  <span className="hidden lg:inline text-xs font-bold text-foreground max-w-[100px] truncate">
                    {session.fullName}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hidden sm:inline-flex p-1 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-colors"
                  title={t("nav.signOut")}
                  aria-label={t("nav.signOut")}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            /* Logged Out Visitor Actions */
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Button asChild variant="outline" size="sm" className="font-semibold text-xs h-7 sm:h-8 px-2 sm:px-3 cursor-pointer">
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild variant="default" size="sm" className="font-semibold text-xs h-7 sm:h-8 px-2 sm:px-3 bg-primary hover:bg-[#234336] text-white cursor-pointer">
                <Link href="/register">{t("nav.register")}</Link>
              </Button>
            </div>
          )}

          {/* Mobile Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md hover:bg-muted text-foreground shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {session && (
            <Link
              href="/quick-post"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-white font-bold shadow text-center text-sm"
            >
              <Sparkles className="h-4 w-4 text-amber-200" />
              <span>{t("nav.createQuickPost")}</span>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40 font-semibold text-xs text-foreground hover:bg-muted"
                >
                  <Icon className="h-4 w-4 text-primary" />
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
                className="flex items-center gap-2.5 min-w-0"
              >
                <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                  {initials(session.fullName)}
                </div>
                <div className="font-bold text-xs text-foreground truncate">{session.fullName}</div>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs h-8 shrink-0">
                {t("nav.signOut")}
              </Button>
            </div>
          ) : (
            <div className="pt-2 border-t border-border grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="w-full text-xs h-9 font-bold cursor-pointer">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  {t("nav.login")}
                </Link>
              </Button>
              <Button asChild variant="default" className="w-full text-xs h-9 bg-primary text-white font-bold cursor-pointer">
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  {t("nav.register")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
});
