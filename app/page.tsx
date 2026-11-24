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
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/services/authService";
import { HeroBackgroundVideo } from "@/components/home/HeroBackgroundVideo";
import { PhilosophySlider } from "@/components/home/PhilosophySlider";
import { useLanguage } from "@/lib/i18n";

/* -------------------------------------------------------------------------- */
/* Static content definitions (text is resolved through i18n at render time)  */
/* -------------------------------------------------------------------------- */

const STEPS: { icon: LucideIcon; title: string; desc: string; badge: string }[] = [
  {
    icon: PenLine,
    title: "Create a Post",
    desc: "Post a skill or service you would love to share, or write a friendly request for assistance you need.",
    badge: "Easy quick-post format",
  },
  {
    icon: Compass,
    title: "Discover & Respond",
    desc: "Explore listings in your neighborhood. Send a polite connection request with an introductory message.",
    badge: "Filter by category & area",
  },
  {
    icon: MessageSquare,
    title: "Connect & Coordinate",
    desc: "Chat securely within Musubi. Agree on the date, time, and comfortable public location for your exchange.",
    badge: "In-app private messaging",
  },
  {
    icon: CheckCircle2,
    title: "Complete & Review",
    desc: "Meet up, enjoy the mutual exchange, confirm completion, and leave warm, encouraging feedback for each other.",
    badge: "Build community trust",
  },
];

const CATEGORIES: {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  desc: string;
  tags: string[];
  image: string;
}[] = [
  {
    icon: HandHelping,
    iconClass: "bg-[#E7EEE4] text-primary",
    title: "Daily Assistance",
    desc: "Practical help with grocery runs, errands, light parcel carrying, and daily neighborhood tasks.",
    tags: ["Grocery Runs", "Errands", "Neighborhood Help"],
    image: "/images/landing-section3/landing-section3-img1.jpg",
  },
  {
    icon: Smartphone,
    iconClass: "bg-blue-50 text-blue-700",
    title: "Technology Help",
    desc: "Patient guidance on smartphone navigation, video calls with family, email setup, and digital devices.",
    tags: ["Smartphones", "Video Calls", "Digital Apps"],
    image: "/images/landing-section3/landing-section3-img2.jpg",
  },
  {
    icon: HeartHandshake,
    iconClass: "bg-rose-50 text-rose-700",
    title: "Companionship",
    desc: "Warm and friendly conversation over tea, park strolls, reminiscing, and sharing joyful moments.",
    tags: ["Tea Chats", "Walking", "Shared Hobbies"],
    image: "/images/landing-section3/landing-section3-img3.jpg",
  },
  {
    icon: BookOpen,
    iconClass: "bg-amber-50 text-amber-800",
    title: "Learning & Skills",
    desc: "Traditional home cooking, calligraphy, origami, language practice, history, and craft techniques.",
    tags: ["Home Cooking", "Handicrafts", "Languages"],
    image: "/images/landing-section3/landing-section3-img4.jpg",
  },
  {
    icon: Flower2,
    iconClass: "bg-emerald-50 text-emerald-800",
    title: "Home Assistance",
    desc: "Balcony gardening tips, plant watering during trips, book organization, and seasonal home tidying.",
    tags: ["Gardening", "Plant Care", "Home Organization"],
    image: "/images/landing-section3/landing-section3-img5.jpg",
  },
  {
    icon: Users,
    iconClass: "bg-violet-50 text-violet-700",
    title: "Community & Local Activities",
    desc: "Join neighborhood events, cultural activities, community gardening, and local group activities to build friendships and stay connected.",
    tags: ["Local Events", "Cultural Activities", "Community Groups"],
    image: "/images/landing-section3/landing-section3-img6.jpg",
  },
];

/* -------------------------------------------------------------------------- */
/* Small presentational helpers                                               */
/* -------------------------------------------------------------------------- */

/** Highlighted phrase used in the hero headline. */
function Highlight({ children, tone }: { children: React.ReactNode; tone: "amber" | "emerald" }) {
  const colorClass = tone === "amber" ? "text-amber-300" : "text-emerald-300";
  return (
    <span className={`inline-block ${colorClass} drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]`}>
      {children}
    </span>
  );
}

