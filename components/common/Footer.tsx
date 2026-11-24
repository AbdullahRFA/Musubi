"use client";

import Link from "next/link";
import { Logo } from "@/components/common/Logo";
import { Heart, Shield, HelpCircle, Globe, Mail, ArrowUpRight, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface FooterLink {
  href: string;
  label: string;
  icon?: LucideIcon;
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="space-y-4">
      <h4 className="font-bold text-sm uppercase tracking-wider text-foreground">{title}</h4>
      <ul className="space-y-2.5 text-sm">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group inline-flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
              {Icon && <Icon className="h-4 w-4 text-secondary transition-colors group-hover:text-primary" />}
              <span>{label}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { language, setLanguage, t } = useLanguage();

  const platformLinks: FooterLink[] = [
    { href: "/about", label: t("footer.aboutUs", "About Us") },
    { href: "/about#how-it-works", label: t("footer.howItWorks", "How It Works") },
    { href: "/posts", label: t("footer.communityPosts", "Community Posts") },
    { href: "/quick-post", label: t("footer.createPost", "Create Post") },
  ];

  const supportLinks: FooterLink[] = [
    { href: "/about#safety", label: t("footer.safety", "Safety Guidelines"), icon: Shield },
    { href: "/about#support", label: t("footer.support", "Support"), icon: HelpCircle },
    { href: "/about#contact", label: t("footer.contact", "Contact"), icon: Mail },
  ];

  const langBtn = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 ${
      active ? "bg-primary text-primary-foreground shadow-xs" : "text-foreground hover:bg-card"
    }`;

  return (
    <footer className="relative border-t border-border bg-muted text-foreground mt-auto overflow-hidden">
      {/* Decorative accent line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[#c2410c] to-secondary" aria-hidden="true" />

      <div className="page-container py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Vision */}
          <div className="space-y-4 sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              {t(
                "brandDescription",
                "An intergenerational community exchange platform connecting older and younger generations through knowledge sharing, skill exchange, daily assistance, and companionship."
              )}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-medium">{t("footer.language", "Language:")}</span>
              <div className="inline-flex rounded-full border border-border bg-background/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={langBtn(language === "en")}
                  aria-pressed={language === "en"}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ja")}
                  className={langBtn(language === "ja")}
                  aria-pressed={language === "ja"}
                >
                  日本語
                </button>
              </div>
            </div>
          </div>

          <FooterColumn title={t("footer.explorePlatform", "Platform")} links={platformLinks} />
          <FooterColumn title={t("footer.safetySupport", "Safety & Support")} links={supportLinks} />
        </div>

        {/* Copyright & tagline bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground text-center sm:text-left">
          <span className="font-medium">
            {t("footer.copyright", "© 2026 Musubi. All rights reserved.")}
          </span>
          <span className="inline-flex items-center gap-1.5 italic font-semibold text-primary">
            <Heart className="h-3.5 w-3.5 fill-primary/20" />
            {t("footer.tagline", "Connecting the Past to the Present")}
          </span>
        </div>
      </div>
    </footer>
  );
}
