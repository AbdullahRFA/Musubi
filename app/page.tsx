"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  HandHelping,
  HeartHandshake,
  Flower2,
  BookOpen,
  PenLine,
  Compass,
  MessageSquare,
  CheckCircle2,
  Smartphone,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/services/authService";
import { HeroBackgroundVideo } from "@/components/home/HeroBackgroundVideo";
import { useLanguage } from "@/lib/i18n";

export default function HomePage() {
  const router = useRouter();
  const session = useSession();
  const { language, t } = useLanguage();

  // Redirect authenticated users directly to the posts directory
  useEffect(() => {
    if (session) {
      router.replace("/posts");
    }
  }, [session, router]);

  // While redirecting logged-in user
  if (session) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-semibold">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>{language === "ja" ? "コミュニティ投稿へ移動中..." : "Redirecting to community posts..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full space-y-8 sm:space-y-12 pb-6 sm:pb-8">
      {/* ========================================================================= */}
      {/* 2. HERO SECTION — FULL BACKGROUND VIDEO SLIDER (DSi-INSPIRED)             */}
      {/* ========================================================================= */}
      <HeroBackgroundVideo>
        <div className="max-w-4xl space-y-6 sm:space-y-8 text-left">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
            <span>{t("hero.badge", "Community Skill & Knowledge Exchange")}</span>
          </div>

          {/* Large Bold High-Contrast Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4rem] xl:text-[4.25rem] font-black tracking-tight text-white leading-[1.14] sm:leading-[1.1] [text-shadow:_0_2px_14px_rgba(0,0,0,0.85)]">
            {language === "ja" ? (
              <>
                <span className="relative inline-block text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  <span>過去の知恵</span>
                  <span className="absolute left-0 -bottom-1 sm:-bottom-1.5 w-full h-[5px] sm:h-[7px] bg-[#E5B55E] rounded-full shadow-md" />
                </span>
                <span>と、</span>
                <br className="hidden sm:inline" />{" "}
                <span className="relative inline-block text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  <span>現在のエネルギー</span>
                  <span className="absolute left-0 -bottom-1 sm:-bottom-1.5 w-full h-[5px] sm:h-[7px] bg-[#66C2A5] rounded-full shadow-md" />
                </span>
                <span>をつなぐ。</span>
              </>
            ) : (
              <>
                Connecting the{" "}
                <span className="relative inline-block text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  <span>wisdom of the</span>
                  <span className="absolute left-0 -bottom-1 sm:-bottom-1.5 w-full h-[5px] sm:h-[7px] bg-[#E5B55E] rounded-full shadow-md" />
                </span>
                <br className="hidden sm:inline" />{" "}
                <span className="relative inline-block text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  <span>past</span>
                  <span className="absolute left-0 -bottom-1 sm:-bottom-1.5 w-full h-[5px] sm:h-[7px] bg-[#E5B55E] rounded-full shadow-md" />
                </span>{" "}
                with the{" "}
                <span className="relative inline-block text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  <span>energy of today.</span>
                  <span className="absolute left-0 -bottom-1 sm:-bottom-1.5 w-full h-[5px] sm:h-[7px] bg-[#66C2A5] rounded-full shadow-md" />
                </span>
              </>
            )}
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg md:text-xl text-white font-medium leading-relaxed max-w-2xl [text-shadow:_0_1px_8px_rgba(0,0,0,0.85)]">
            {t(
              "hero.subtitle",
              "Tsunagu Generations brings older and younger generations together to share knowledge, exchange practical help, and build meaningful companionship."
            )}
          </p>

          {/* Prominent CTA Buttons */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 max-w-md sm:max-w-none">
            <Button
              asChild
              size="lg"
              className="bg-[#315B4B] hover:bg-[#234336] text-white font-bold text-sm sm:text-base px-8 py-4 h-13 rounded-xl shadow-xl gap-2 cursor-pointer transition-all hover:scale-[1.02] border border-emerald-400/30"
            >
              <Link href="/posts">
                <span>{t("hero.exploreBtn", "Explore Community Posts")}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 border-white/35 text-white font-bold text-sm sm:text-base px-8 py-4 h-13 rounded-xl backdrop-blur-md transition-all cursor-pointer hover:border-white shadow-lg"
            >
              <Link href="/register">
                <span>{t("hero.joinBtn", "Join Our Community")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </HeroBackgroundVideo>

      {/* ========================================================================= */}
      {/* 3. ABOUT OUR PLATFORM SECTION                                             */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <span>{t("about.badge", "Our Core Philosophy")}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            {t("about.title", "Everyone Can Teach, Everyone Can Learn")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t(
              "about.subtitle",
              "Tsunagu Generations is founded on reciprocal community exchange. No user is locked into a permanent provider or receiver role—each generation brings valuable experience, curiosity, and care."
            )}
          </p>
        </div>

        {/* 3 Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Knowledge Sharing */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 sm:p-8 shadow-xs hover:border-primary/60 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-[#E7EEE4] text-primary flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-foreground">
                {t("about.cards.0.title", "Knowledge Sharing")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(
                  "about.cards.0.desc",
                  "Pass down traditional recipes, cultural crafts, calligraphy, gardening wisdom, and life stories, while younger members exchange modern skills, digital tools, and fresh viewpoints."
                )}
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 text-xs font-bold text-primary flex items-center gap-1">
              <span>{t("about.cards.0.tag", "Reciprocal learning")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 2: Mutual Support */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 sm:p-8 shadow-xs hover:border-primary/60 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <HandHelping className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-foreground">
                {t("about.cards.1.title", "Mutual Support")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(
                  "about.cards.1.desc",
                  "Help with everyday tasks such as smartphone settings, video calling, grocery errands, minor household chores, or seasonal preparation—provided with patience and neighborhood goodwill."
                )}
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 text-xs font-bold text-amber-800 flex items-center gap-1">
              <span>{t("about.cards.1.tag", "Practical assistance")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 3: Companionship */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 sm:p-8 shadow-xs hover:border-primary/60 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-foreground">
                {t("about.cards.2.title", "Companionship")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(
                  "about.cards.2.desc",
                  "Build genuine intergenerational friendships through casual conversation over tea, peaceful neighborhood walks, listening, and sharing hobbies that alleviate social isolation."
                )}
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 text-xs font-bold text-rose-700 flex items-center gap-1">
              <span>{t("about.cards.2.tag", "Social connection")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW TSUNAGU WORKS SECTION — 4-STEP PROCESS                             */}
      {/* ========================================================================= */}
      <section className="bg-[#FAF9F5] border-y-2 border-border py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              {t("howItWorks.title", "How Tsunagu Works")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t(
                "howItWorks.subtitle",
                "A simple, respectful four-step process designed to make connecting effortless and safe for all ages."
              )}
            </p>
          </div>

          {/* 4 Steps: Horizontal on Desktop, Vertical / Stacked on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs relative flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-2xl text-primary/40 font-mono">01</span>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <PenLine className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-foreground">
                  {t("howItWorks.steps.0.title", "Create a Post")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t(
                    "howItWorks.steps.0.desc",
                    "Post a skill or service you would love to share, or write a friendly request for assistance you need."
                  )}
                </p>
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                {t("howItWorks.steps.0.badge", "Easy quick-post format")}
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs relative flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-2xl text-primary/40 font-mono">02</span>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Compass className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-foreground">
                  {t("howItWorks.steps.1.title", "Discover & Respond")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t(
                    "howItWorks.steps.1.desc",
                    "Explore listings in your neighborhood. Send a polite connection request with an introductory message."
                  )}
                </p>
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                {t("howItWorks.steps.1.badge", "Filter by category & area")}
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs relative flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-2xl text-primary/40 font-mono">03</span>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-foreground">
                  {t("howItWorks.steps.2.title", "Connect & Coordinate")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t(
                    "howItWorks.steps.2.desc",
                    "Chat securely within Tsunagu. Agree on the date, time, and comfortable public location for your exchange."
                  )}
                </p>
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                {t("howItWorks.steps.2.badge", "In-app private messaging")}
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs relative flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-2xl text-primary/40 font-mono">04</span>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-foreground">
                  {t("howItWorks.steps.3.title", "Complete & Review")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t(
                    "howItWorks.steps.3.desc",
                    "Meet up, enjoy the mutual exchange, confirm completion, and leave warm, encouraging feedback for each other."
                  )}
                </p>
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                {t("howItWorks.steps.3.badge", "Build community trust")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. EXCHANGE CATEGORIES SECTION — 6 INFORMATIONAL CARDS (3x2 GRID)         */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            {t("categories.title", "Exchange Categories")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t(
              "categories.subtitle",
              "Explore the diverse areas of mutual exchange supported across our community."
            )}
          </p>
        </div>

        {/* 6 Informational Category Cards in a clean 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Daily Assistance */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4">
            <div className="h-11 w-11 rounded-xl bg-[#E7EEE4] text-primary flex items-center justify-center">
              <HandHelping className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">
                {t("categories.items.0.title", "Daily Assistance")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {t(
                  "categories.items.0.desc",
                  "Practical help with grocery runs, errands, light parcel carrying, and daily neighborhood tasks."
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.0.tags.0", "Grocery Runs")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.0.tags.1", "Errands")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.0.tags.2", "Neighborhood Help")}
              </span>
            </div>
          </div>

          {/* 2. Technology Help */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4">
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">
                {t("categories.items.1.title", "Technology Help")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {t(
                  "categories.items.1.desc",
                  "Patient guidance on smartphone navigation, video calls with family, email setup, and digital devices."
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.1.tags.0", "Smartphones")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.1.tags.1", "Video Calls")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.1.tags.2", "Digital Apps")}
              </span>
            </div>
          </div>

          {/* 3. Companionship */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4">
            <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">
                {t("categories.items.2.title", "Companionship")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {t(
                  "categories.items.2.desc",
                  "Warm and friendly conversation over tea, park strolls, reminiscing, and sharing joyful moments."
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.2.tags.0", "Tea Chats")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.2.tags.1", "Walking")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.2.tags.2", "Shared Hobbies")}
              </span>
            </div>
          </div>

          {/* 4. Learning & Skills */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4">
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">
                {t("categories.items.3.title", "Learning & Skills")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {t(
                  "categories.items.3.desc",
                  "Traditional home cooking, calligraphy, origami, language practice, history, and craft techniques."
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.3.tags.0", "Home Cooking")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.3.tags.1", "Handicrafts")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.3.tags.2", "Languages")}
              </span>
            </div>
          </div>

          {/* 5. Home Assistance */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Flower2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">
                {t("categories.items.4.title", "Home Assistance")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {t(
                  "categories.items.4.desc",
                  "Balcony gardening tips, plant watering during trips, book organization, and seasonal home tidying."
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.4.tags.0", "Gardening")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.4.tags.1", "Plant Care")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.4.tags.2", "Home Organization")}
              </span>
            </div>
          </div>

          {/* 6. Community & Local Activities */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4">
            <div className="h-11 w-11 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">
                {t("categories.items.5.title", "Community & Local Activities")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {t(
                  "categories.items.5.desc",
                  "Join neighborhood events, cultural activities, community gardening, and local group activities to build friendships and stay connected."
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.5.tags.0", "Local Events")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.5.tags.1", "Cultural Activities")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                {t("categories.items.5.tags.2", "Community Groups")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FINAL CALL TO ACTION — FULL-WIDTH NATURAL CARD MATCHING GRID           */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border-2 border-border bg-gradient-to-r from-[#234336] via-[#2F5344] to-[#234336] text-white p-6 sm:p-10 text-center space-y-4 shadow-sm relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
              {t("cta.title", "Everyone has something to share. Everyone has something to gain.")}
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              {t(
                "cta.subtitle",
                "Join your local Tsunagu community today. Whether you wish to share wisdom, lend an everyday hand, or connect with a neighbor, there is a place for you."
              )}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center">
            <Button
              asChild
              size="lg"
              className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-xs sm:text-sm px-8 py-3.5 h-12 rounded-xl shadow-md transition-all cursor-pointer gap-2"
            >
              <Link href="/posts">
                <span>{t("cta.getStarted", "Get Started")}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
