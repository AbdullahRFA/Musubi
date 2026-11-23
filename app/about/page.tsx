import Link from "next/link";
import { Shield, HelpCircle, HeartHandshake, PhoneCall, Flag, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AboutSafetyPage() {
  const faqs = [
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

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* 1. Mission Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
          <HeartHandshake className="h-4 w-4" />
          <span>About Tsunagu Generations</span>
        </div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
          Connecting the Wisdom of the Past with the Energy of Today
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Tsunagu (繋ぐ, meaning &apos;to bridge or connect&apos;) is a grassroots community platform created to overcome
          generational isolation by enabling two-way knowledge exchange, daily help, and genuine local companionship.
        </p>
      </div>

      {/* 2. Safety Guidelines */}
      <section className="rounded-xl border-2 border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 text-primary border-b border-border pb-4">
          <Shield className="h-7 w-7 text-primary" />
          <h2 className="text-2xl font-extrabold text-foreground">Community Safety Principles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-secondary" />
              <span>1. Always Meet in Public First</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When arranging an in-person skill exchange or conversation, choose high-visibility public locations such as
              local public libraries, community centers, cafes, or public parks.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-secondary" />
              <span>2. Protect Financial Information</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Never share bank account details, online banking credentials, or keys. No real transactions take place on
              this platform.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-secondary" />
              <span>3. Check Profiles & Activity History</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Review completed activity counts and mutual feedback reviews on a member&apos;s public profile before agreeing to
              an exchange.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-secondary" />
              <span>4. Report & Block Any Inappropriate Behavior</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every profile and post features a one-click Report and Block tool. Blocked users are immediately hidden
              from your search and conversations.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-300 p-4 text-xs text-amber-900 font-medium">
          Reminder: Completed activities and ratings help you decide but are not a guarantee of safety. Trust your
          judgment at all times.
        </div>
      </section>

      {/* 3. Frequently Asked Questions */}
      <section id="faq" className="space-y-6">
        <div className="flex items-center gap-2 text-foreground">
          <HelpCircle className="h-6 w-6 text-secondary" />
          <h2 className="text-2xl font-extrabold">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="border-2 border-border bg-card p-6 space-y-2">
              <h3 className="font-bold text-lg text-foreground">{faq.q}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Support & Contact */}
      <section id="support" className="rounded-xl border-2 border-border bg-[#fffdfa] p-8 text-center space-y-4 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">Community Support</h2>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Need help navigating the site or have feedback on our accessibility? Reach out to our community coordinators.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link href="/posts">
            <Button size="lg" className="font-bold">
              Browse Community Posts
            </Button>
          </Link>
          <Link href="/quick-post">
            <Button variant="outline" size="lg" className="font-semibold">
              Create a Quick Post
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
