"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Activity, Conversation, ServiceRequest } from "@/lib/types";
import { pushNotification } from "@/lib/services/notificationService";
import { hiddenFrom, requireUser, ServiceError, userById } from "@/lib/services/shared";
import { createClient } from "@/lib/supabase/client";

export function rowToRequest(row: any): ServiceRequest {
  return {
    id: row.id,
    postId: row.post_id ?? null,
    requesterId: row.requester_id,
    ownerId: row.owner_id,
    message: row.message || "",
    status: row.status,
    direct: Boolean(row.direct),
    requesterDone: Boolean(row.requester_done),
    ownerDone: Boolean(row.owner_done),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export function rowToConversation(row: any): Conversation {
  return {
    id: row.id,
    requestId: row.request_id,
    participantIds: row.participant_ids || [],
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export function rowToActivity(row: any): Activity {
  return {
    id: row.id,
    requestId: row.request_id,
    postId: row.post_id ?? null,
    participantIds: row.participant_ids || [],
    title: row.title || "Community exchange",
    category: row.category || "Companionship",
    completedAt: row.completed_at ?? new Date().toISOString(),
  };
}

function conversationHref(requestId: string) {
  const conversation = useAppStore.getState().conversations.find((item) => item.requestId === requestId);
  return conversation ? `/chat/${conversation.id}` : "/requests";
}

/**
 * Fetch user's service requests, related conversations, and activities from Supabase
 */
export async function fetchRequests(): Promise<ServiceRequest[]> {
  const user = useAppStore.getState().users.find((u) => u.id === useAppStore.getState().sessionUserId);
  if (!user) return [];

  const supabase = createClient();

  // 1. Fetch requests
  const { data: requestRows, error: reqError } = await supabase
    .from("service_requests")
    .select("*")
    .or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (reqError || !requestRows) return [];
  const requests = requestRows.map(rowToRequest);

  // 2. Fetch conversations
  const { data: convRows } = await supabase
    .from("conversations")
    .select("*")
    .contains("participant_ids", [user.id]);

  const conversations = (convRows || []).map(rowToConversation);

  // 3. Fetch completed activities
  const { data: actRows } = await supabase
    .from("activities")
    .select("*")
    .contains("participant_ids", [user.id]);

  const activities = (actRows || []).map(rowToActivity);

  useAppStore.setState((state) => {
    const remoteReqIds = new Set(requests.map((r) => r.id));
    const keptReqs = state.requests.filter((r) => !remoteReqIds.has(r.id));

    const remoteConvIds = new Set(conversations.map((c) => c.id));
    const keptConvs = state.conversations.filter((c) => !remoteConvIds.has(c.id));

    const remoteActIds = new Set(activities.map((a) => a.id));
    const keptActs = state.activities.filter((a) => !remoteActIds.has(a.id));

    return {
      requests: [...requests, ...keptReqs],
      conversations: [...conversations, ...keptConvs],
      activities: [...activities, ...keptActs],
    };
  });

  return requests;
}

export function useRequests() {
  return useAppStore((state) => state.requests);
}

/**
 * Hook to retrieve incoming and outgoing requests for the current user
 */
export function useMyRequests() {
  const requests = useAppStore((state) => state.requests);
  const blocks = useAppStore((state) => state.blocks);
  const userId = useAppStore((state) => state.sessionUserId);

  useEffect(() => {
    if (userId) {
      fetchRequests();
    }
  }, [userId]);

  return useMemo(() => {
    const visible = requests.filter((request) => {
      if (!userId) return false;
      if (request.requesterId !== userId && request.ownerId !== userId) return false;
      const otherId = request.requesterId === userId ? request.ownerId : request.requesterId;
      return !hiddenFrom(blocks, userId, otherId);
    });
    return {
      incoming: visible
        .filter((request) => request.ownerId === userId && request.status === "pending")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      outgoing: visible
        .filter((request) => request.requesterId === userId && request.status === "pending")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      inProgress: visible
        .filter((request) => request.status === "accepted")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      completed: visible
        .filter((request) => request.status === "completed")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    };
  }, [blocks, requests, userId]);
}

/**
 * Hook to retrieve requests for a specific post
 */
export function useRequestsForPost(postId: string) {
  const requests = useAppStore((state) => state.requests);
  const userId = useAppStore((state) => state.sessionUserId);

  useEffect(() => {
    if (postId) {
      fetchRequests();
    }
  }, [postId]);

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

  useEffect(() => {
    if (otherUserId) {
      fetchRequests();
    }
  }, [otherUserId]);

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

/**
 * Responds to a community post with a service request
 */
export async function respondToPost(postId: string, message: string): Promise<ServiceRequest> {
  const me = requireUser();
  const state = useAppStore.getState();
  const post = state.posts.find((item) => item.id === postId);

  if (!post) throw new ServiceError("We could not find that post.");
  if (hiddenFrom(state.blocks, me.id, post.authorId)) throw new ServiceError("This post is not available.");
  if (post.status !== "open") throw new ServiceError("This post is not open for new responses.");

  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;
  const requesterId = authUser?.id || me.id;

  if (post.authorId === requesterId || post.authorId === me.id) {
    throw new ServiceError("You cannot respond to your own post.");
  }

  const duplicate = state.requests.some(
    (request) =>
      request.postId === postId &&
      (request.requesterId === requesterId || request.requesterId === me.id) &&
      request.status !== "cancelled",
  );
  if (duplicate) throw new ServiceError("You already responded to this post.");

  // If this is a mock seed post (not in Supabase DB), save to local store gracefully
  const isMockPost = !postId.includes("-") || post.authorId.startsWith("u");
  if (isMockPost) {
    const localRequest: ServiceRequest = {
      id: "req-" + Date.now(),
      postId,
      requesterId,
      ownerId: post.authorId,
      message: message.trim(),
      status: "pending",
      direct: false,
      requesterDone: false,
      ownerDone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useAppStore.setState((current) => ({ requests: [localRequest, ...current.requests] }));
    pushNotification({
      userId: post.authorId,
      type: "request_new",
      title: "New service request",
      body: `${me.fullName} responded to “${post.title}”.`,
      href: "/requests",
    });
    return localRequest;
  }

  const newRow = {
    post_id: postId,
    requester_id: requesterId,
    owner_id: post.authorId,
    message: message.trim(),
    status: "pending",
    direct: false,
    requester_done: false,
    owner_done: false,
  };

  const { data, error } = await supabase
    .from("service_requests")
    .insert(newRow)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to insert service request:", error);
    throw new ServiceError(error?.message || "Failed to submit request.");
  }

  const request = rowToRequest(data);
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

/**
 * Creates a direct service request to another user
 */
export async function createDirectRequest(targetUserId: string, message: string): Promise<ServiceRequest> {
  const me = requireUser();
  const state = useAppStore.getState();

  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;
  const requesterId = authUser?.id || me.id;

  if (targetUserId === requesterId || targetUserId === me.id) {
    throw new ServiceError("You cannot send a request to yourself.");
  }
  const target = userById(state.users, targetUserId);
  if (!target || hiddenFrom(state.blocks, requesterId, targetUserId)) {
    throw new ServiceError("That person is not available.");
  }

  const existing = state.requests.find(
    (request) =>
      request.direct &&
      request.status === "pending" &&
      (request.requesterId === requesterId || request.requesterId === me.id) &&
      request.ownerId === targetUserId,
  );
  if (existing) throw new ServiceError("You already have a pending request with this person.");

  const isMockUser = targetUserId.startsWith("u");
  if (isMockUser) {
    const localRequest: ServiceRequest = {
      id: "req-" + Date.now(),
      postId: null,
      requesterId,
      ownerId: targetUserId,
      message: message.trim() || "I would like to connect and exchange a skill or a service.",
      status: "pending",
      direct: true,
      requesterDone: false,
      ownerDone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useAppStore.setState((current) => ({ requests: [localRequest, ...current.requests] }));
    pushNotification({
      userId: targetUserId,
      type: "request_new",
      title: "New contact request",
      body: `${me.fullName} sent you a service request.`,
      href: "/requests",
    });
    return localRequest;
  }

  const newRow = {
    post_id: null,
    requester_id: requesterId,
    owner_id: targetUserId,
    message: message.trim() || "I would like to connect and exchange a skill or a service.",
    status: "pending",
    direct: true,
    requester_done: false,
    owner_done: false,
  };

  const { data, error } = await supabase
    .from("service_requests")
    .insert(newRow)
    .select()
    .single();

  if (error || !data) {
    throw new ServiceError(error?.message || "Failed to submit request.");
  }

  const request = rowToRequest(data);
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

/**
 * Accepts a pending request, creates the conversation record for chat, and notifies parties
 */
export async function acceptRequest(requestId: string): Promise<Conversation> {
  const me = requireUser();
  const state = useAppStore.getState();
  const request = state.requests.find((item) => item.id === requestId);

  if (!request) throw new ServiceError("We could not find that request.");
  if (request.ownerId !== me.id) {
    throw new ServiceError("Only the person who received this request can accept it.");
  }
  if (request.status !== "pending") throw new ServiceError("This request is no longer pending.");

  const supabase = createClient();
  const now = new Date().toISOString();

  // 1. Update request status to accepted
  const { error: acceptErr } = await supabase
    .from("service_requests")
    .update({ status: "accepted", updated_at: now })
    .eq("id", requestId);

  if (acceptErr) {
    throw new ServiceError(acceptErr.message || "Failed to accept request.");
  }

  // 2. Create conversation in public.conversations
  const convRow = {
    request_id: requestId,
    participant_ids: [request.requesterId, request.ownerId],
  };

  const { data: convData, error: convErr } = await supabase
    .from("conversations")
    .insert(convRow)
    .select()
    .single();

  let conversation: Conversation;
  if (!convErr && convData) {
    conversation = rowToConversation(convData);
  } else {
    conversation = {
      id: "c_" + Math.random().toString(36).substring(2, 9),
      requestId: request.id,
      participantIds: [request.requesterId, request.ownerId],
      createdAt: now,
    };
  }

  // 3. If tied to a post, update post status to in_progress & reject other pending requests
  if (request.postId) {
    await supabase
      .from("posts")
      .update({ status: "in_progress", updated_at: now })
      .eq("id", request.postId);

    await supabase
      .from("service_requests")
      .update({ status: "rejected", updated_at: now })
      .eq("post_id", request.postId)
      .neq("id", requestId)
      .eq("status", "pending");
  }

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

/**
 * Declines a pending request
 */
export async function rejectRequest(requestId: string): Promise<void> {
  const me = requireUser();
  const request = useAppStore.getState().requests.find((item) => item.id === requestId);
  if (!request) throw new ServiceError("We could not find that request.");
  if (request.ownerId !== me.id) {
    throw new ServiceError("Only the person who received this request can decline it.");
  }
  if (request.status !== "pending") throw new ServiceError("This request is no longer pending.");

  const supabase = createClient();
  const now = new Date().toISOString();

  await supabase
    .from("service_requests")
    .update({ status: "rejected", updated_at: now })
    .eq("id", requestId);

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

/**
 * Cancels an outgoing pending request
 */
export async function cancelRequest(requestId: string): Promise<void> {
  const me = requireUser();
  const request = useAppStore.getState().requests.find((item) => item.id === requestId);
  if (!request) throw new ServiceError("We could not find that request.");
  if (request.requesterId !== me.id) throw new ServiceError("Only the person who sent this request can cancel it.");
  if (request.status !== "pending") throw new ServiceError("You can cancel a request only while it is pending.");

  const supabase = createClient();
  const now = new Date().toISOString();

  await supabase
    .from("service_requests")
    .update({ status: "cancelled", updated_at: now })
    .eq("id", requestId);

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

/**
 * Two-party confirmation of activity completion
 */
export async function confirmCompletion(requestId: string): Promise<{ completed: boolean; activityId: string | null }> {
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

  const supabase = createClient();
  const now = new Date().toISOString();
  const requesterDone = request.requesterDone || isRequester;
  const ownerDone = request.ownerDone || isOwner;

  if (!(requesterDone && ownerDone)) {
    // Only one side marked done so far
    await supabase
      .from("service_requests")
      .update({
        requester_done: requesterDone,
        owner_done: ownerDone,
        updated_at: now,
      })
      .eq("id", requestId);

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

    return { completed: false, activityId: null };
  }

  // Both sides confirmed done!
  // 1. Update service_requests to completed
  await supabase
    .from("service_requests")
    .update({
      status: "completed",
      requester_done: true,
      owner_done: true,
      updated_at: now,
    })
    .eq("id", requestId);

  // 2. If tied to a post, update post to completed
  if (request.postId) {
    await supabase
      .from("posts")
      .update({ status: "completed", updated_at: now })
      .eq("id", request.postId);
  }

  // 3. Create public.activities record
  const post = request.postId ? state.posts.find((item) => item.id === request.postId) : null;
  const actRow = {
    request_id: requestId,
    post_id: request.postId,
    participant_ids: [request.requesterId, request.ownerId],
    title: post?.title ?? "Direct service request",
    category: post?.category ?? "Companionship",
    completed_at: now,
  };

  const { data: actData } = await supabase
    .from("activities")
    .insert(actRow)
    .select()
    .single();

  const activity: Activity = actData ? rowToActivity(actData) : {
    id: "a_" + Math.random().toString(36).substring(2, 9),
    requestId,
    postId: request.postId,
    participantIds: [request.requesterId, request.ownerId],
    title: post?.title ?? "Direct service request",
    category: post?.category ?? "Companionship",
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

  return { completed: true, activityId: activity.id };
}
