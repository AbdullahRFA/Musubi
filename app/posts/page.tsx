"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, PlusCircle, RefreshCcw, Search, SearchX, ChevronDown } from "lucide-react";
import { usePosts, usePostsLoaded } from "@/lib/services/postService";
import { useAppStore } from "@/lib/store/useAppStore";
import { useSession } from "@/lib/services/authService";
import { CATEGORIES, EXCHANGE_METHODS } from "@/lib/constants";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";

/** Posts revealed per "See more" click — three full rows on desktop. */
const PAGE_SIZE = 9;
const VIEW_STATE_KEY = "tsunagu_posts_view";

interface ViewState {
  category: string;
  exchange: string;
  query: string;
  visible: number;
  scrollY: number;
  /** Where the user went when leaving — we only restore after viewing a post. */
  leftTo?: string;
}

function ChipCount({ n, active }: { n: number; active: boolean }) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums ${
        active ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

function PostCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
      <div className="h-1.5 w-full bg-muted" />
      <div className="space-y-4 p-5 animate-pulse">
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-6 w-24 rounded-full bg-muted" />
        </div>
        <div className="h-6 w-4/5 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-11/12 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-2.5 pt-2">
          <div className="h-9 w-9 rounded-full bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 rounded-lg bg-muted" />
          <div className="h-10 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function PostsDirectoryPage() {
  const session = useSession();
  const allPosts = usePosts();
  const { t } = useLanguage();

  const loaded = usePostsLoaded();
  const users = useAppStore((state) => state.users);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedExchange, setSelectedExchange] = useState("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const restoreScrollRef = useRef<number | null>(null);
  const firstNewCardRef = useRef<HTMLDivElement | null>(null);
  const focusIndexRef = useRef<number | null>(null);

  // Restore filters, "See more" progress and scroll after returning from a post
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(VIEW_STATE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<ViewState>;
      sessionStorage.removeItem(VIEW_STATE_KEY);
      // Only resume when coming back from a post's detail page
      if (!saved.leftTo || !/^\/posts\/(?!new$)[^/]+/.test(saved.leftTo)) return;
      if (typeof saved.category === "string") setSelectedCategory(saved.category);
      if (typeof saved.exchange === "string") setSelectedExchange(saved.exchange);
      if (typeof saved.query === "string") setQuery(saved.query);
      if (typeof saved.visible === "number") setVisible(Math.max(PAGE_SIZE, saved.visible));
      if (typeof saved.scrollY === "number") restoreScrollRef.current = saved.scrollY;
    } catch {
      // ignore unreadable state
    }
  }, []);

  // Remember the view (including scroll position) when leaving the page
  const viewRef = useRef<ViewState>({ category: "all", exchange: "all", query: "", visible: PAGE_SIZE, scrollY: 0 });
  viewRef.current = { category: selectedCategory, exchange: selectedExchange, query, visible, scrollY: 0 };
  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(
          VIEW_STATE_KEY,
          // On client-side navigation the URL has already changed when this runs
          JSON.stringify({ ...viewRef.current, scrollY: window.scrollY, leftTo: window.location.pathname })
        );
      } catch {
        // storage unavailable
      }
    };
    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.removeEventListener("pagehide", save);
    };
  }, []);

  const authorNames = useMemo(() => new Map(users.map((u) => [u.id, u.fullName.toLowerCase()])), [users]);

  // Posts matching search + exchange (category applied separately for chip counts)
  const baseMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPosts.filter((post) => {
      if (selectedExchange !== "all" && post.exchangeMethod !== selectedExchange) return false;
      if (!q) return true;
      return [post.title, post.description, post.location, post.skill, post.category, authorNames.get(post.authorId)].some(
        (field) => field?.toLowerCase().includes(q)
      );
    });
  }, [allPosts, selectedExchange, query, authorNames]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of baseMatches) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    return counts;
  }, [baseMatches]);

  const filteredPosts = useMemo(
    () => (selectedCategory === "all" ? baseMatches : baseMatches.filter((p) => p.category === selectedCategory)),
    [baseMatches, selectedCategory]
  );

  const shownPosts = filteredPosts.slice(0, visible);
  const remaining = Math.max(0, filteredPosts.length - shownPosts.length);
  const hasFilters = selectedCategory !== "all" || selectedExchange !== "all" || query.trim() !== "";

  // Any filter change starts the list from the top again
  const changeFilter = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setVisible(PAGE_SIZE);
  };
  const onCategory = changeFilter(setSelectedCategory);
  const onExchange = changeFilter(setSelectedExchange);
  const onQuery = changeFilter(setQuery);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedExchange("all");
    setQuery("");
    setVisible(PAGE_SIZE);
  };

  const showMore = () => {
    focusIndexRef.current = shownPosts.length; // first card of the next batch
    setVisible((v) => v + PAGE_SIZE);
  };

  // Move keyboard / screen-reader focus to the first newly revealed card
  useEffect(() => {
    if (focusIndexRef.current !== null && firstNewCardRef.current) {
      firstNewCardRef.current.focus({ preventScroll: true });
      focusIndexRef.current = null;
    }
  }, [visible]);

  // Restore the previous scroll position once the posts have rendered
  useEffect(() => {
    if (restoreScrollRef.current === null || !loaded || !allPosts.length) return;
    const y = restoreScrollRef.current;
    restoreScrollRef.current = null;
    requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, [loaded, allPosts.length]);

  const chip = (active: boolean) =>
    `inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
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
                onChange={(e) => onQuery(e.target.value)}
                placeholder={t("postsPage.searchPlaceholder", "Search posts by title, skill or area...")}
                aria-label={t("postsPage.searchPlaceholder", "Search posts")}
                className="pl-12 rounded-xl shadow-xs"
              />
            </div>
            <div className="relative sm:w-60">
              <label htmlFor="exchange-filter" className="sr-only">
                {t("postsPage.exchangeLabel", "Exchange Method")}
              </label>
              {/* appearance-none: Safari otherwise ignores the height and renders a thin native control */}
              <select
                id="exchange-filter"
                value={selectedExchange}
                onChange={(e) => onExchange(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border-2 border-border bg-card pl-4 pr-10 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-primary/40 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">{t("postsPage.allExchanges", "All Exchange Types")}</option>
                {EXCHANGE_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              onClick={() => onCategory("all")}
              className={chip(selectedCategory === "all")}
              aria-pressed={selectedCategory === "all"}
            >
              {t("postsPage.allCategories", "All Categories")}
              <ChipCount n={baseMatches.length} active={selectedCategory === "all"} />
            </button>
            {CATEGORIES.map((c) => {
              const n = categoryCounts.get(c) ?? 0;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onCategory(c)}
                  className={`${chip(selectedCategory === c)} ${n === 0 && selectedCategory !== c ? "opacity-60" : ""}`}
                  aria-pressed={selectedCategory === c}
                  aria-label={`${c} (${n})`}
                >
                  {c}
                  <ChipCount n={n} active={selectedCategory === c} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------- Results header ---------- */}
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-muted-foreground" aria-live="polite">
          <span>
            {!loaded
              ? "Loading posts..."
              : filteredPosts.length === 0
              ? "No posts to show"
              : `Showing ${shownPosts.length} of ${filteredPosts.length} ${filteredPosts.length === 1 ? "post" : "posts"}`}
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
        {!loaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card px-6 py-14 text-center space-y-4 animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <SearchX className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {hasFilters ? t("postsPage.noPostsTitle", "No posts match your filters.") : "No open posts yet."}
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {hasFilters
                ? t("postsPage.noPostsDesc", "Try adjusting your filters, or check back soon as neighbors add new posts.")
                : "Be the first to ask for help or share a skill with your neighbours."}
            </p>
            {hasFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                {t("postsPage.resetFilters", "Clear all filters")}
              </Button>
            ) : (
              session && (
                <Button asChild>
                  <Link href="/quick-post">{t("postsPage.quickPost", "Quick Post")}</Link>
                </Button>
              )
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {shownPosts.map((post, i) => {
                const isFirstNew = focusIndexRef.current !== null && i === focusIndexRef.current;
                return (
                  <div
                    key={post.id}
                    ref={isFirstNew ? firstNewCardRef : undefined}
                    tabIndex={isFirstNew ? -1 : undefined}
                    className="animate-fade-up rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 8) * 50}ms` }}
                  >
                    <PostCard post={post} />
                  </div>
                );
              })}
            </div>

            {/* ---------- Pagination ---------- */}
            <div className="flex flex-col items-center gap-3 pt-2 pb-16 md:pb-4">
              {remaining > 0 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={showMore}
                    className="group min-w-[14rem] gap-2 rounded-full font-bold"
                  >
                    See more
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                      {remaining} more
                    </span>
                    <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                  </Button>
                  <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500 ease-smooth"
                      style={{ width: `${(shownPosts.length / filteredPosts.length) * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                filteredPosts.length > PAGE_SIZE && (
                  <p className="text-sm font-semibold text-muted-foreground">You&apos;ve seen all {filteredPosts.length} posts.</p>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
