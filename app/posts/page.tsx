"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Sparkles, PlusCircle, Search, RefreshCcw } from "lucide-react";
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
  const { language, t } = useLanguage();

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState<"all" | "offer" | "request">("all");
  const [selectedExchange, setSelectedExchange] = useState("all");

  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      if (selectedCategory !== "all" && post.category !== selectedCategory) return false;
      if (selectedType !== "all" && post.postType !== selectedType) return false;
      if (selectedExchange !== "all" && post.exchangeMethod !== selectedExchange) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesDesc = post.description.toLowerCase().includes(q);
        const matchesSkill = post.skill.toLowerCase().includes(q);
        const matchesLocation = post.location.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesSkill && !matchesLocation) return false;
      }
      return true;
    });
  }, [allPosts, query, selectedCategory, selectedType, selectedExchange]);

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedType("all");
    setSelectedExchange("all");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">
            {t("postsPage.title", "Community Posts")}
          </h1>
          <p className="text-base text-muted-foreground">
            {t(
              "postsPage.subtitle",
              "Explore skill offers, requests for assistance, and companionship in our neighborhood"
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto gap-1.5 font-bold bg-primary hover:bg-[#234336] text-white shadow-xs h-9 text-xs cursor-pointer">
            <Link href="/quick-post">
              <Sparkles className="h-4 w-4 text-amber-200" />
              <span>{t("postsPage.quickPost", "Quick Post")}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto gap-1.5 font-semibold h-9 text-xs cursor-pointer">
            <Link href="/posts/new">
              <PlusCircle className="h-4 w-4" />
              <span>{t("postsPage.standardPost", "Standard Post")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Guest Exploration Banner for Logged-Out / Unregistered Visitors */}
      {!session && (
        <div className="rounded-xl border-2 border-primary/30 bg-[#E7EEE4]/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-primary">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>{t("postsPage.guestBannerTitle", "Browsing Community Exchanges as a Guest")}</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t(
                "postsPage.guestBannerDesc",
                "You can explore all skills, offers, and requests. Sign in or register when you are ready to respond to a neighbor or create your own post."
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button asChild variant="outline" size="sm" className="font-bold text-xs h-8 px-3 cursor-pointer w-full sm:w-auto">
              <Link href="/login">{t("nav.login", "Log In")}</Link>
            </Button>
            <Button asChild size="sm" className="font-bold text-xs h-8 px-3 bg-primary hover:bg-[#234336] text-white cursor-pointer w-full sm:w-auto">
              <Link href="/register">{t("nav.register", "Register")}</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="rounded-lg border-2 border-border bg-card p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("postsPage.searchPlaceholder", "Filter by keyword, skill, title, or place...")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11"
            />
          </div>

          {(query || selectedCategory !== "all" || selectedType !== "all" || selectedExchange !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <RefreshCcw className="h-4 w-4" />
              <span>{t("postsPage.resetFilters", "Clear all filters")}</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
          {/* Post Type Selector */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
              {t("postsPage.typeLabel", "Type of Post")}
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
              {(["all", "offer", "request"] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setSelectedType(tp)}
                  className={`py-1.5 text-xs font-bold rounded capitalize transition-colors ${
                    selectedType === tp
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tp === "all"
                    ? t("postsPage.allTypes", "All")
                    : tp === "offer"
                    ? t("postsPage.offers", "Offers")
                    : t("postsPage.requests", "Requests")}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
              {t("postsPage.categoryLabel", "Category")}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border-2 border-border bg-card px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">{t("postsPage.allCategories", "All Categories")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Exchange Method Selector */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
              {t("postsPage.exchangeLabel", "Exchange Method")}
            </label>
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="w-full rounded-md border-2 border-border bg-card px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
        <span>{t("postsPage.showingCount", `Showing ${filteredPosts.length} posts`, { count: filteredPosts.length })}</span>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 text-center space-y-4">
          <p className="text-lg font-medium text-foreground">
            {t("postsPage.noPostsTitle", "No posts match your filters.")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              "postsPage.noPostsDesc",
              "Try adjusting your search keywords, or check back soon as neighbors add new posts."
            )}
          </p>
          <Button variant="outline" onClick={resetFilters}>
            {t("postsPage.resetFilters", "Clear all filters")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
