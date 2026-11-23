"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Message } from "@/lib/types";
import { createId } from "@/lib/utils";
import { pushNotification } from "@/lib/services/notificationService";
import { hiddenFrom, requireUser, ServiceError, userById } from "@/lib/services/shared";

export interface QuickReplyOption {
  id: string;
  icon: string;
  ja: string;
  en: string;
}

export const QUICK_REPLIES: QuickReplyOption[] = [
  {
    id: "qr-thanks",
    icon: "🙏",
    ja: "ご連絡ありがとうございます！",
    en: "Thank you for reaching out!",
  },
  {
    id: "qr-ok",
    icon: "👍",
    ja: "はい、その日時で大丈夫です！",
    en: "Yes, that date and time works great!",
  },
  {
    id: "qr-time",
    icon: "📅",
    ja: "何時頃がご都合よろしいでしょうか？",
    en: "What time would work best for you?",
  },
  {
    id: "qr-place",
    icon: "🏛️",
    ja: "近くの公民館やカフェでお会いしましょう。",
    en: "Let's meet at a local community center or cafe.",
  },
  {
    id: "qr-welcome",
    icon: "🍵",
    ja: "よろしくお願いいたします。楽しみにしています。",
    en: "Looking forward to working together!",
  },
  {
    id: "qr-details",
    icon: "❓",
    ja: "詳しい場所や目印を教えていただけますか？",
    en: "Could you let me know the meeting spot details?",
  },
];

const CANNED_REPLIES = [
  "Thank you for the message. That time works for me.",
  "I am happy to help. Shall we meet in a public place?",
  "That sounds good. I can bring what we need.",
  "Thanks for explaining. I will be there.",
  "I appreciate your patience. Let us confirm the place.",
];

export function useConversations() {
  const conversations = useAppStore((state) => state.conversations);
  const messages = useAppStore((state) => state.messages);
  const users = useAppStore((state) => state.users);
  const requests = useAppStore((state) => state.requests);
  const posts = useAppStore((state) => state.posts);
  const blocks = useAppStore((state) => state.blocks);
  const userId = useAppStore((state) => state.sessionUserId);

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
        return {
          conversation,
          other: userById(users, otherId),
          otherId,
          last: thread[thread.length - 1] ?? null,
          request,
          post,
        };
      })
      .filter(
        (item) =>
          item.other &&
          !hiddenFrom(blocks, userId, item.otherId) &&
          item.request?.status === "accepted",
      )
      .sort((a, b) => (b.last?.createdAt ?? b.conversation.createdAt).localeCompare(a.last?.createdAt ?? a.conversation.createdAt));
  }, [blocks, conversations, messages, posts, requests, userId, users]);
}

export function useThread(conversationId: string) {
  const conversations = useAppStore((state) => state.conversations);
  const messages = useAppStore((state) => state.messages);
  const users = useAppStore((state) => state.users);
  const requests = useAppStore((state) => state.requests);
  const posts = useAppStore((state) => state.posts);
  const safetyAck = useAppStore((state) => state.safetyAck);
  const userId = useAppStore((state) => state.sessionUserId);

  return useMemo(() => {
    const conversation = conversations.find((item) => item.id === conversationId) ?? null;
    if (!conversation || !userId || !conversation.participantIds.includes(userId)) {
      return null;
    }
    const otherId = conversation.participantIds.find((id) => id !== userId) ?? "";
    const blocks = useAppStore.getState().blocks;
    if (hiddenFrom(blocks, userId, otherId)) return null;
    const request = requests.find((item) => item.id === conversation.requestId) ?? null;
    // Task completion: chat is closed once both parties mark done
    if (!request || request.status !== "accepted") return null;
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

export async function acknowledgeSafety(conversationId: string) {
  const me = requireUser();
  useAppStore.setState((state) => {
    const current = state.safetyAck[conversationId] ?? [];
    if (current.includes(me.id)) return {};
    return { safetyAck: { ...state.safetyAck, [conversationId]: [...current, me.id] } };
  });
}

export async function sendMessage(conversationId: string, body: string) {
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
  if (!request || request.status !== "accepted") {
    throw new ServiceError("Chat is only available for active in-progress activities.");
  }
  // Auto-acknowledge safety tips so elderly users are never blocked by technical error popups
  if (!(state.safetyAck[conversationId] ?? []).includes(me.id)) {
    useAppStore.setState((current) => {
      const existing = current.safetyAck[conversationId] ?? [];
      return {
        safetyAck: {
          ...current.safetyAck,
          [conversationId]: [...existing, me.id],
        },
      };
    });
  }
  const otherId = conversation.participantIds.find((id) => id !== me.id);
  if (!otherId || hiddenFrom(state.blocks, me.id, otherId)) {
    throw new ServiceError("This conversation is not available.");
  }
  const message: Message = {
    id: createId("m"),
    conversationId,
    senderId: me.id,
    body: text,
    createdAt: new Date().toISOString(),
  };
  useAppStore.setState((current) => ({ messages: [...current.messages, message] }));
  pushNotification({
    userId: otherId,
    type: "message",
    title: "New message",
    body: `${me.fullName}: ${text.slice(0, 80)}`,
    href: `/chat/${conversationId}`,
  });

  const delay = 1000 + Math.floor(Math.random() * 1000);
  window.setTimeout(() => {
    const latest = useAppStore.getState();
    const stillThere = latest.conversations.some((item) => item.id === conversationId);
    if (!stillThere) return;
    const reply: Message = {
      id: createId("m"),
      conversationId,
      senderId: otherId,
      body: CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)],
      createdAt: new Date().toISOString(),
      canned: true,
    };
    useAppStore.setState((current) => ({ messages: [...current.messages, reply] }));
    const other = userById(latest.users, otherId);
    pushNotification({
      userId: me.id,
      type: "message",
      title: "New message",
      body: `${other?.fullName ?? "Your contact"} replied.`,
      href: `/chat/${conversationId}`,
    });
  }, delay);

  return message;
}
