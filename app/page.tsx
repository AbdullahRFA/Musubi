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
  ShieldCheck,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/services/authService";
import { HeroBackgroundVideo } from "@/components/home/HeroBackgroundVideo";
import { useLanguage } from "@/lib/i18n";

/* -------------------------------------------------------------------------- */
/* Static content definitions (text is resolved through i18n at render time)  */
/* -------------------------------------------------------------------------- */

interface PhilosophyCard {
  icon: LucideIcon;
  iconClass: string;
  tagClass: string;
  title: string;
  desc: string;
  tag: string;
}

const PHILOSOPHY: PhilosophyCard[] = [
  {
    icon: BookOpen,
    iconClass: "bg-[#E7EEE4] text-primary",
    tagClass: "text-primary",
    title: "Knowledge Sharing",
    desc: "Pass down traditional recipes, cultural crafts, calligraphy, gardening wisdom, and life stories, while younger members exchange modern skills, digital tools, and fresh viewpoints.",
    tag: "Reciprocal learning",
  },
  {
    icon: HandHelping,
    iconClass: "bg-amber-100 text-amber-800",
    tagClass: "text-amber-800",
    title: "Mutual Support",
    desc: "Help with everyday tasks such as smartphone settings, video calling, grocery errands, minor household chores, or seasonal preparation—provided with patience and neighborhood goodwill.",
    tag: "Practical assistance",
  },
  {
    icon: HeartHandshake,
    iconClass: "bg-rose-100 text-rose-700",
    tagClass: "text-rose-700",
    title: "Companionship",
    desc: "Build genuine intergenerational friendships through casual conversation over tea, peaceful neighborhood walks, listening, and sharing hobbies that alleviate social isolation.",
    tag: "Social connection",
  },
];

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
    desc: "Chat securely within Tsunagu. Agree on the date, time, and comfortable public location for your exchange.",
    badge: "In-app private messaging",
  },
  {
    icon: CheckCircle2,
    title: "Complete & Review",
    desc: "Meet up, enjoy the mutual exchange, confirm completion, and leave warm, encouraging feedback for each other.",
    badge: "Build community trust",
  },
];

const CATEGORIES: { icon: LucideIcon; iconClass: string; title: string; desc: string; tags: string[] }[] = [
  {
    icon: HandHelping,
    iconClass: "bg-[#E7EEE4] text-primary",
    title: "Daily Assistance",
    desc: "Practical help with grocery runs, errands, light parcel carrying, and daily neighborhood tasks.",
    tags: ["Grocery Runs", "Errands", "Neighborhood Help"],
  },
  {
    icon: Smartphone,
    iconClass: "bg-blue-50 text-blue-700",
    title: "Technology Help",
    desc: "Patient guidance on smartphone navigation, video calls with family, email setup, and digital devices.",
    tags: ["Smartphones", "Video Calls", "Digital Apps"],
  },
  {
    icon: HeartHandshake,
    iconClass: "bg-rose-50 text-rose-700",
    title: "Companionship",
    desc: "Warm and friendly conversation over tea, park strolls, reminiscing, and sharing joyful moments.",
    tags: ["Tea Chats", "Walking", "Shared Hobbies"],
  },
  {
    icon: BookOpen,
    iconClass: "bg-amber-50 text-amber-800",
    title: "Learning & Skills",
    desc: "Traditional home cooking, calligraphy, origami, language practice, history, and craft techniques.",
    tags: ["Home Cooking", "Handicrafts", "Languages"],
  },
  {
    icon: Flower2,
    iconClass: "bg-emerald-50 text-emerald-800",
    title: "Home Assistance",
    desc: "Balcony gardening tips, plant watering during trips, book organization, and seasonal home tidying.",
    tags: ["Gardening", "Plant Care", "Home Organization"],
  },
  {
    icon: Users,
    iconClass: "bg-violet-50 text-violet-700",
    title: "Community & Local Activities",
    desc: "Join neighborhood events, cultural activities, community gardening, and local group activities to build friendships and stay connected.",
    tags: ["Local Events", "Cultural Activities", "Community Groups"],
  },
];

/* -------------------------------------------------------------------------- */
/* Small presentational helpers                                               */
/* -------------------------------------------------------------------------- */

