"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/services/authService";
import { HeroVideoSlider, HERO_VIDEOS } from "@/components/home/HeroVideoSlider";

export default function HomePage() {
  const router = useRouter();
  const session = useSession();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

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
          <span>Redirecting to community posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full space-y-12 sm:space-y-16 pb-20">
      {/* ========================================================================= */}
      {/* 2. HERO SECTION WITH SEAMLESS 3-VIDEO AUTOMATIC SLIDER                    */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-[#FAF9F5] via-[#F6F4EE] to-background border-b-2 border-border pt-8 pb-12 sm:pt-14 sm:pb-16 lg:pt-16 lg:pb-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
            {/* Left Column: Mission, Typography, Actions, Story Chapter Tabs */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-5 sm:space-y-6 text-left">
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D97D54]/30 bg-[#FDF4EF] px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#8A3D24] shadow-xs">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#C85D36] shrink-0" />
                <span>Community Skill &amp; Knowledge Exchange</span>
              </div>

              {/* Headline with Brand Underline Styling */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.65rem] xl:text-[2.85rem] font-black tracking-tight text-[#231F1C] leading-[1.2] sm:leading-[1.18]">
                Connecting the{" "}
                <span className="relative inline-block text-[#9E391A]">
                  <span>wisdom of the</span>
                  <span className="absolute left-0 -bottom-1 sm:-bottom-1.5 w-full h-[5px] sm:h-[6px] bg-[#E5B55E] rounded-full" />
                </span>
                <br className="hidden sm:inline" />
                {" "}
                <span className="relative inline-block text-[#9E391A]">
                  <span>past</span>
                  <span className="absolute left-0 -bottom-1 sm:-bottom-1.5 w-full h-[5px] sm:h-[6px] bg-[#E5B55E] rounded-full" />
                </span>
                {" "}with the{" "}
                <span className="relative inline-block text-[#2A4D3E]">
                  <span>energy of today.</span>
                  <span className="absolute left-0 -bottom-1 sm:-bottom-1.5 w-full h-[5px] sm:h-[6px] bg-[#66C2A5] rounded-full" />
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base lg:text-lg text-[#5C5248] font-medium leading-relaxed max-w-xl">
                Tsunagu Generations brings older and younger generations together to share knowledge, exchange practical help, and build meaningful companionship.
              </p>

              {/* Mobile-Only Video Placement for Clear Vertical Priority */}
              <div className="block lg:hidden pt-1">
                <HeroVideoSlider
                  externalIndex={activeVideoIndex}
                  onSlideChange={setActiveVideoIndex}
                />
              </div>

              {/* CTA Action Buttons */}
              <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#315B4B] hover:bg-[#234336] text-white font-bold text-sm sm:text-base px-7 py-3.5 h-12 rounded-xl shadow-md gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <Link href="/posts">
                    <span>Explore Community Posts</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-border bg-card hover:bg-muted font-bold text-sm sm:text-base px-6 py-3.5 h-12 rounded-xl cursor-pointer"
                >
                  <Link href="/register">
                    <span>Join Our Community</span>
                  </Link>
                </Button>
              </div>

              {/* Interactive Story Tabs Synchronized with Active Video */}
              <div className="pt-3 border-t border-border/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span className="text-[11px] uppercase tracking-wider">Community Story Highlights:</span>
                  <span className="text-[11px] font-mono font-semibold text-primary">
                    0{activeVideoIndex + 1} / 0{HERO_VIDEOS.length}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {HERO_VIDEOS.map((v, i) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => setActiveVideoIndex(i)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        activeVideoIndex === i
                          ? "bg-[#315B4B] text-white border-[#315B4B] shadow-sm scale-[1.02]"
                          : "bg-card/90 text-foreground border-border hover:border-primary/50 hover:bg-muted/70"
                      }`}
                    >
                      <span className={`text-[10px] font-mono font-bold block ${
                        activeVideoIndex === i ? "text-amber-300" : "text-muted-foreground"
                      }`}>
                        0{i + 1}
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold leading-tight line-clamp-1 mt-0.5">
                        {v.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Desktop & Tablet): Framed Automatic Video Slider */}
            <div className="hidden lg:block lg:col-span-6 xl:col-span-6">
              <div className="relative">
                {/* Subtle Ambient Decorative Glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-200/30 to-emerald-200/30 rounded-3xl blur-xl opacity-70 pointer-events-none" />
                <HeroVideoSlider
                  externalIndex={activeVideoIndex}
                  onSlideChange={setActiveVideoIndex}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ABOUT OUR PLATFORM SECTION                                             */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <span>Our Core Philosophy</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Everyone Can Teach, Everyone Can Learn
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Tsunagu Generations is founded on reciprocal community exchange. No user is locked into a permanent provider or receiver role—each generation brings valuable experience, curiosity, and care.
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
                Knowledge Sharing
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pass down traditional recipes, cultural crafts, calligraphy, gardening wisdom, and life stories, while younger members exchange modern skills, digital tools, and fresh viewpoints.
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 text-xs font-bold text-primary flex items-center gap-1">
              <span>Reciprocal learning</span>
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
                Mutual Support
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Help with everyday tasks such as smartphone settings, video calling, grocery errands, minor household chores, or seasonal preparation—provided with patience and neighborhood goodwill.
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 text-xs font-bold text-amber-800 flex items-center gap-1">
              <span>Practical assistance</span>
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
                Companionship
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Build genuine intergenerational friendships through casual conversation over tea, peaceful neighborhood walks, listening, and sharing hobbies that alleviate social isolation.
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 text-xs font-bold text-rose-700 flex items-center gap-1">
              <span>Social connection</span>
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
              How Tsunagu Works
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              A simple, respectful four-step process designed to make connecting effortless and safe for all ages.
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
                  Create a Post
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Post a skill or service you would love to share, or write a friendly request for assistance you need.
                </p>
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                Easy quick-post format
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
                  Discover & Respond
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Explore listings in your neighborhood. Send a polite connection request with an introductory message.
                </p>
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                Filter by category & area
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
                  Connect & Coordinate
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Chat securely within Tsunagu. Agree on the date, time, and comfortable public location for your exchange.
                </p>
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                In-app private messaging
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
                  Complete & Review
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Meet up, enjoy the mutual exchange, confirm completion, and leave warm, encouraging feedback for each other.
                </p>
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                Build community trust
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. EXCHANGE CATEGORIES SECTION — 5 INFORMATIONAL CARDS                     */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Exchange Categories
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Explore the diverse areas of mutual exchange supported across our community.
          </p>
        </div>

        {/* 5 Informational Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Daily Assistance */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4">
            <div className="h-11 w-11 rounded-xl bg-[#E7EEE4] text-primary flex items-center justify-center">
              <HandHelping className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Daily Assistance</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Practical help with grocery runs, errands, light parcel carrying, and daily neighborhood tasks.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Grocery Runs
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Errands
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Neighborhood Help
              </span>
            </div>
          </div>

          {/* 2. Technology Help */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4">
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Technology Help</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Patient guidance on smartphone navigation, video calls with family, email setup, and digital devices.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Smartphones
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Video Calls
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Digital Apps
              </span>
            </div>
          </div>

          {/* 3. Companionship */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4">
            <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Companionship</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Warm and friendly conversation over tea, park strolls, reminiscing, and sharing joyful moments.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Tea Chats
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Walking
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Shared Hobbies
              </span>
            </div>
          </div>

          {/* 4. Learning & Skills */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4">
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Learning & Skills</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Traditional home cooking, calligraphy, origami, language practice, history, and craft techniques.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Home Cooking
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Handicrafts
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Languages
              </span>
            </div>
          </div>

          {/* 5. Home Assistance */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/60 transition-all space-y-4 md:col-span-2 lg:col-span-1">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Flower2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Home Assistance</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Balcony gardening tips, plant watering during trips, book organization, and seasonal home tidying.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Gardening
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Plant Care
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Home Organization
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FINAL CALL TO ACTION — COMPACT CARD MATCHING SECTION STYLE             */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border-2 border-border bg-gradient-to-r from-[#234336] via-[#2F5344] to-[#234336] text-white p-6 sm:p-8 text-center space-y-4 shadow-sm relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
              Everyone has something to share. Everyone has something to gain.
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              Join your local Tsunagu community today. Whether you wish to share wisdom, lend an everyday hand, or connect with a neighbor, there is a place for you.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center">
            <Button
              asChild
              size="lg"
              className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-xs sm:text-sm px-7 py-3 h-11 rounded-xl shadow-md transition-all cursor-pointer gap-2"
            >
              <Link href="/posts">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
