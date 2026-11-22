"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Activity, ServiceRequest } from "@/lib/types";
import { createId } from "@/lib/utils";
import { pushNotification } from "@/lib/services/notificationService";
import { hiddenFrom, requireUser, ServiceError, userById } from "@/lib/services/shared";

function conversationHref(requestId: string) {
  const conversation = useAppStore.getState().conversations.find((item) => item.requestId === requestId);
  return conversation ? `/chat/${conversation.id}` : "/requests";
}

export function useRequests() {
  return useAppStore((state) => state.requests);
}

export function useMyRequests() {
  const requests = useAppStore((state) => state.requests);
  const blocks = useAppStore((state) => state.blocks);
  const userId = useAppStore((state) => state.sessionUserId);
  return useMemo(() => {
    const visible = requests.filter((request) => {
      if (!userId) return false;
      if (request.requesterId !== userId && request.ownerId !== userId) return false;
      const otherId = request.requesterId === userId ? request.ownerId : request.requesterId;
      return !hiddenFrom(blocks, userId, otherId);
    });
    return {
      incoming: visible
        .filter((request) => request.ownerId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      outgoing: visible
        .filter((request) => request.requesterId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  }, [blocks, requests, userId]);
}

export function useRequestsForPost(postId: string) {
  const requests = useAppStore((state) => state.requests);
  const userId = useAppStore((state) => state.sessionUserId);
  return useMemo(
    () =>
      requests
        .filter((request) => request.postId === postId)
        .filter((request) => {
          if (!userId) return false;
          const otherId = request.requesterId === userId ? request.ownerId : request.requesterId;
          return !hiddenFrom(useAppStore.getState().blocks, userId, otherId);
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [postId, requests, userId],
  );
}

export function useRequestBetween(otherUserId: string) {
  const requests = useAppStore((state) => state.requests);
  const userId = useAppStore((state) => state.sessionUserId);
  return useMemo(() => {
    if (!userId) return null;
    return (
      requests.find(
        (request) =>
          request.direct &&
          request.status !== "rejected" &&
          request.status !== "cancelled" &&
          ((request.requesterId === userId && request.ownerId === otherUserId) ||
            (request.ownerId === userId && request.requesterId === otherUserId)),
      ) ?? null
    );
  }, [otherUserId, requests, userId]);
}

export async function respondToPost(postId: string, message: string) {
  const me = requireUser();
  const state = useAppStore.getState();
  const post = state.posts.find((item) => item.id === postId);
  if (!post) throw new ServiceError("We could not find that post.");
  if (hiddenFrom(state.blocks, me.id, post.authorId)) throw new ServiceError("This post is not available.");
  if (post.authorId === me.id) throw new ServiceError("You cannot respond to your own post.");
  if (post.status !== "open") throw new ServiceError("This post is not open for new responses.");
  const duplicate = state.requests.some(
    (request) => request.postId === postId && request.requesterId === me.id && request.status !== "cancelled",
  );
  if (duplicate) throw new ServiceError("You already responded to this post.");
  const now = new Date().toISOString();
  const request: ServiceRequest = {
    id: createId("r"),
    postId,
    requesterId: me.id,
    ownerId: post.authorId,
    message: message.trim(),
    status: "pending",
    direct: false,
    requesterDone: false,
    ownerDone: false,
    createdAt: now,
    updatedAt: now,
  };
  useAppStore.setState((current) => ({ requests: [request, ...current.requests] }));
  pushNotification({
    userId: post.authorId,
    type: "request_new",
    title: "New service request",
    body: `${me.fullName} responded to “${post.title}”.`,
    href: "/requests",
  });
  return request;
}

export async function createDirectRequest(targetUserId: string, message: string) {
  const me = requireUser();
  const state = useAppStore.getState();
  if (targetUserId === me.id) throw new ServiceError("You cannot send a request to yourself.");
  const target = userById(state.users, targetUserId);
  if (!target || hiddenFrom(state.blocks, me.id, targetUserId)) {
    throw new ServiceError("That person is not available.");
  }
  const existing = state.requests.find(
    (request) =>
      request.direct &&
      request.status === "pending" &&
      request.requesterId === me.id &&
      request.ownerId === targetUserId,
  );
  if (existing) throw new ServiceError("You already have a pending request with this person.");
  const now = new Date().toISOString();
  const request: ServiceRequest = {
    id: createId("r"),
    postId: null,
    requesterId: me.id,
    ownerId: targetUserId,
    message: message.trim() || "I would like to connect and exchange a skill or a service.",
    status: "pending",
    direct: true,
    requesterDone: false,
    ownerDone: false,
    createdAt: now,
    updatedAt: now,
  };
  useAppStore.setState((current) => ({ requests: [request, ...current.requests] }));
  pushNotification({
    userId: targetUserId,
    type: "request_new",
    title: "New contact request",
    body: `${me.fullName} sent you a service request.`,
    href: "/requests",
  });
  return request;
}

export async function acceptRequest(requestId: string) {
  const me = requireUser();
  const state = useAppStore.getState();
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) throw new ServiceError("We could not find that request.");
  if (request.ownerId !== me.id) {
    throw new ServiceError("Only the person who received this request can accept it.");
  }
  if (request.status !== "pending") throw new ServiceError("This request is no longer pending.");
  if (
    request.postId &&
    state.requests.some((item) => item.postId === request.postId && item.status === "accepted")
  ) {
    throw new ServiceError("Another request is already accepted for this post.");
  }
  const now = new Date().toISOString();
  const conversation = {
    id: createId("c"),
    requestId: request.id,
    participantIds: [request.requesterId, request.ownerId] as [string, string],
    createdAt: now,
  };
  const declined = state.requests.filter(
    (item) => item.postId && item.postId === request.postId && item.id !== request.id && item.status === "pending",
  );
  useAppStore.setState((current) => ({
    requests: current.requests.map((item) => {
      if (item.id === request.id) return { ...item, status: "accepted" as const, updatedAt: now };
      if (item.postId && item.postId === request.postId && item.status === "pending") {
        return { ...item, status: "rejected" as const, updatedAt: now };
      }
      return item;
    }),
    posts: current.posts.map((post) =>
      post.id === request.postId ? { ...post, status: "in_progress" as const, updatedAt: now } : post,
    ),
    conversations: [conversation, ...current.conversations],
  }));
  const post = request.postId ? state.posts.find((item) => item.id === request.postId) : null;
  pushNotification({
    userId: request.requesterId,
    type: "request_accepted",
    title: "Request accepted",
    body: `${me.fullName} accepted your request${post ? ` for “${post.title}”` : ""}. Chat is now open.`,
    href: `/chat/${conversation.id}`,
  });
  declined.forEach((item) => {
    pushNotification({
      userId: item.requesterId,
      type: "request_rejected",
      title: "Request declined",
      body: "Another person was accepted for this post.",
      href: "/requests",
    });
  });
  return conversation;
}

export async function rejectRequest(requestId: string) {
  const me = requireUser();
  const request = useAppStore.getState().requests.find((item) => item.id === requestId);
  if (!request) throw new ServiceError("We could not find that request.");
  if (request.ownerId !== me.id) {
    throw new ServiceError("Only the person who received this request can decline it.");
  }
  if (request.status !== "pending") throw new ServiceError("This request is no longer pending.");
  const now = new Date().toISOString();
  useAppStore.setState((state) => ({
    requests: state.requests.map((item) =>
      item.id === requestId ? { ...item, status: "rejected" as const, updatedAt: now } : item,
    ),
  }));
  pushNotification({
    userId: request.requesterId,
    type: "request_rejected",
    title: "Request declined",
    body: `${me.fullName} declined your request.`,
    href: "/requests",
  });
}

export async function cancelRequest(requestId: string) {
  const me = requireUser();
  const request = useAppStore.getState().requests.find((item) => item.id === requestId);
  if (!request) throw new ServiceError("We could not find that request.");
  if (request.requesterId !== me.id) throw new ServiceError("Only the person who sent this request can cancel it.");
  if (request.status !== "pending") throw new ServiceError("You can cancel a request only while it is pending.");
  const now = new Date().toISOString();
  useAppStore.setState((state) => ({
    requests: state.requests.map((item) =>
      item.id === requestId ? { ...item, status: "cancelled" as const, updatedAt: now } : item,
    ),
  }));
  pushNotification({
    userId: request.ownerId,
    type: "activity",
    title: "Request cancelled",
    body: `${me.fullName} cancelled a pending request.`,
    href: "/requests",
  });
}

export async function confirmCompletion(requestId: string) {
  const me = requireUser();
  const state = useAppStore.getState();
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) throw new ServiceError("We could not find that request.");
  const isRequester = request.requesterId === me.id;
  const isOwner = request.ownerId === me.id;
  if (!isRequester && !isOwner) {
    throw new ServiceError("Only the people in this activity can mark it completed.");
  }
  if (request.status !== "accepted") {
    throw new ServiceError("You can mark an activity completed after it is accepted.");
  }
  if ((isRequester && request.requesterDone) || (isOwner && request.ownerDone)) {
    throw new ServiceError("You already marked this activity completed.");
  }
  const now = new Date().toISOString();
  const requesterDone = request.requesterDone || isRequester;
  const ownerDone = request.ownerDone || isOwner;
  if (!(requesterDone && ownerDone)) {
    useAppStore.setState((current) => ({
      requests: current.requests.map((item) =>
        item.id === requestId ? { ...item, requesterDone, ownerDone, updatedAt: now } : item,
      ),
    }));
    const otherId = isRequester ? request.ownerId : request.requesterId;
    pushNotification({
      userId: otherId,
      type: "activity",
      title: "Activity update",
      body: `${me.fullName} marked the activity completed. Please confirm when you are ready.`,
      href: conversationHref(requestId),
    });
    return { completed: false as const, activityId: null };
  }

  const post = request.postId ? state.posts.find((item) => item.id === request.postId) : null;
  const activity: Activity = {
    id: createId("a"),
    requestId,
    postId: request.postId,
    participantIds: [request.requesterId, request.ownerId],
    title: post?.title ?? "Direct service request",
    category: post?.category ?? "Learning",
    completedAt: now,
  };
  useAppStore.setState((current) => ({
    requests: current.requests.map((item) =>
      item.id === requestId
        ? { ...item, status: "completed" as const, requesterDone: true, ownerDone: true, updatedAt: now }
        : item,
    ),
    posts: current.posts.map((item) =>
      item.id === request.postId ? { ...item, status: "completed" as const, updatedAt: now } : item,
    ),
    activities: [activity, ...current.activities],
  }));
  [request.requesterId, request.ownerId].forEach((userId) => {
    pushNotification({
      userId,
      type: "completed",
      title: "Activity completed",
      body: `${activity.title} is complete. You can leave feedback.`,
      href: `/feedback/${activity.id}`,
    });
  });
  return { completed: true as const, activityId: activity.id };
}
