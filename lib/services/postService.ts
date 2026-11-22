"use client";

import { useMemo } from "react";
import { placeByName } from "@/lib/constants";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Post, PostStatus } from "@/lib/types";
import { createId } from "@/lib/utils";
import { hiddenFrom, requireUser, ServiceError, userById } from "@/lib/services/shared";
import { pushNotification } from "@/lib/services/notificationService";

export type PostInput = Omit<Post, "id" | "authorId" | "lat" | "lng" | "status" | "createdAt" | "updatedAt">;

function withPlace(input: PostInput, authorId: string, id: string, createdAt: string): Post {
  const place = placeByName(input.location);
  return {
    ...input,
    id,
    authorId,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    amount: input.exchangeMethod === "payment" ? input.amount : null,
    status: "open",
    createdAt,
    updatedAt: createdAt,
  };
}

export function usePosts() {
  const posts = useAppStore((state) => state.posts);
  const blocks = useAppStore((state) => state.blocks);
  const viewerId = useAppStore((state) => state.sessionUserId);
  return useMemo(
    () =>
      posts
        .filter((post) => post.status !== "closed")
        .filter((post) => !hiddenFrom(blocks, viewerId, post.authorId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [blocks, posts, viewerId],
  );
}

export function usePost(id: string) {
  const posts = useAppStore((state) => state.posts);
  const blocks = useAppStore((state) => state.blocks);
  const viewerId = useAppStore((state) => state.sessionUserId);
  return useMemo(() => {
    const post = posts.find((item) => item.id === id) ?? null;
    if (!post) return null;
    if (hiddenFrom(blocks, viewerId, post.authorId)) return null;
    return post;
  }, [blocks, id, posts, viewerId]);
}

export function useMyPosts() {
  const posts = useAppStore((state) => state.posts);
  const viewerId = useAppStore((state) => state.sessionUserId);
  return useMemo(
    () =>
      posts
        .filter((post) => post.authorId === viewerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [posts, viewerId],
  );
}

export async function createPost(input: PostInput) {
  const me = requireUser();
  const now = new Date().toISOString();
  const post = withPlace(input, me.id, createId("p"), now);
  useAppStore.setState((state) => ({ posts: [post, ...state.posts] }));
  return post;
}

export async function updatePost(id: string, input: PostInput) {
  const me = requireUser();
  const current = useAppStore.getState().posts.find((post) => post.id === id);
  if (!current) throw new ServiceError("We could not find that post.");
  if (current.authorId !== me.id) throw new ServiceError("You can only edit your own posts.");
  if (current.status !== "open") {
    throw new ServiceError("This post is no longer open, so the details are locked.");
  }
  const place = placeByName(input.location);
  const next: Post = {
    ...current,
    ...input,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    amount: input.exchangeMethod === "payment" ? input.amount : null,
    updatedAt: new Date().toISOString(),
  };
  useAppStore.setState((state) => ({
    posts: state.posts.map((post) => (post.id === id ? next : post)),
  }));
  return next;
}

export async function deletePost(id: string) {
  const me = requireUser();
  const current = useAppStore.getState().posts.find((post) => post.id === id);
  if (!current) throw new ServiceError("We could not find that post.");
  if (current.authorId !== me.id) throw new ServiceError("You can only delete your own posts.");
  if (current.status === "in_progress" || current.status === "completed") {
    throw new ServiceError("This post is tied to an activity, so it cannot be deleted.");
  }
  useAppStore.setState((state) => ({
    posts: state.posts.filter((post) => post.id !== id),
    requests: state.requests.filter((request) => request.postId !== id),
  }));
}

export async function closePost(id: string) {
  const me = requireUser();
  const state = useAppStore.getState();
  const current = state.posts.find((post) => post.id === id);
  if (!current) throw new ServiceError("We could not find that post.");
  if (current.authorId !== me.id) throw new ServiceError("You can only close your own posts.");
  if (current.status === "completed") throw new ServiceError("This activity is already completed.");
  if (current.status === "in_progress") {
    throw new ServiceError("Someone is already accepted. Finish the activity together, or leave the post open.");
  }
  const now = new Date().toISOString();
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