/** Highlighted phrase with a coloured underline bar used in the hero headline. */
function Highlight({ children, tone }: { children: React.ReactNode; tone: "amber" | "emerald" }) {
  const styles =
    tone === "amber"
      ? { text: "text-amber-300", bar: "bg-[#E5B55E]" }
      : { text: "text-emerald-300", bar: "bg-[#66C2A5]" };
  return (
    <span className={`relative inline-block ${styles.text} drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]`}>
      <span>{children}</span>
      <span
        className={`absolute left-0 -bottom-1 sm:-bottom-1.5 w-full h-[4px] sm:h-[6px] ${styles.bar} rounded-full shadow-md`}
        aria-hidden="true"
      />
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

  const trustPoints = [
    { icon: ShieldCheck, label: t("hero.trust.0", language === "ja" ? "安全第一" : "Safety first") },
    { icon: MapPin, label: t("hero.trust.1", language === "ja" ? "地域密着" : "Local neighbours") },
    { icon: Users, label: t("hero.trust.2", language === "ja" ? "全世代歓迎" : "All ages welcome") },
  ];

  return (
    <div className="flex flex-col pb-12 sm:pb-16">
      {/* ================================================================== */}
      {/* HERO                                                               */}
      {/* ================================================================== */}
      <HeroBackgroundVideo>
        <div className="max-w-4xl space-y-5 sm:space-y-8 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm animate-fade-up">
            <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
            <span>{t("hero.badge", "Community Skill & Knowledge Exchange")}</span>
          </div>

          <h1
            className="text-[2rem] min-[400px]:text-4xl sm:text-5xl md:text-6xl xl:text-[4.25rem] font-black tracking-tight text-white leading-[1.15] sm:leading-[1.1] [text-shadow:_0_2px_14px_rgba(0,0,0,0.85)] text-balance animate-fade-up [animation-delay:100ms]"
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

          <p className="text-base sm:text-lg md:text-xl text-white/95 font-medium leading-relaxed max-w-2xl [text-shadow:_0_1px_8px_rgba(0,0,0,0.85)] animate-fade-up [animation-delay:200ms]">
            {t(
              "hero.subtitle",
              "Tsunagu Generations brings older and younger generations together to share knowledge, exchange practical help, and build meaningful companionship."
            )}
          </p>

          <div className="pt-1 sm:pt-2 flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3 animate-fade-up [animation-delay:300ms]">
            <Button
              asChild
              size="lg"
              className="group bg-[#315B4B] hover:bg-[#234336] text-white font-bold text-sm sm:text-base px-6 sm:px-8 rounded-xl shadow-xl border border-emerald-400/30 hover:-translate-y-0.5 hover:shadow-2xl"
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
              className="bg-white/10 hover:bg-white/20 border-white/40 hover:border-white text-white hover:text-white font-bold text-sm sm:text-base px-6 sm:px-8 rounded-xl backdrop-blur-md shadow-lg hover:-translate-y-0.5"
            >
              <Link href="/register">{t("hero.joinBtn", "Join Our Community")}</Link>
            </Button>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs sm:text-sm text-white/90 font-semibold animate-fade-up [animation-delay:400ms]">
            {trustPoints.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5 [text-shadow:_0_1px_6px_rgba(0,0,0,0.8)]">
                <Icon className="h-4 w-4 text-emerald-300" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </HeroBackgroundVideo>

      {/* ================================================================== */}
      {/* PHILOSOPHY                                                         */}
      {/* ================================================================== */}
      <section id="explore" className="page-container py-14 sm:py-20 space-y-10 scroll-mt-20">
        <SectionHeading
          badge={t("about.badge", "Our Core Philosophy")}
          title={t("about.title", "Everyone Can Teach, Everyone Can Learn")}
          subtitle={t(
            "about.subtitle",
            "Tsunagu Generations is founded on reciprocal community exchange. No user is locked into a permanent provider or receiver role—each generation brings valuable experience, curiosity, and care."
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {PHILOSOPHY.map((card, i) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="card-hover group rounded-2xl border-2 border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between gap-5 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="space-y-4">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${card.iconClass}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-foreground">{t(`about.cards.${i}.title`, card.title)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`about.cards.${i}.desc`, card.desc)}</p>
                </div>
                <div className={`pt-3 border-t border-border/60 text-xs font-bold flex items-center gap-1 ${card.tagClass}`}>
                  <span>{t(`about.cards.${i}.tag`, card.tag)}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </article>
            );
          })}
        </div>
      </section>

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
            title={t("howItWorks.title", "How Tsunagu Works")}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                href="/posts"
                className="card-hover group rounded-2xl border-2 border-border bg-card p-6 shadow-xs flex flex-col gap-4 animate-fade-up"
                style={{ animationDelay: `${(i % 3) * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${cat.iconClass}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-foreground transition-colors group-hover:text-primary">
                    {t(`categories.items.${i}.title`, cat.title)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {t(`categories.items.${i}.desc`, cat.desc)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/60">
                  {cat.tags.map((tag, j) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground"
                    >
                      {t(`categories.items.${i}.tags.${j}`, tag)}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA                                                          */}
      {/* ================================================================== */}
      <section className="page-container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#234336] via-[#2F5344] to-[#1c332a] text-white px-6 py-12 sm:px-12 sm:py-16 text-center shadow-lift">
          {/* Decorative orbs */}
          <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" aria-hidden="true" />

          <div className="relative max-w-2xl mx-auto space-y-4">
            <HeartHandshake className="h-10 w-10 mx-auto text-amber-300 animate-float" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-balance">
              {t("cta.title", "Everyone has something to share. Everyone has something to gain.")}
            </h2>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed">
              {t(
                "cta.subtitle",
                "Join your local Tsunagu community today. Whether you wish to share wisdom, lend an everyday hand, or connect with a neighbor, there is a place for you."
              )}
            </p>
          </div>

          <div className="relative pt-7 flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="group bg-amber-400 hover:bg-amber-300 text-stone-900 font-black rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Link href="/register">
                <span>{t("cta.getStarted", "Get Started")}</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-transparent border-white/40 hover:border-white hover:bg-white/10 text-white hover:text-white font-bold rounded-xl"
            >
              <Link href="/about">{t("footer.howItWorks", "How It Works")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
