"use client";

import Link from "next/link";
import { useState } from "react";
import { RefreshCw, Heart, Shield, HelpCircle, FileText, CheckCircle2 } from "lucide-react";
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
            <p className="text-base text-muted-foreground max-w-md">
              A community platform connecting older and younger generations through knowledge sharing,
              skill exchange, daily assistance, and companionship.
            </p>
            <p className="italic text-sm font-medium text-secondary">
              “Connecting the wisdom of the past with the energy of today.”
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-lg text-foreground">Explore</h4>
            <ul className="space-y-2 text-base">
              <li>
                <Link href="/posts" className="hover:text-primary transition-colors">
                  Community Posts
                </Link>
              </li>
              <li>
                <Link href="/quick-post" className="hover:text-primary transition-colors font-medium">
                  Quick Post for O.G.
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-primary transition-colors">
                  Search Posts & People
                </Link>
              </li>
              <li>
                <Link href="/my-activity" className="hover:text-primary transition-colors">
                  My Activity History
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Help */}
          <div className="space-y-3">
            <h4 className="font-bold text-lg text-foreground">Safety & Info</h4>
            <ul className="space-y-2 text-base">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-secondary" />
                  <span>Safety Guidelines</span>
                </Link>
              </li>
              <li>
                <Link href="/about#faq" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-secondary" />
                  <span>Frequently Asked Questions</span>
                </Link>
              </li>
              <li>
                <Link href="/about#support" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-secondary" />
                  <span>Community Support</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Demo Reset Bar & Copyright */}
        <div className="mt-8 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-primary" />
            <span>Hackathon MVP · Phase 1 In-Memory Simulation</span>
          </div>

          {/* Reset Demo Data Button */}
          <div className="flex items-center gap-3">
            {justReset && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-success animate-fade-in">
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
              className="gap-2 border-border bg-card hover:bg-muted text-foreground font-semibold shadow-xs"
              title="Restore initial 10 demo users, posts, chats and transactions"
            >
              <RefreshCw className={`h-4 w-4 ${resetting ? "animate-spin" : ""}`} />
              <span>{resetting ? "Resetting..." : "Reset demo data"}</span>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
