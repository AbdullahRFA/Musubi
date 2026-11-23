"use client";

import Link from "next/link";
import { Heart, Shield, HelpCircle, Globe, Mail } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <footer className="border-t-2 border-border bg-[#efe6d9] text-foreground mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Vision */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl text-primary">Tsunagu</span>
              <span className="font-bold text-xl text-foreground">Generations</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              {t(
                "brandDescription",
                "An intergenerational community exchange platform connecting older and younger generations through knowledge sharing, skill exchange, daily assistance, and companionship."
              )}
            </p>
            <p className="italic text-sm font-semibold text-primary">
              “{t("footer.tagline", "Connecting the Past to the Present")}”
            </p>

            {/* Language Selector in Footer */}
            <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-4 w-4 text-primary" />
              <span>{t("footer.language", "Language:")}</span>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`font-bold transition-colors underline underline-offset-2 ${
                  language === "en" ? "text-primary" : "text-foreground hover:text-primary"
                }`}
              >
                English
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setLanguage("ja")}
                className={`font-bold transition-colors underline underline-offset-2 ${
                  language === "ja" ? "text-primary" : "text-foreground hover:text-primary"
                }`}
              >
                日本語 (Japanese)
              </button>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-base text-foreground">
              {t("footer.explorePlatform", "Platform")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  {t("footer.aboutUs", "About Us")}
                </Link>
              </li>
              <li>
                <Link href="/about#how-it-works" className="hover:text-primary transition-colors">
                  {t("footer.howItWorks", "How It Works")}
                </Link>
              </li>
              <li>
                <Link href="/posts" className="hover:text-primary transition-colors">
                  {t("footer.communityPosts", "Community Posts")}
                </Link>
              </li>
              <li>
                <Link href="/quick-post" className="hover:text-primary transition-colors">
                  {t("footer.createPost", "Create Post")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Help */}
          <div className="space-y-3">
            <h4 className="font-bold text-base text-foreground">
              {t("footer.safetySupport", "Safety & Support")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about#safety" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-secondary" />
                  <span>{t("footer.safety", "Safety Guidelines")}</span>
                </Link>
              </li>
              <li>
                <Link href="/about#support" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-secondary" />
                  <span>{t("footer.support", "Support")}</span>
                </Link>
              </li>
              <li>
                <Link href="/about#contact" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-secondary" />
                  <span>{t("footer.contact", "Contact")}</span>
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-primary transition-colors">
                  {t("footer.search", "Search")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Clean Copyright & Tagline Bar */}
        <div className="mt-8 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-medium">
            {t("footer.copyright", "© 2026 Tsunagu Generations. All rights reserved.")}
          </span>
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-primary" />
            <span>{t("footer.tagline", "Connecting the Past to the Present")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
