"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Conversation, Message } from "@/lib/types";
import { pushNotification } from "@/lib/services/notificationService";
import { hiddenFrom, requireUser, ServiceError, userById } from "@/lib/services/shared";
import { createClient } from "@/lib/supabase/client";
import { rowToConversation, rowToRequest } from "@/lib/services/requestService";
import { rowToProfile } from "@/lib/services/authService";
import { rowToPost } from "@/lib/services/postService";

export function rowToMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/**
 * Fetch conversations and recent messages for the current user from Supabase
 */
export async function fetchConversations(): Promise<Conversation[]> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const currentUserId = authUser?.id || useAppStore.getState().sessionUserId;
  if (!currentUserId) return [];

  // 1. Fetch conversations where user is a participant
  let { data: convRows, error: convErr } = await supabase
    .from("conversations")
    .select("*")
    .contains("participant_ids", [currentUserId])
    .order("created_at", { ascending: false });

  if (convErr) {
    console.error("fetchConversations error:", convErr);
  }

  // 2. Self-heal: Ensure accepted service requests have a corresponding conversation record
  const { data: acceptedReqs } = await supabase
    .from("service_requests")
    .select("*")
    .in("status", ["accepted", "completed"])
    .or(`requester_id.eq.${currentUserId},owner_id.eq.${currentUserId}`);

  if (acceptedReqs && acceptedReqs.length > 0) {
    const existingReqIds = new Set((convRows || []).map((c) => c.request_id));
    for (const req of acceptedReqs) {
      if (!existingReqIds.has(req.id)) {
        const { data: newConv, error: insertErr } = await supabase
          .from("conversations")
          .insert({
            request_id: req.id,
            participant_ids: [req.requester_id, req.owner_id],
          })
          .select()
          .single();

        if (newConv) {
          convRows = [newConv, ...(convRows || [])];
        } else if (insertErr) {
          console.warn("Could not insert conversation into Supabase (check RLS policy):", insertErr);
          // Fallback to client-side conversation object so chat still works
          const fallbackConv = {
            id: req.id, // stable id based on request
            request_id: req.id,
            participant_ids: [req.requester_id, req.owner_id],
            created_at: req.updated_at || new Date().toISOString(),
          };
          convRows = [fallbackConv, ...(convRows || [])];
        }
      }
    }
  }

  if (!convRows || convRows.length === 0) return [];
  const conversations = convRows.map(rowToConversation);

  // 3. Fetch associated service requests
  const reqIds = conversations.map((c) => c.requestId).filter(Boolean);
  if (reqIds.length > 0) {
    const { data: reqRows } = await supabase
      .from("service_requests")
      .select("*")
      .in("id", reqIds);

    if (reqRows) {
      const requests = reqRows.map(rowToRequest);
      useAppStore.setState((state) => {
        const remoteIds = new Set(requests.map((r) => r.id));
        const kept = state.requests.filter((r) => !remoteIds.has(r.id));
        return { requests: [...requests, ...kept] };
      });

      // Also fetch associated posts
      const postIds = requests.map((r) => r.postId).filter(Boolean) as string[];
      if (postIds.length > 0) {
        const { data: postRows } = await supabase
          .from("posts")
          .select("*")
          .in("id", postIds);

        if (postRows) {
          const posts = postRows.map(rowToPost);
          useAppStore.setState((state) => {
            const remotePostIds = new Set(posts.map((p) => p.id));
            const keptPosts = state.posts.filter((p) => !remotePostIds.has(p.id));
            return { posts: [...posts, ...keptPosts] };
          });
        }
      }
    }
  }

  // 3. Fetch messages for all conversations
  const convIds = conversations.map((c) => c.id);
  if (convIds.length > 0) {
    const { data: msgRows } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: true });

    if (msgRows) {
      const messages = msgRows.map(rowToMessage);
      useAppStore.setState((state) => {
        const remoteIds = new Set(messages.map((m) => m.id));
        const kept = state.messages.filter((m) => !remoteIds.has(m.id));
        return { messages: [...messages, ...kept] };
      });
    }
  }

  // 4. Fetch missing participants' profiles
  const allParticipantIds = Array.from(new Set(conversations.flatMap((c) => c.participantIds)));
  const cachedUserIds = new Set(useAppStore.getState().users.map((u) => u.id));
  const missingUserIds = allParticipantIds.filter((id) => !cachedUserIds.has(id));

  if (missingUserIds.length > 0) {
    const { data: userRows } = await supabase
      .from("profiles")
      .select("*")
      .in("id", missingUserIds);

    if (userRows) {
      const users = userRows.map(rowToProfile);
      useAppStore.setState((state) => ({ users: [...state.users, ...users] }));
    }
  }

  useAppStore.setState((state) => {
    const remoteIds = new Set(conversations.map((c) => c.id));
    const kept = state.conversations.filter((c) => !remoteIds.has(c.id));
    return { conversations: [...conversations, ...kept] };
  });

  return conversations;
}

