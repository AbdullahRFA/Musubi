"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { Search, Users, Compass, RefreshCcw, Sparkles, SlidersHorizontal, SearchX } from "lucide-react";
import { useSearch, useSkillOptions, EMPTY_FILTERS } from "@/lib/services/searchService";
import { CATEGORIES, EXCHANGE_METHODS, AVAILABILITY, PLACES } from "@/lib/constants";
import type { SearchFilters } from "@/lib/types";
import { PostCard } from "@/components/posts/PostCard";
import { PersonCard } from "@/components/search/PersonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadMoreControls, CardSkeleton } from "@/components/common/LoadMore";
import { usePostsLoaded } from "@/lib/services/postService";

/** Results revealed per "See more" click. */
const PAGE_SIZE = 6;

function SearchContent() {
  const searchParams = useSearchParams();

  // Search text and filters live in the URL so refresh, Back and sharing work
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const next = { ...EMPTY_FILTERS };
    (Object.keys(EMPTY_FILTERS) as (keyof SearchFilters)[]).forEach((key) => {
      next[key] = searchParams.get(key) || "";
    });
    return next;
  });

  const [activeTab, setActiveTab] = useState<"posts" | "people">(
    searchParams.get("tab") === "people" ? "people" : "posts"
  );
  const autoSwitchedRef = useRef(false);

  const loaded = usePostsLoaded();
  const skillOptions = useSkillOptions();
  const searchResults = useSearch(query, filters);

  // SRS: if no posts match but people do, show people — and switch back to
  // posts once posts match again (only when we switched automatically)
  useEffect(() => {
    if (searchResults.preferPeople && activeTab === "posts") {
      autoSwitchedRef.current = true;
      setActiveTab("people");
    } else if (!searchResults.preferPeople && autoSwitchedRef.current && searchResults.posts.length > 0) {
      autoSwitchedRef.current = false;
      setActiveTab("posts");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults.preferPeople, searchResults.posts.length]);

  // Keep the URL in sync (replace, so typing doesn't flood the history)
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    (Object.keys(filters) as (keyof SearchFilters)[]).forEach((key) => {
      if (filters[key]) params.set(key, filters[key]);
    });
    if (activeTab === "people") params.set("tab", "people");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/search?${qs}` : "/search");
  }, [query, filters, activeTab]);

  // "See more" / "See less": 6 at a time per tab, reset when the search changes
  const [postsShown, setPostsShown] = useState(PAGE_SIZE);
  const [peopleShown, setPeopleShown] = useState(PAGE_SIZE);
  const searchKey = JSON.stringify([query.trim(), filters]);
  useEffect(() => {
    setPostsShown(PAGE_SIZE);
    setPeopleShown(PAGE_SIZE);
  }, [searchKey]);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const collapse = (setter: (n: number) => void) => () => {
    setter(PAGE_SIZE);
    requestAnimationFrame(() => resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const visiblePosts = searchResults.posts.slice(0, postsShown);
  const visiblePeople = searchResults.people.slice(0, peopleShown);

  const handleReset = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    autoSwitchedRef.current = false;
    setActiveTab("posts");
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasAnything = Boolean(query) || activeFilterCount > 0;

  const filterDefs: { key: keyof SearchFilters; label: string; any: string; options: { value: string; label: string }[] }[] = [
    { key: "category", label: "Category", any: "All Categories", options: CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: "location", label: "Location", any: "All Neighborhoods", options: PLACES.map((p) => ({ value: p.name, label: p.name })) },
    { key: "skill", label: "Specific Skill", any: "Any Skill", options: skillOptions.map((sk) => ({ value: sk, label: sk })) },
    { key: "exchangeMethod", label: "Exchange Type", any: "All Exchange Types", options: EXCHANGE_METHODS.map((m) => ({ value: m.value, label: m.label })) },
    { key: "availability", label: "Availability", any: "Any Time", options: AVAILABILITY.map((a) => ({ value: a, label: a })) },
    {
      key: "userGroup",
      label: "Generation",
      any: "All Generations",
      options: [
        { value: "og", label: "Older Generation (O.G.)" },
        { value: "yg", label: "Younger Generation (Y.G.)" },
      ],
    },
  ];

  const tabs = [
    { id: "posts" as const, label: "Posts", icon: Compass, count: searchResults.posts.length, active: "border-primary text-primary" },
    { id: "people" as const, label: "People", icon: Users, count: searchResults.people.length, active: "border-secondary text-secondary" },
  ];

  return (
    <div className="pb-12 sm:pb-16">
      {/* ---------- Hero search ---------- */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card to-background">
        <div
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(63,79,58,0.12),transparent_45%),radial-gradient(circle_at_0%_100%,rgba(154,52,18,0.08),transparent_40%)]"
          aria-hidden="true"
        />
        <div className="relative page-container py-8 sm:py-12 space-y-5">
          <div className="space-y-2 max-w-2xl animate-fade-up">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Search Posts & People</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Find matching requests and community members who have the skills or energy you need
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3 animate-fade-up [animation-delay:100ms]">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search by skill, topic, location, or name..."
                aria-label="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 sm:pl-14 text-base sm:text-lg min-h-[52px] sm:min-h-[56px] rounded-xl shadow-soft"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="search-filters"
              className="lg:hidden relative min-h-[52px] sm:min-h-[56px] rounded-xl px-4 gap-2"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="hidden min-[420px]:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground ring-2 ring-background">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Filters: collapsible on mobile/tablet, always open on desktop */}
          <div
            id="search-filters"
            className={`${filtersOpen ? "grid animate-in fade-in slide-in-from-top-2" : "hidden"} lg:grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 rounded-2xl border-2 border-border bg-card p-4 shadow-sm`}
          >
            {filterDefs.map(({ key, label, any, options }) => (
              <div key={key} className="space-y-1">
                <label htmlFor={`filter-${key}`} className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {label}
                </label>
                <select
                  id={`filter-${key}`}
                  value={filters[key]}
                  onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                  className={`w-full min-h-[44px] rounded-lg border-2 bg-background px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 focus:outline-none focus:border-primary ${
                    filters[key] ? "border-primary/50 bg-primary/5" : "border-border"
                  }`}
                >
                  <option value="">{any}</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {hasAnything && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground hover:text-primary">
                <RefreshCcw className="h-4 w-4" />
                Reset all search parameters
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="page-container pt-6 sm:pt-8 space-y-6">
        {searchResults.preferPeople && (
          <div className="rounded-2xl border-2 border-secondary/40 bg-secondary/10 p-4 flex items-start gap-3 animate-in fade-in">
            <Sparkles className="h-6 w-6 text-secondary shrink-0" />
            <p className="text-sm">
              <strong className="text-foreground font-bold">No active posts matched your exact search,</strong>{" "}
              <span className="text-muted-foreground">
                so we found neighbors whose skills and expertise match what you need! You can connect with them directly.
              </span>
            </p>
          </div>
        )}

        {/* ---------- Tabs ---------- */}
        <div role="tablist" aria-label="Search results" className="flex border-b-2 border-border gap-6">
          {tabs.map(({ id, label, icon: Icon, count, active }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={selected}
                aria-controls={`panel-${id}`}
                onClick={() => {
                  autoSwitchedRef.current = false;
                  setActiveTab(id);
                }}
                className={`flex items-center gap-2 pb-3 font-bold text-base sm:text-lg border-b-4 -mb-[2px] transition-colors duration-200 ${
                  selected ? active : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
                <span
                  className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums"
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ---------- Panels ---------- */}
        <div
          ref={resultsTopRef}
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="scroll-mt-24 space-y-5"
        >
          {!loaded ? (
            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : activeTab === "posts" ? (
            searchResults.posts.length === 0 ? (
              <EmptyState
                title={hasAnything ? "No open posts match your search." : "No open posts right now."}
                hint={hasAnything ? "Try a different word, remove a filter, or look for people who can help." : undefined}
                action={
                  searchResults.people.length > 0 ? (
                    <Button
                      onClick={() => {
                        autoSwitchedRef.current = false;
                        setActiveTab("people");
                      }}
                    >
                      View {searchResults.people.length} matching {searchResults.people.length === 1 ? "person" : "people"}
                    </Button>
                  ) : hasAnything ? (
                    <Button variant="outline" onClick={handleReset}>
                      Clear search filters
                    </Button>
                  ) : null
                }
              />
            ) : (
              <>
                <ResultCount shown={visiblePosts.length} total={searchResults.posts.length} noun="open post" />
                <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visiblePosts.map((post, i) => (
                    <div key={post.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 8) * 50}ms` }}>
                      <PostCard post={post} />
                    </div>
                  ))}
                </div>
                <LoadMoreControls
                  shown={visiblePosts.length}
                  total={searchResults.posts.length}
                  pageSize={PAGE_SIZE}
                  onMore={() => setPostsShown((n) => n + PAGE_SIZE)}
                  onLess={collapse(setPostsShown)}
                />
              </>
            )
          ) : searchResults.people.length === 0 ? (
            <EmptyState
              title="No people match your search."
              hint="Try a broader word, or clear the filters to browse everyone."
              action={
                hasAnything ? (
                  <Button variant="outline" onClick={handleReset}>
                    Clear search filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <ResultCount shown={visiblePeople.length} total={searchResults.people.length} noun="person" plural="people" />
              <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visiblePeople.map((person, i) => (
                  <div key={person.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 8) * 50}ms` }}>
                    <PersonCard person={person} />
                  </div>
                ))}
              </div>
              <LoadMoreControls
                shown={visiblePeople.length}
                total={searchResults.people.length}
                pageSize={PAGE_SIZE}
                onMore={() => setPeopleShown((n) => n + PAGE_SIZE)}
                onLess={collapse(setPeopleShown)}
                noun="people"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCount({ shown, total, noun, plural }: { shown: number; total: number; noun: string; plural?: string }) {
  return (
    <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">
      Showing {shown} of {total} {total === 1 ? noun : plural ?? `${noun}s`}
    </p>
  );
}

function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card px-6 py-14 text-center space-y-4 animate-fade-in">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold text-foreground">{title}</p>
      {hint && <p className="mx-auto max-w-md text-sm text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center gap-3 p-8 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading search...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
