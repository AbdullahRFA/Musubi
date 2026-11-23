"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Search, Users, Compass, Filter, RefreshCcw, Sparkles } from "lucide-react";
import { useSearch, useSkillOptions, EMPTY_FILTERS } from "@/lib/services/searchService";
import { CATEGORIES, EXCHANGE_METHODS, AVAILABILITY, PLACES } from "@/lib/constants";
import type { SearchFilters } from "@/lib/types";
import { PostCard } from "@/components/posts/PostCard";
import { PersonCard } from "@/components/search/PersonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    ...EMPTY_FILTERS,
    category: initialCategory,
  });

  const [activeTab, setActiveTab] = useState<"posts" | "people">("posts");

  const skillOptions = useSkillOptions();
  const searchResults = useSearch(query, filters);

  // If no posts match but people do, auto-switch to people tab per SRS algorithm
  useEffect(() => {
    if (searchResults.preferPeople) {
      setActiveTab("people");
    }
  }, [searchResults.preferPeople]);

  const handleReset = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    setActiveTab("posts");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="border-b-2 border-border pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold text-foreground">Search Posts & People</h1>
        <p className="text-base text-muted-foreground">
          Find matching requests and community members who have the skills or energy you need
        </p>
      </div>

      {/* Search Bar & Primary Input */}
      <div className="rounded-xl border-2 border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-6 w-6 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by skill, service, topic, location, or neighbor's name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-14 text-lg h-14"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-2 border-t border-border/70 text-xs">
          {/* Category */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full rounded-md border border-border bg-background p-2 font-medium text-foreground text-xs"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase">Location</label>
            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full rounded-md border border-border bg-background p-2 font-medium text-foreground text-xs"
            >
              <option value="">All Neighborhoods</option>
              {PLACES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Skill / Expertise */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase">Specific Skill</label>
            <select
              value={filters.skill}
              onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
              className="w-full rounded-md border border-border bg-background p-2 font-medium text-foreground text-xs"
            >
              <option value="">Any Skill</option>
              {skillOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Exchange Method */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase">Exchange Type</label>
            <select
              value={filters.exchangeMethod}
              onChange={(e) => setFilters({ ...filters, exchangeMethod: e.target.value })}
              className="w-full rounded-md border border-border bg-background p-2 font-medium text-foreground text-xs"
            >
              <option value="">All Exchange Types</option>
              {EXCHANGE_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase">Availability</label>
            <select
              value={filters.availability}
              onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
              className="w-full rounded-md border border-border bg-background p-2 font-medium text-foreground text-xs"
            >
              <option value="">Any Time</option>
              {AVAILABILITY.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* User Group */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase">Generation</label>
            <select
              value={filters.userGroup}
              onChange={(e) => setFilters({ ...filters, userGroup: e.target.value })}
              className="w-full rounded-md border border-border bg-background p-2 font-medium text-foreground text-xs"
            >
              <option value="">All Generations</option>
              <option value="og">Older Generation (O.G.)</option>
              <option value="yg">Younger Generation (Y.G.)</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(query || Object.values(filters).some(Boolean)) && (
          <div className="flex justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>Reset all search parameters</span>
            </Button>
          </div>
        )}
      </div>

      {/* Prefer People Banner (SRS Algorithm requirement) */}
      {searchResults.preferPeople && (
        <div className="rounded-lg border-2 border-secondary bg-secondary/10 p-4 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-secondary flex-shrink-0" />
          <div className="text-sm">
            <strong className="text-foreground font-bold">No active posts matched your exact search,</strong>{" "}
            <span className="text-muted-foreground">
              so we found neighbors whose skills and expertise match what you need! You can connect with them directly.
            </span>
          </div>
        </div>
      )}

      {/* Result Tabs */}
      <div className="flex border-b-2 border-border gap-4 sm:gap-6 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-1.5 pb-2.5 font-bold text-sm sm:text-lg border-b-4 transition-all -mb-[2px] shrink-0 ${
            activeTab === "posts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Posts ({searchResults.posts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("people")}
          className={`flex items-center gap-1.5 pb-2.5 font-bold text-sm sm:text-lg border-b-4 transition-all -mb-[2px] shrink-0 ${
            activeTab === "people"
              ? "border-secondary text-secondary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>People ({searchResults.people.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "posts" ? (
        searchResults.posts.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border p-12 text-center space-y-3">
            <p className="text-lg font-semibold text-foreground">No posts found matching your search.</p>
            {searchResults.people.length > 0 && (
              <Button variant="default" onClick={() => setActiveTab("people")}>
                View {searchResults.people.length} matching people instead
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      ) : searchResults.people.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">No people found matching your search.</p>
          <Button variant="outline" onClick={handleReset}>
            Clear search filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