/**
 * Fetch full thread data for a specific conversation
 */
export async function fetchConversationThread(conversationId: string): Promise<void> {
  const supabase = createClient();

  // 1. Fetch conversation
  const { data: convData } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  let conversation: Conversation;
  if (convData) {
    conversation = rowToConversation(convData);
  } else {
    // Resilient fallback: check if conversationId is a requestId or if conversation in local store
    const localConv = useAppStore.getState().conversations.find((c) => c.id === conversationId);
    if (localConv) {
      conversation = localConv;
    } else {
      const { data: reqData } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (reqData) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            request_id: reqData.id,
            participant_ids: [reqData.requester_id, reqData.owner_id],
          })
          .select()
          .single();

        if (newConv) {
          conversation = rowToConversation(newConv);
        } else {
          conversation = {
            id: reqData.id,
            requestId: reqData.id,
            participantIds: [reqData.requester_id, reqData.owner_id],
            createdAt: reqData.created_at || new Date().toISOString(),
          };
        }
      } else {
        return;
      }
    }
  }

  // 2. Fetch messages
  const { data: msgRows } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const messages = (msgRows || []).map(rowToMessage);

  // 3. Fetch request & post if not in store
  const { data: reqData } = await supabase
    .from("service_requests")
    .select("*")
    .eq("id", conversation.requestId)
    .single();

  const request = reqData ? rowToRequest(reqData) : null;

  if (request?.postId) {
    const { data: postData } = await supabase
      .from("posts")
      .select("*")
      .eq("id", request.postId)
      .single();

    if (postData) {
      const post = rowToPost(postData);
      useAppStore.setState((state) => ({
        posts: state.posts.some((p) => p.id === post.id)
          ? state.posts.map((p) => (p.id === post.id ? post : p))
          : [post, ...state.posts],
      }));
    }
  }

  // 4. Fetch profiles of participants
  const { data: userRows } = await supabase
    .from("profiles")
    .select("*")
    .in("id", conversation.participantIds);

  const users = (userRows || []).map(rowToProfile);

  useAppStore.setState((state) => {
    const remoteMsgIds = new Set(messages.map((m) => m.id));
    const keptMsgs = state.messages.filter((m) => !remoteMsgIds.has(m.id));

    const userMap = new Map(state.users.map((u) => [u.id, u]));
    users.forEach((u) => userMap.set(u.id, u));

    return {
      conversations: state.conversations.some((c) => c.id === conversation.id)
        ? state.conversations.map((c) => (c.id === conversation.id ? conversation : c))
        : [conversation, ...state.conversations],
      requests: request
        ? state.requests.some((r) => r.id === request.id)
          ? state.requests.map((r) => (r.id === request.id ? request : r))
          : [request, ...state.requests]
        : state.requests,
      messages: [...keptMsgs, ...messages],
      users: Array.from(userMap.values()),
    };
  });
}

/**
 * Hook to retrieve user conversations list, auto-fetching on mount
 */
export function useConversations() {
  const conversations = useAppStore((state) => state.conversations);
  const messages = useAppStore((state) => state.messages);
  const users = useAppStore((state) => state.users);
  const requests = useAppStore((state) => state.requests);
  const posts = useAppStore((state) => state.posts);
  const blocks = useAppStore((state) => state.blocks);
  const userId = useAppStore((state) => state.sessionUserId);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId]);

  return useMemo(() => {
    if (!userId) return [];
    return conversations
      .filter((conversation) => conversation.participantIds.includes(userId))
      .map((conversation) => {
        const otherId = conversation.participantIds.find((id) => id !== userId) ?? "";
        const thread = messages
          .filter((message) => message.conversationId === conversation.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const request = requests.find((item) => item.id === conversation.requestId) ?? null;
        const post = request?.postId ? posts.find((item) => item.id === request.postId) ?? null : null;
        const otherProfile = userById(users, otherId) || {
          id: otherId,
          fullName: "Neighbor",
          email: "",
          avatarUrl: null,
          age: null,
          ageGroup: null,
          location: "",
          neighborhoods: [],
          lat: null,
          lng: null,
          bio: "",
          interests: [],
          skills: [],
          servicesOffered: [],
          servicesNeeded: [],
          availability: "Flexible",
          contactMethod: "chat" as const,
          phone: null,
          userGroup: "yg" as const,
          createdAt: conversation.createdAt,
        };

        return {
          conversation,
          other: otherProfile,
          otherId,
          last: thread[thread.length - 1] ?? null,
          request,
          post,
        };
      })
      .filter((item) => !hiddenFrom(blocks, userId, item.otherId))
      .sort((a, b) => (b.last?.createdAt ?? b.conversation.createdAt).localeCompare(a.last?.createdAt ?? a.conversation.createdAt));
  }, [blocks, conversations, messages, posts, requests, userId, users]);
}

