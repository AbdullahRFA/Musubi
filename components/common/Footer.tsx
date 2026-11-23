"use client";

import Link from "next/link";
import { useState } from "react";
import { RefreshCw, Heart, Shield, HelpCircle, FileText, CheckCircle2, Globe, Mail } from "lucide-react";
import { resetDemo } from "@/lib/services/demoService";
import { Button } from "@/components/ui/button";

export function Footer() {
  const [resetting, setResetting] = useState(false);
  const [justReset, setJustReset] = useState(false);

  const handleReset = () => {
    setResetting(true);
    setTimeout(() => {
      resetDemo();
      setResetting(false);
      setJustReset(true);
      setTimeout(() => setJustReset(false), 3500);
    }, 400);
  };

  const setLanguage = (lang: "en" | "ja") => {
    localStorage.setItem("tsunagu_lang", lang);
    window.location.reload();
  };

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
              An intergenerational community exchange platform connecting older and younger generations
              through knowledge sharing, skill exchange, daily assistance, and companionship.
            </p>
            <p className="italic text-sm font-semibold text-primary">
              “Connecting the Past to the Present.”
            </p>

            {/* Language Selector in Footer */}
            <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-4 w-4 text-primary" />
              <span>Language:</span>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className="font-bold text-foreground hover:text-primary transition-colors underline underline-offset-2"
              >
                English
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setLanguage("ja")}
                className="font-bold text-foreground hover:text-primary transition-colors underline underline-offset-2"
              >
                日本語 (Japanese)
              </button>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-base text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/about#how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/posts" className="hover:text-primary transition-colors">
                  Community Posts
                </Link>
              </li>
              <li>
                <Link href="/quick-post" className="hover:text-primary transition-colors">
                  Create Post
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Help */}
          <div className="space-y-3">
            <h4 className="font-bold text-base text-foreground">Safety & Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about#safety" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-secondary" />
                  <span>Safety</span>
                </Link>
              </li>
              <li>
                <Link href="/about#support" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-secondary" />
                  <span>Support</span>
                </Link>
              </li>
              <li>
                <Link href="/about#contact" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-secondary" />
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-primary transition-colors">
                  Search
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Demo Reset Bar & Copyright */}
        <div className="mt-8 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-muted-foreground">
            <span className="font-medium">© 2026 Tsunagu Generations. All rights reserved.</span>
            <span className="hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-primary" />
              <span>Connecting the Past to the Present</span>
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <div className="flex items-center gap-3">
            {justReset && (
              <span className="flex items-center gap-1.5 font-bold text-success animate-fade-in">
                <CheckCircle2 className="h-4 w-4" />
                Data restored to original seed!
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={resetting}
              className="gap-2 border-border bg-card hover:bg-muted text-foreground font-semibold shadow-xs text-xs"
              title="Restore initial demo users, posts, chats and transactions"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
              <span>{resetting ? "Resetting..." : "Reset demo data"}</span>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
