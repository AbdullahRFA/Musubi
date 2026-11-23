"use client";

import { useMemo, useState, useEffect } from "react";
import { placeByName } from "@/lib/constants";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Post, PostStatus } from "@/lib/types";
import { hiddenFrom, requireUser, ServiceError, userById } from "@/lib/services/shared";
import { pushNotification } from "@/lib/services/notificationService";
import { createClient } from "@/lib/supabase/client";

export type PostInput = Omit<Post, "id" | "authorId" | "lat" | "lng" | "status" | "createdAt" | "updatedAt">;

/**
 * Maps Supabase snake_case posts table row to the domain Post type
 */
export function rowToPost(row: any): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    description: row.description,
    category: row.category,
    skill: row.skill,
    location: row.location,
    lat: row.lat !== null && row.lat !== undefined ? Number(row.lat) : null,
    lng: row.lng !== null && row.lng !== undefined ? Number(row.lng) : null,
    availability: row.availability,
    postType: row.post_type,
    exchangeMethod: row.exchange_method,
    amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : null,
    status: row.status,
    templateId: row.template_id ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Maps domain Post to Supabase snake_case columns
 */
export function postToRow(post: Partial<Post>): Record<string, any> {
  const row: Record<string, any> = {};
  if (post.id !== undefined) row.id = post.id;
  if (post.authorId !== undefined) row.author_id = post.authorId;
  if (post.title !== undefined) row.title = post.title;
  if (post.description !== undefined) row.description = post.description;
  if (post.category !== undefined) row.category = post.category;
  if (post.skill !== undefined) row.skill = post.skill;
  if (post.location !== undefined) row.location = post.location;
  if (post.lat !== undefined) row.lat = post.lat;
  if (post.lng !== undefined) row.lng = post.lng;
  if (post.availability !== undefined) row.availability = post.availability;
  if (post.postType !== undefined) row.post_type = post.postType;
  if (post.exchangeMethod !== undefined) row.exchange_method = post.exchangeMethod;
  if (post.amount !== undefined) row.amount = post.amount;
  if (post.status !== undefined) row.status = post.status;
  if (post.templateId !== undefined) row.template_id = post.templateId;
  row.updated_at = new Date().toISOString();
  return row;
}

/**
 * Fetch a single post by ID directly from Supabase
 */
export async function getPostById(id: string): Promise<Post | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  const post = rowToPost(data);

  useAppStore.setState((state) => ({
    posts: state.posts.some((p) => p.id === post.id)
      ? state.posts.map((p) => (p.id === post.id ? post : p))
      : [post, ...state.posts],
  }));

  return post;
}

/**
 * Fetch all posts from Supabase ordered by creation date
 */
export async function fetchPosts(): Promise<Post[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  const posts = data.map(rowToPost);

  useAppStore.setState((state) => {
    const remoteIds = new Set(posts.map((p) => p.id));
    // Keep local posts that aren't on server yet
    const kept = state.posts.filter((p) => !remoteIds.has(p.id));
    return { posts: [...posts, ...kept] };
  });

  return posts;
}

/**
 * Hook to retrieve all open, visible posts
 */
export function usePosts(): Post[] {
  const posts = useAppStore((state) => state.posts);
  const blocks = useAppStore((state) => state.blocks);
  const viewerId = useAppStore((state) => state.sessionUserId);

  useEffect(() => {
    fetchPosts();
  }, []);

  return useMemo(
    () =>
      posts
        .filter((post) => post.status !== "closed")
        .filter((post) => !hiddenFrom(blocks, viewerId, post.authorId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [blocks, posts, viewerId],
  );
}

/**
 * Hook to retrieve a single post by ID, fetching from Supabase if not in cache
 */
export function usePost(id: string): Post | null {
  const posts = useAppStore((state) => state.posts);
  const blocks = useAppStore((state) => state.blocks);
  const viewerId = useAppStore((state) => state.sessionUserId);
  const [fetchedPost, setFetchedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!id) return;
    const existing = posts.find((item) => item.id === id);
    if (!existing) {
      getPostById(id).then((post) => {
        if (post) setFetchedPost(post);
      });
    }
  }, [id, posts]);

  return useMemo(() => {
    const post = posts.find((item) => item.id === id) ?? fetchedPost;
    if (!post) return null;
    if (hiddenFrom(blocks, viewerId, post.authorId)) return null;
    return post;
  }, [blocks, fetchedPost, id, posts, viewerId]);
}

/**
 * Hook to retrieve the authenticated user's own posts
 */