/**
 * Hook to retrieve conversation thread messages and subscribe to Realtime updates
 */
export function useThread(conversationId: string) {
  const conversations = useAppStore((state) => state.conversations);
  const messages = useAppStore((state) => state.messages);
  const users = useAppStore((state) => state.users);
  const requests = useAppStore((state) => state.requests);
  const posts = useAppStore((state) => state.posts);
  const safetyAck = useAppStore((state) => state.safetyAck);
  const userId = useAppStore((state) => state.sessionUserId);

  // 1. Initial fetch of conversation & thread
  useEffect(() => {
    if (conversationId) {
      fetchConversationThread(conversationId);
    }
  }, [conversationId]);

  // 2. Supabase Realtime channel subscription for instant live messaging
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = rowToMessage(payload.new);
          useAppStore.setState((state) => ({
            messages: state.messages.some((m) => m.id === newMsg.id)
              ? state.messages
              : [...state.messages, newMsg],
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return useMemo(() => {
    const conversation = conversations.find((item) => item.id === conversationId) ?? null;
    if (!conversation || !userId || !conversation.participantIds.includes(userId)) {
      return null;
    }
    const otherId = conversation.participantIds.find((id) => id !== userId) ?? "";
    const blocks = useAppStore.getState().blocks;
    if (hiddenFrom(blocks, userId, otherId)) return null;
    const request = requests.find((item) => item.id === conversation.requestId) ?? null;
    if (!request || (request.status !== "accepted" && request.status !== "completed")) return null;
    const post = request.postId ? posts.find((item) => item.id === request.postId) ?? null : null;
    const thread = messages
      .filter((message) => message.conversationId === conversation.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return {
      conversation,
      messages: thread,
      other: userById(users, otherId),
      request,
      post,
      needsSafety: !(safetyAck[conversation.id] ?? []).includes(userId),
    };
  }, [conversationId, conversations, messages, posts, requests, safetyAck, userId, users]);
}

/**
 * Records safety acknowledgment for a conversation
 */
export async function acknowledgeSafety(conversationId: string): Promise<void> {
  const me = requireUser();
  useAppStore.setState((state) => {
    const current = state.safetyAck[conversationId] ?? [];
    if (current.includes(me.id)) return {};
    return { safetyAck: { ...state.safetyAck, [conversationId]: [...current, me.id] } };
  });
}

/**
 * Sends a new message in the conversation via Supabase PostgreSQL
 */
export async function sendMessage(conversationId: string, body: string): Promise<Message> {
  const me = requireUser();
  const text = body.trim();
  if (!text) throw new ServiceError("Write a short message before sending.");
  if (text.length > 500) throw new ServiceError("Please keep the message under 500 characters.");

  const state = useAppStore.getState();
  const conversation = state.conversations.find((item) => item.id === conversationId);
  if (!conversation || !conversation.participantIds.includes(me.id)) {
    throw new ServiceError("This conversation is not available.");
  }

  const request = state.requests.find((item) => item.id === conversation.requestId);
  if (!request || (request.status !== "accepted" && request.status !== "completed")) {
    throw new ServiceError("Chat opens after a request is accepted.");
  }

  if (!(state.safetyAck[conversationId] ?? []).includes(me.id)) {
    throw new ServiceError("Please read the safety tips before sending a message.");
  }

  const otherId = conversation.participantIds.find((id) => id !== me.id);
  if (!otherId || hiddenFrom(state.blocks, me.id, otherId)) {
    throw new ServiceError("This conversation is not available.");
  }

  const supabase = createClient();
  const newRow = {
    conversation_id: conversationId,
    sender_id: me.id,
    body: text,
  };

  const { data, error } = await supabase
    .from("messages")
    .insert(newRow)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to insert message:", error);
    throw new ServiceError(error?.message || "Failed to send message.");
  }

  const message = rowToMessage(data);

  // Optimistically append to local store
  useAppStore.setState((current) => ({
    messages: current.messages.some((m) => m.id === message.id)
      ? current.messages
      : [...current.messages, message],
  }));

  // Dispatches notification to recipient
  pushNotification({
    userId: otherId,
    type: "message",
    title: "New message",
    body: `${me.fullName}: ${text.slice(0, 80)}`,
    href: `/chat/${conversationId}`,
  });

  return message;
}
