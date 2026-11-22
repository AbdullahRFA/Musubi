"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  HandHelping,
  HeartHandshake,
  ShieldCheck,
  Users,
  Compass,
  CheckCircle2,
  Smile,
  Laptop,
  Flower2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosts } from "@/lib/services/postService";
import { useSession } from "@/lib/services/authService";
import { PostCard } from "@/components/posts/PostCard";
import { CATEGORIES } from "@/lib/constants";

export default function LandingPage() {
  const posts = usePosts();
  const session = useSession();
  const recentPosts = posts.slice(0, 3);

  const categoriesWithIcons = [
    { name: "Daily Assistance", icon: HandHelping, desc: "Grocery shopping, errands, medicine pickup" },
    { name: "Technology Help", icon: Laptop, desc: "Smartphone guidance, video calls, digital setup" },
    { name: "Companionship", icon: HeartHandshake, desc: "Friendly chats, walking partners, shared hobbies" },
    { name: "Home Assistance", icon: Flower2, desc: "Gardening, plant care, light household tasks" },
    { name: "Learning", icon: BookOpen, desc: "Languages, calligraphy, origami, cooking recipes" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-card to-background border-b-2 border-border py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Community Skill & Knowledge Exchange</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Connecting the <span className="text-primary underline decoration-amber-300">wisdom of the past</span> with the{" "}
            <span className="text-secondary underline decoration-emerald-300">energy of today</span>.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tsunagu Generations brings older and younger generations together to share knowledge, exchange practical
            help, and build meaningful companionship.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button size="lg" className="font-bold text-lg px-8 shadow-md">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/quick-post">
                  <Button variant="secondary" size="lg" className="font-bold text-lg gap-2">
                    <Sparkles className="h-5 w-5 text-amber-200" />
                    Create Quick Post
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register?group=og">
                  <Button
                    size="lg"
                    className="font-bold text-base sm:text-lg bg-primary hover:bg-[#832c0f] text-white shadow-md gap-2"
                  >
                    <Users className="h-5 w-5" />
                    Join as Older Generation (O.G.)
                  </Button>
                </Link>
                <Link href="/register?group=yg">
                  <Button
                    size="lg"
                    className="font-bold text-base sm:text-lg bg-secondary hover:bg-[#32402e] text-white shadow-md gap-2"
                  >
                    <Smile className="h-5 w-5" />
                    Join as Younger Generation (Y.G.)
                  </Button>
                </Link>
                <Link href="/posts">
                  <Button variant="outline" size="lg" className="font-bold text-base sm:text-lg">
                    Browse Posts
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Two-Way Exchange Philosophy */}
      <section className="py-14 bg-card border-b-2 border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-extrabold text-foreground">
            Everyone Can Teach, Everyone Can Learn
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            There are no fixed roles here. Whether you are 19 or 82, you have experiences to share and everyday needs
            where a neighbor can lend a hand. Every registered member can both offer assistance and request help.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
            <div className="rounded-lg border-2 border-border bg-[#fffaf3] p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-primary font-bold text-xl">
                <BookOpen className="h-6 w-6" />
                <span>Older Generation (O.G.)</span>
              </div>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Share traditional cooking, gardening wisdom, and craftsmanship.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Get easy support with smartphones, tech, and medicine pickup.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span>One-click Quick Post wizard created specifically for simplicity.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border-2 border-border bg-[#fffaf3] p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-secondary font-bold text-xl">
                <HandHelping className="h-6 w-6" />
                <span>Younger Generation (Y.G.)</span>
              </div>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Learn timeless life skills, languages, and cultural traditions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Offer tech guidance, grocery delivery, and walking companionship.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Earn community activity history and verified mutual reviews.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4-Step "How It Works" */}
      <section className="py-16 bg-background border-b-2 border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-foreground">How Tsunagu Works</h2>
            <p className="text-base text-muted-foreground">
              A safe, transparent 4-step journey designed for all experience levels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-lg border-2 border-border bg-card p-6 space-y-3 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-bold text-xl text-foreground">Post or Quick-Post</h3>
              <p className="text-sm text-muted-foreground">
                Describe what you can offer or what you need. Older members can use our 1-click requirement templates.
              </p>
            </div>

            <div className="rounded-lg border-2 border-border bg-card p-6 space-y-3 text-center">
              <div className="h-12 w-12 rounded-full bg-secondary/10 text-secondary font-bold text-xl flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-bold text-xl text-foreground">Respond & Accept</h3>
              <p className="text-sm text-muted-foreground">
                Connect with community members. Post owners review and accept service requests to unlock private chat.
              </p>
            </div>

            <div className="rounded-lg border-2 border-border bg-card p-6 space-y-3 text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-800 font-bold text-xl flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-bold text-xl text-foreground">Coordinate & Meet</h3>
              <p className="text-sm text-muted-foreground">
                Agree on exchange methods (skill, service, or demo payment) and meet in public or friendly local places.
              </p>
            </div>

            <div className="rounded-lg border-2 border-border bg-card p-6 space-y-3 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xl flex items-center justify-center mx-auto">
                4
              </div>
              <h3 className="font-bold text-xl text-foreground">Complete & Rate</h3>
              <p className="text-sm text-muted-foreground">
                Mark the exchange complete together and leave honest star feedback to build community trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Categories */}
      <section className="py-14 bg-card border-b-2 border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-foreground">Exchange Categories</h2>
              <p className="text-base text-muted-foreground">Explore common ways our generations help each other</p>
            </div>
            <Link href="/posts">
              <Button variant="outline" className="gap-2 font-semibold">
                <span>View all posts</span>
                <Compass className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categoriesWithIcons.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  href={`/search?category=${encodeURIComponent(cat.name)}`}
                  className="rounded-lg border-2 border-border bg-background p-5 space-y-2 hover:border-primary hover:bg-[#fffdfa] transition-all group"
                >
                  <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Latest Community Posts Preview */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-foreground">Recent Community Posts</h2>
              <p className="text-base text-muted-foreground">
                Offers and requests from neighbors in your area right now
              </p>
            </div>
            <Link href="/posts">
              <Button variant="default" className="font-semibold gap-2">
                <span>Browse all {posts.length} posts</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-lg border-2 border-border">
              <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
