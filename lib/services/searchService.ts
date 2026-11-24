"use client";

import { useMemo, useEffect } from "react";
import { availabilityMatches } from "@/lib/availability";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Block, Post, Profile, SearchFilters, SearchResult } from "@/lib/types";
import { hiddenFrom } from "@/lib/services/shared";
import { fetchPosts } from "@/lib/services/postService";
import { fetchProfiles } from "@/lib/services/profileService";

export const EMPTY_FILTERS: SearchFilters = {
  category: "",
  location: "",
  skill: "",
  exchangeMethod: "",
  availability: "",
  userGroup: "",
};

function has(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

function postScore(post: Post, author: Profile, query: string) {
  if (!query) return 1;
  let score = 0;
  if (has(post.title, query)) score += 6;
  if (has(post.skill, query)) score += 5;
  if (has(post.category, query)) score += 3;
  if (has(author.fullName, query)) score += 3;
  if (has(post.location, query)) score += 2;
  if (has(post.description, query)) score += 1;
  return score;
}

function personScore(person: Profile, query: string) {
  if (!query) return 1;
  let score = 0;
  if (person.skills.some((skill) => has(skill, query))) score += 6;
  if (person.servicesOffered.some((skill) => has(skill, query))) score += 5;
  if (has(person.fullName, query)) score += 4;
  // Note: servicesNeeded is intentionally NOT scored — someone who *needs*
  // smartphone help is not a match for "who can help me with my smartphone".
  if (has(person.location, query)) score += 2;
  if (person.interests.some((skill) => has(skill, query))) score += 1;
  if (has(person.bio, query)) score += 1;
  return score;
}

/**
 * 1. Find posts matching the keyword.
 * 2. Apply filters.
 * 3. Rank matching posts first.
 * 4. If no relevant posts, search profiles for expertise and skills.
 * 5. Those people are returned for the "People who may help" section.
 * People matches are also returned when posts exist, so the People tab stays useful.
 * Category and exchange filters apply to posts only.
 */
export function searchContent(
  posts: Post[],
  users: Profile[],
  blocks: Block[],
  viewerId: string | null,
  query: string,
  filters: SearchFilters,
): SearchResult {
  const q = query.trim().toLowerCase();
  const authors = new Map(users.map((user) => [user.id, user]));

  // Only open posts can be responded to; in-progress / completed / closed
  // posts are hidden from search (they live in the author's My Activity).
  const matchedPosts = posts
    .filter((post) => post.status === "open")
    .map((post) => ({ post, author: authors.get(post.authorId) ?? null }))
    .filter((item): item is { post: Post; author: Profile } => {
      if (!item.author) return false;
      if (hiddenFrom(blocks, viewerId, item.author.id)) return false;
      if (filters.category && item.post.category !== filters.category) return false;
      if (filters.location && item.post.location !== filters.location) return false;
      if (filters.skill && !has(item.post.skill, filters.skill.toLowerCase())) return false;
      if (filters.exchangeMethod && item.post.exchangeMethod !== filters.exchangeMethod) return false;
      if (filters.availability && !availabilityMatches(item.post.availability, filters.availability)) return false;
      if (filters.userGroup && item.author.userGroup !== filters.userGroup) return false;
      if (!q) return true;
      return postScore(item.post, item.author, q) > 0;
    })
    .sort((a, b) => postScore(b.post, b.author, q) - postScore(a.post, a.author, q) || b.post.createdAt.localeCompare(a.post.createdAt))
    .map((item) => item.post);

  const postOnlyFilters = Boolean(filters.category || filters.exchangeMethod);
  const people =
    postOnlyFilters
      ? []
      : users
          .filter((person) => person.id !== viewerId)
          .filter((person) => !hiddenFrom(blocks, viewerId, person.id))
          .filter((person) => {
            if (filters.location) {
              const areas = person.neighborhoods?.length ? person.neighborhoods : [person.location];
              if (!areas.includes(filters.location)) return false;
            }
            if (filters.availability && !availabilityMatches(person.availability, filters.availability)) return false;
            if (filters.userGroup && person.userGroup !== filters.userGroup) return false;
            if (filters.skill) {
              const blob = [...person.skills, ...person.servicesOffered].join(" ").toLowerCase();
              if (!blob.includes(filters.skill.toLowerCase())) return false;
            }
            // No keyword: browse everyone who matches the filters
            if (!q) return true;
            return personScore(person, q) > 0;
          })
          .sort((a, b) => personScore(b, q) - personScore(a, q) || a.fullName.localeCompare(b.fullName));

  // Suggest people only when the member actually searched or filtered
  const searched = Boolean(q || Object.values(filters).some(Boolean));
  const preferPeople = searched && matchedPosts.length === 0 && people.length > 0;
  return { posts: matchedPosts, people, preferPeople };
}

export function useSearch(query: string, filters: SearchFilters) {
  const posts = useAppStore((state) => state.posts);
  const users = useAppStore((state) => state.users);
  const blocks = useAppStore((state) => state.blocks);
  const viewerId = useAppStore((state) => state.sessionUserId);

  useEffect(() => {
    fetchPosts();
    fetchProfiles();
  }, []);

  return useMemo(
    () => searchContent(posts, users, blocks, viewerId, query, filters),
    [blocks, filters, posts, query, users, viewerId],
  );
}

export function useSkillOptions() {
  const users = useAppStore((state) => state.users);
  const posts = useAppStore((state) => state.posts);
  return useMemo(() => {
    const names = new Set<string>();
    users.forEach((user) => {
      user.skills.forEach((skill) => names.add(skill));
      user.servicesOffered.forEach((skill) => names.add(skill));
    });
    posts.forEach((post) => names.add(post.skill));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [posts, users]);
}