function SectionHeading({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto space-y-3 animate-fade-up">
      {badge && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{badge}</span>
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground text-balance">
        {title}
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-balance">{subtitle}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

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
    <div className="flex flex-col">
      {/* ================================================================== */}
      {/* HERO                                                               */}
      {/* ================================================================== */}
      <HeroBackgroundVideo>
        <div className="max-w-4xl space-y-6 sm:space-y-8 text-left">
          <h1
            className="text-[2rem] min-[400px]:text-4xl sm:text-5xl md:text-6xl xl:text-[4.25rem] font-black tracking-tight text-white leading-[1.3] sm:leading-[1.24] [text-shadow:_0_2px_14px_rgba(0,0,0,0.85)] text-balance animate-fade-up [animation-delay:100ms]"
          >
            {language === "ja" ? (
              <>
                <Highlight tone="amber">過去の知恵</Highlight>
                <span>と、</span>
                <br className="hidden sm:inline" />{" "}
                <Highlight tone="emerald">現在のエネルギー</Highlight>
                <span>をつなぐ。</span>
              </>
            ) : (
              <>
                Connecting the <Highlight tone="amber">wisdom of the past</Highlight>
                <br className="hidden sm:inline" /> with the <Highlight tone="emerald">energy of today.</Highlight>
              </>
            )}
          </h1>

          <div className="pt-2 sm:pt-4 flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3.5 sm:gap-4 animate-fade-up [animation-delay:200ms]">
            <Button
              asChild
              size="lg"
              className="group bg-[#315B4B] hover:bg-[#234336] text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 rounded-xl shadow-xl border border-emerald-400/30 hover:-translate-y-0.5 hover:shadow-2xl"
            >
              <Link href="/posts">
                <span>{t("hero.exploreBtn", "Explore Community Posts")}</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 border-white/40 hover:border-white text-white hover:text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 rounded-xl backdrop-blur-md shadow-lg hover:-translate-y-0.5"
            >
              <Link href="/register">{t("hero.joinBtn", "Join Our Community")}</Link>
            </Button>
          </div>
        </div>
      </HeroBackgroundVideo>

      {/* ================================================================== */}
      {/* HOW IT WORKS                                                       */}
      {/* ================================================================== */}
      <section className="relative bg-[#FAF9F5] border-y border-border py-14 sm:py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none bg-[radial-gradient(circle_at_10%_20%,rgba(154,52,18,0.06),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(63,79,58,0.08),transparent_40%)]"
          aria-hidden="true"
        />
        <div className="relative page-container space-y-10 sm:space-y-12">
          <SectionHeading
            title={t("howItWorks.title", "How Musubi Works")}
            subtitle={t(
              "howItWorks.subtitle",
              "A simple, respectful four-step process designed to make connecting effortless and safe for all ages."
            )}
          />

          <ol className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Connecting line on large screens */}
            <div
              className="hidden lg:block absolute top-11 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10"
              aria-hidden="true"
            />
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="card-hover group relative rounded-2xl border-2 border-border bg-card p-6 shadow-xs flex flex-col justify-between gap-4 animate-fade-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-3xl text-primary/30 font-mono transition-colors duration-300 group-hover:text-primary/60">
                        0{i + 1}
                      </span>
                      <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-foreground">{t(`howItWorks.steps.${i}.title`, step.title)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(`howItWorks.steps.${i}.desc`, step.desc)}</p>
                  </div>
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    {t(`howItWorks.steps.${i}.badge`, step.badge)}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CATEGORIES                                                         */}
      {/* ================================================================== */}
      <section className="page-container py-14 sm:py-20 space-y-10">
        <SectionHeading
          title={t("categories.title", "Exchange Categories")}
          subtitle={t("categories.subtitle", "Explore the diverse areas of mutual exchange supported across our community.")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                href="/posts"
                className="card-hover group rounded-3xl border-2 border-border bg-card shadow-xs flex flex-col overflow-hidden animate-fade-up transition-all duration-300 hover:border-primary/80 hover:shadow-xl"
                style={{ animationDelay: `${(i % 3) * 100}ms` }}
              >
                {/* Category Image Header */}
                <div className="relative w-full h-52 sm:h-56 overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes(".jpg.jpg")) {
                        img.src = `${cat.image}.jpg`;
                      }
                    }}
                  />
                  {/* Gradient shadow overlay for aesthetic depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-85 group-hover:opacity-60 transition-opacity duration-300" />

                  {/* High-Contrast Category Icon Badge (Bright solid white card with bold icon) */}
                  <div className="absolute bottom-3 left-3 h-13 w-13 rounded-2xl bg-white shadow-xl border-2 border-white/95 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cat.iconClass} shadow-inner`}>
                      <Icon className="h-5 w-5 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* High-Contrast Action Arrow Badge (Bright solid white circular button) */}
                  <div className="absolute top-3 right-3 h-11 w-11 rounded-full bg-white text-primary shadow-xl border-2 border-white/95 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110">
                    <ArrowRight className="h-5 w-5 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* Category Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary flex items-center justify-between">
                      <span>{t(`categories.items.${i}.title`, cat.title)}</span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {t(`categories.items.${i}.desc`, cat.desc)}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/60">
                    <div className="flex flex-wrap gap-1.5">
                      {cat.tags.map((tag, j) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-semibold text-foreground group-hover:bg-[#E7EEE4] group-hover:text-[#315B4B] transition-colors"
                        >
                          {t(`categories.items.${i}.tags.${j}`, tag)}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs sm:text-sm font-bold text-primary group-hover:text-[#234336] transition-colors">
                      <span>{language === "ja" ? "投稿を見る" : "Explore posts"}</span>
                      <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================================================================== */}
      {/* SHOWCASE SLIDER (last, before footer)                                */}
      {/* ================================================================== */}
      <section id="explore" className="w-full pt-14 sm:pt-20 pb-16 sm:pb-24 space-y-8 sm:space-y-10 scroll-mt-20 overflow-hidden border-t border-border">
        <div className="page-container">
        <SectionHeading
          badge={t("about.badge", "Community Connections")}
          title={t("about.title", "Everyone Has Something to Share")}
          subtitle={t(
            "about.subtitle",
            "Every generation has knowledge, experiences and ideas worth sharing. Discover the connections that bring our community together."
          )}
        />
        </div>

        {/* Edge to edge, the same width as the hero banner */}
        <PhilosophySlider />
      </section>
    </div>
  );
}
