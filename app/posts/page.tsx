"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Sparkles, PlusCircle, RefreshCcw, Search, SearchX } from "lucide-react";
import { usePosts } from "@/lib/services/postService";
import { useSession } from "@/lib/services/authService";
import { CATEGORIES, EXCHANGE_METHODS } from "@/lib/constants";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";

export default function PostsDirectoryPage() {
  const session = useSession();
  const allPosts = usePosts();
  const { t } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedExchange, setSelectedExchange] = useState("all");
  const [query, setQuery] = useState("");

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPosts.filter((post) => {
      if (selectedCategory !== "all" && post.category !== selectedCategory) return false;
      if (selectedExchange !== "all" && post.exchangeMethod !== selectedExchange) return false;
      if (
        q &&
        ![post.title, post.description, post.location, post.skill].some((field) => field?.toLowerCase().includes(q))
      )
        return false;
      return true;
    });
  }, [allPosts, selectedCategory, selectedExchange, query]);

  const hasFilters = selectedCategory !== "all" || selectedExchange !== "all" || query.trim() !== "";

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedExchange("all");
    setQuery("");
  };

  const chip = (active: boolean) =>
    `shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
      active
        ? "border-primary bg-primary text-primary-foreground shadow-glow"
        : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
    }`;

  return (
    <div className="pb-12 sm:pb-16">
      {/* ---------- Header band ---------- */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card to-background">
        <div
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_85%_10%,rgba(154,52,18,0.10),transparent_45%),radial-gradient(circle_at_5%_90%,rgba(63,79,58,0.10),transparent_40%)]"
          aria-hidden="true"
        />
        <div className="relative page-container py-8 sm:py-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl animate-fade-up">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              {t("postsPage.title", "Community Posts")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t(
                "postsPage.subtitle",
                "Explore skill offers, requests for assistance, and companionship in our neighborhood"
              )}
            </p>
          </div>

          {session && (
            <div className="grid grid-cols-2 md:flex md:items-center gap-2.5 w-full md:w-auto animate-fade-up [animation-delay:100ms]">
              <Button asChild className="group gap-1.5 font-bold">
                <Link href="/quick-post">
                  <Sparkles className="h-4 w-4 text-amber-200 transition-transform group-hover:rotate-12" />
                  {t("postsPage.quickPost", "Quick Post")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-1.5 font-semibold">
                <Link href="/posts/new">
                  <PlusCircle className="h-4 w-4" />
                  {t("postsPage.standardPost", "Standard Post")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="page-container pt-6 sm:pt-8 space-y-6">
        {/* ---------- Guest banner ---------- */}
        {!session && (
          <div className="rounded-2xl border-2 border-primary/20 bg-[#E7EEE4]/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 font-bold text-sm text-primary">
                <Sparkles className="h-4 w-4 text-amber-600" />
                {t("postsPage.guestBannerTitle", "Browsing Community Exchanges as a Guest")}
              </div>
              <p className="text-sm text-muted-foreground">
                {t(
                  "postsPage.guestBannerDesc",
                  "You can explore all skills, offers, and requests. Sign in or register when you are ready to respond to a neighbor or create your own post."
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 shrink-0 w-full sm:w-auto">
              <Button asChild variant="outline" size="sm" className="font-bold">
                <Link href="/login">{t("nav.login", "Log In")}</Link>
              </Button>
              <Button asChild size="sm" className="font-bold">
                <Link href="/register">{t("nav.register", "Register")}</Link>
              </Button>
            </div>
          </div>
        )}

        {/* ---------- Filters ---------- */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("postsPage.searchPlaceholder", "Search posts by title, skill or area...")}
                aria-label={t("postsPage.searchPlaceholder", "Search posts")}
                className="pl-12 rounded-xl shadow-xs"
              />
            </div>
            <div className="sm:w-60">
              <label htmlFor="exchange-filter" className="sr-only">
                {t("postsPage.exchangeLabel", "Exchange Method")}
              </label>
              <select
                id="exchange-filter"
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border-2 border-border bg-card px-4 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-primary/40 focus:outline-none focus:border-primary"
              >
                <option value="all">{t("postsPage.allExchanges", "All Exchange Types")}</option>
                {EXCHANGE_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category chips: horizontal scroll on mobile, wrap on desktop */}
          <div
            role="group"
            aria-label={t("postsPage.categoryLabel", "Category")}
            className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto snap-x scrollbar-none pb-1 sm:flex-wrap sm:overflow-visible"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={chip(selectedCategory === "all")}
              aria-pressed={selectedCategory === "all"}
            >
              {t("postsPage.allCategories", "All Categories")}
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={chip(selectedCategory === c)}
                aria-pressed={selectedCategory === c}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Results header ---------- */}
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-muted-foreground" aria-live="polite">
          <span>
            {t("postsPage.showingCount", `Showing ${filteredPosts.length} posts`, { count: filteredPosts.length })}
          </span>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-primary gap-1.5"
            >
              <RefreshCcw className="h-4 w-4" />
              {t("postsPage.resetFilters", "Clear all filters")}
            </Button>
          )}
        </div>

        {/* ---------- Grid ---------- */}
        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card px-6 py-14 text-center space-y-4 animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <SearchX className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">{t("postsPage.noPostsTitle", "No posts match your filters.")}</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("postsPage.noPostsDesc", "Try adjusting your filters, or check back soon as neighbors add new posts.")}
            </p>
            {hasFilters && (
              <Button variant="outline" onClick={resetFilters}>
                {t("postsPage.resetFilters", "Clear all filters")}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {filteredPosts.map((post, i) => (
              <div key={post.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
