import Link from "next/link";
import {
  Shield,
  HelpCircle,
  HeartHandshake,
  CheckCircle2,
  ChevronDown,
  PenLine,
  Compass,
  MessageSquare,
  Star,
  Mail,
  ArrowRight,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    q: "Who is Tsunagu Generations for?",
    a: "Tsunagu Generations is designed for both older generation members (looking to share wisdom, traditional crafts, or receive everyday assistance) and younger generation members (eager to learn life skills, languages, or offer practical support). There are no strict age cutoffs—everyone can both teach and learn.",
  },
  {
    q: "Is real money required or processed on Tsunagu?",
    a: "No! Tsunagu Generations is a community exchange. Any payment options in the app are strictly simulated demo transactions (clearly labelled DEMO). No credit card numbers or real payment gateways are connected.",
  },
  {
    q: "How does the Quick Post wizard work?",
    a: "The Quick Post wizard provides accessible, guided templates across all 6 core categories for both Offers and Requests with large buttons, minimal typing, and readable text for all community members.",
  },
  {
    q: "When does chat open between two members?",
    a: "To prevent spam and protect privacy, private chat is unlocked only after the post owner formally accepts a service request.",
  },
  {
    q: "Can I share my phone number?",
    a: "Yes, but only if you choose 'Phone' as your contact method in your profile preferences, and only with a member whose request has been accepted. Your number is never made public.",
  },
];

const SAFETY_PRINCIPLES = [
  {
    title: "Always Meet in Public First",
    body: "When arranging an in-person skill exchange or conversation, choose high-visibility public locations such as local public libraries, community centers, cafes, or public parks.",
  },
  {
    title: "Protect Financial Information",
    body: "Never share bank account details, online banking credentials, or keys. No real transactions take place on this platform.",
  },
  {
    title: "Check Profiles & Activity History",
    body: "Review completed activity counts and mutual feedback reviews on a member's public profile before agreeing to an exchange.",
  },
  {
    title: "Report & Block Any Inappropriate Behavior",
    body: "Every profile and post features a one-click Report and Block tool. Blocked users are immediately hidden from your search and conversations.",
  },
];

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: PenLine, title: "Post", body: "Share an offer or ask for help using the guided Quick Post wizard." },
  { icon: Compass, title: "Discover", body: "Browse nearby posts and send a friendly request to connect." },
  { icon: MessageSquare, title: "Chat", body: "Private chat unlocks once a request is accepted." },
  { icon: Star, title: "Review", body: "Meet, complete the exchange, and leave warm feedback." },
];

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">{children}</h2>
    </div>
  );
}

export default function AboutSafetyPage() {
  return (
    <div className="pb-12 sm:pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card to-background">
        <div
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_20%,rgba(154,52,18,0.10),transparent_45%),radial-gradient(circle_at_85%_60%,rgba(63,79,58,0.12),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs sm:text-sm font-bold text-primary animate-fade-up">
            <HeartHandshake className="h-4 w-4" />
            <span>About Tsunagu Generations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight text-balance animate-fade-up [animation-delay:100ms]">
            Connecting the Wisdom of the Past with the{" "}
            <span className="bg-gradient-to-r from-primary to-[#c2410c] bg-clip-text text-transparent">Energy of Today</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-up [animation-delay:200ms]">
            Tsunagu (繋ぐ, meaning &apos;to bridge or connect&apos;) is a grassroots community platform created to overcome
            generational isolation by enabling two-way knowledge exchange, daily help, and genuine local companionship.
          </p>
          <nav
            aria-label="On this page"
            className="flex flex-wrap justify-center gap-2 pt-2 animate-fade-up [animation-delay:300ms]"
          >
            {[
              ["#how-it-works", "How it works"],
              ["#safety", "Safety"],
              ["#faq", "FAQ"],
              ["#contact", "Contact"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary/40 hover:text-primary hover:-translate-y-0.5 hover:shadow-soft"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-20 pt-12 sm:pt-16">
        {/* How it works */}
        <section id="how-it-works" className="space-y-6 scroll-mt-24">
          <SectionTitle icon={Compass}>How It Works</SectionTitle>
          <ol className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="card-hover group rounded-2xl border-2 border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono font-black text-2xl text-primary/25">0{i + 1}</span>
                </div>
                <h3 className="font-bold text-lg text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Safety */}
        <section
          id="safety"
          className="scroll-mt-24 rounded-2xl border-2 border-border bg-card p-5 sm:p-8 space-y-6 shadow-sm"
        >
          <SectionTitle icon={Shield}>Community Safety Principles</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAFETY_PRINCIPLES.map(({ title, body }, i) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background/60 p-4 sm:p-5 space-y-2 transition-colors duration-200 hover:border-secondary/40 hover:bg-background"
              >
                <h3 className="font-bold text-base sm:text-lg text-foreground flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <span>
                    {i + 1}. {title}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed pl-7">{body}</p>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-300 p-4 text-sm text-amber-900 font-medium">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
            <p>
              Reminder: Completed activities and ratings help you decide but are not a guarantee of safety. Trust your
              judgment at all times.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="space-y-6 scroll-mt-24">
          <SectionTitle icon={HelpCircle}>Frequently Asked Questions</SectionTitle>
          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <details
                key={faq.q}
                open={idx === 0}
                className="group rounded-xl border-2 border-border bg-card transition-colors duration-200 open:border-primary/30 open:shadow-soft hover:border-primary/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 font-bold text-base sm:text-lg text-foreground [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180 group-open:text-primary" />
                </summary>
                <p className="px-4 sm:px-5 pb-5 -mt-1 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Support & Contact */}
        <section
          id="support"
          className="relative scroll-mt-24 overflow-hidden rounded-3xl bg-gradient-to-br from-[#234336] via-[#2F5344] to-[#1c332a] p-6 sm:p-12 text-center text-white shadow-lift"
        >
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" aria-hidden="true" />
          <div id="contact" className="relative space-y-4 scroll-mt-24">
            <Mail className="h-10 w-10 mx-auto text-amber-300" />
            <h2 className="text-2xl sm:text-3xl font-black">Community Support</h2>
            <p className="text-sm sm:text-base text-white/85 max-w-xl mx-auto leading-relaxed">
              Need help navigating the site or have feedback on our accessibility? Reach out to our community
              coordinators.
            </p>
            <div className="flex flex-col min-[480px]:flex-row justify-center gap-3 pt-3">
              <Button
                asChild
                size="lg"
                className="group bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold rounded-xl hover:-translate-y-0.5"
              >
                <Link href="/posts">
                  Browse Community Posts
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-transparent border-white/40 hover:border-white hover:bg-white/10 text-white hover:text-white font-semibold rounded-xl"
              >
                <Link href="/quick-post">Create a Quick Post</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