export function useMyPosts(): Post[] {
  const posts = useAppStore((state) => state.posts);
  const viewerId = useAppStore((state) => state.sessionUserId);

  useEffect(() => {
    fetchPosts();
  }, []);

  return useMemo(
    () =>
      posts
        .filter((post) => post.authorId === viewerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [posts, viewerId],
  );
}

/**
 * Create a new offer or request post in Supabase PostgreSQL
 */
export async function createPost(input: PostInput): Promise<Post> {
  const me = requireUser();
  const place = placeByName(input.location);
  const supabase = createClient();

  const newPostData = {
    author_id: me.id,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    skill: input.skill.trim(),
    location: input.location,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    availability: input.availability,
    post_type: input.postType,
    exchange_method: input.exchangeMethod,
    amount: input.exchangeMethod === "paid" ? input.amount : null,
    status: "open",
    template_id: input.templateId ?? null,
  };

  let { data, error } = await supabase
    .from("posts")
    .insert(newPostData)
    .select()
    .single();

  // If the template table hasn't been seeded in Supabase yet, retry with template_id: null
  // so creating quick posts NEVER fails on a foreign key constraint.
  if (error && error.message.includes("posts_template_id_fkey")) {
    const fallbackData = { ...newPostData, template_id: null };
    const retry = await supabase
      .from("posts")
      .insert(fallbackData)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    console.error("Failed to insert post in Supabase:", error);
    throw new ServiceError(error?.message || "Failed to create post.");
  }

  const post = rowToPost(data);
  useAppStore.setState((state) => ({ posts: [post, ...state.posts] }));
  return post;
}

/**
 * Update an existing post in Supabase PostgreSQL
 */
export async function updatePost(id: string, input: PostInput): Promise<Post> {
  const me = requireUser();
  const state = useAppStore.getState();
  const current = state.posts.find((post) => post.id === id);

  if (current && current.authorId !== me.id) {
    throw new ServiceError("You can only edit your own posts.");
  }
  if (current && current.status !== "open") {
    throw new ServiceError("This post is no longer open, so the details are locked.");
  }

  const place = placeByName(input.location);
  const supabase = createClient();

  const updateData = {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    skill: input.skill.trim(),
    location: input.location,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    availability: input.availability,
    post_type: input.postType,
    exchange_method: input.exchangeMethod,
    amount: input.exchangeMethod === "paid" ? input.amount : null,
    template_id: input.templateId ?? null,
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabase
    .from("posts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error && error.message.includes("posts_template_id_fkey")) {
    const fallbackData = { ...updateData, template_id: null };
    const retry = await supabase
      .from("posts")
      .update(fallbackData)
      .eq("id", id)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    throw new ServiceError(error?.message || "Failed to update post.");
  }

  const next = rowToPost(data);
  useAppStore.setState((currentState) => ({
    posts: currentState.posts.map((post) => (post.id === id ? next : post)),
  }));
  return next;
}

/**
 * Delete a post from Supabase PostgreSQL
 */
export async function deletePost(id: string): Promise<void> {
  const me = requireUser();
  const current = useAppStore.getState().posts.find((post) => post.id === id);

  if (current && current.authorId !== me.id) {
    throw new ServiceError("You can only delete your own posts.");
  }
  if (current && (current.status === "in_progress" || current.status === "completed")) {
    throw new ServiceError("This post is tied to an activity, so it cannot be deleted.");
  }

  const supabase = createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    throw new ServiceError(error.message || "Failed to delete post.");
  }

  useAppStore.setState((state) => ({
    posts: state.posts.filter((post) => post.id !== id),
    requests: state.requests.filter((request) => request.postId !== id),
  }));
}

/**
 * Close a post and decline any remaining pending service requests
 */
export async function closePost(id: string): Promise<void> {
  const me = requireUser();
  const state = useAppStore.getState();
  const current = state.posts.find((post) => post.id === id);

  if (current && current.authorId !== me.id) {
    throw new ServiceError("You can only close your own posts.");
  }
  if (current && current.status === "completed") {
    throw new ServiceError("This activity is already completed.");
  }
  if (current && current.status === "in_progress") {
    throw new ServiceError("Someone is already accepted. Finish the activity together, or leave the post open.");
  }

  const supabase = createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("posts")
    .update({ status: "closed", updated_at: now })
    .eq("id", id);

  if (error) {
    throw new ServiceError(error.message || "Failed to close post.");
  }

  // Reject pending service requests on that post
  await supabase
    .from("service_requests")
    .update({ status: "rejected", updated_at: now })
    .eq("post_id", id)
    .eq("status", "pending");

  const pending = state.requests.filter((request) => request.postId === id && request.status === "pending");

  useAppStore.setState((currentState) => ({
    posts: currentState.posts.map((post) =>
      post.id === id ? { ...post, status: "closed" as PostStatus, updatedAt: now } : post,
    ),
    requests: currentState.requests.map((request) =>
      request.postId === id && request.status === "pending"
        ? { ...request, status: "rejected" as const, updatedAt: now }
        : request,
    ),
  }));

  pending.forEach((request) => {
    const owner = userById(useAppStore.getState().users, me.id);
    pushNotification({
      userId: request.requesterId,
      type: "request_rejected",
      title: "Request declined",
      body: `${owner?.fullName ?? "The post owner"} closed the post.`,
      href: "/requests",
    });
  });
}
