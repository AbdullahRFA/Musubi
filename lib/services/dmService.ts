"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { useConnectionStore } from "@/lib/store/useConnectionStore";
import { requireUser, ServiceError } from "@/lib/services/shared";
import { pushNotification } from "@/lib/services/notificationService";
import { resizeImage } from "@/lib/imageResize";
import { createUuid } from "@/lib/utils";
import type { DirectMessage, DirectReaction, DmReactionEmoji } from "@/lib/types";

export const DM_BUCKET = "dm-images";
export const DM_MAX_LENGTH = 2000;

function rowToMessage(row: any): DirectMessage {
  return {
    id: row.id,
    connectionId: row.connection_id,
    senderId: row.sender_id,
    body: row.body ?? null,
    imagePath: row.image_path ?? null,
    editedAt: row.edited_at ?? null,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at,
  };
}

function rowToReaction(row: any): DirectReaction {
  return { messageId: row.message_id, userId: row.user_id, emoji: row.emoji };
}

/* -------------------------------------------------------------------------- */
/* Local store helpers                                                        */
/* -------------------------------------------------------------------------- */

function setMessages(connectionId: string, update: (list: DirectMessage[]) => DirectMessage[]) {
  useConnectionStore.setState((s) => {
    const next = update(s.messages[connectionId] ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { messages: { ...s.messages, [connectionId]: next } };
  });
}

function setReactions(connectionId: string, update: (list: DirectReaction[]) => DirectReaction[]) {
  useConnectionStore.setState((s) => ({ reactions: { ...s.reactions, [connectionId]: update(s.reactions[connectionId] ?? []) } }));
}

function patchMessage(connectionId: string, id: string, patch: Partial<DirectMessage>) {
  setMessages(connectionId, (list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
}

/* -------------------------------------------------------------------------- */
/* Fetching                                                                   */
/* -------------------------------------------------------------------------- */

const pending = new Map<string, Promise<void>>();
/** Ids of messages that are still being sent (so a refetch doesn't drop them). */
const optimisticIds = new Set<string>();

export function fetchThread(connectionId: string): Promise<void> {
  const existing = pending.get(connectionId);
  if (existing) return existing;
  const job = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("dm_messages")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) {
        console.warn("fetchThread:", error.message);
        return;
      }
      const messages = (data ?? []).map(rowToMessage);
      // Keep optimistic messages that the server hasn't returned yet
      useConnectionStore.setState((s) => {
        const serverIds = new Set(messages.map((m) => m.id));
        const optimistic = (s.messages[connectionId] ?? []).filter((m) => !serverIds.has(m.id) && optimisticIds.has(m.id));
        return { messages: { ...s.messages, [connectionId]: [...messages, ...optimistic].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) } };
      });

      const ids = messages.map((m) => m.id);
      if (ids.length === 0) {
        setReactions(connectionId, () => []);
        return;
      }
      const { data: reactionRows } = await supabase.from("dm_reactions").select("*").in("message_id", ids);
      setReactions(connectionId, () => (reactionRows ?? []).map(rowToReaction));
    } finally {
      pending.delete(connectionId);
    }
  })();
  pending.set(connectionId, job);
  return job;
}

/** Messages + reactions for one conversation, kept live via realtime + polling. */
export function useDmThread(connectionId: string | null) {
  const messages = useConnectionStore((s) => (connectionId ? s.messages[connectionId] : undefined));
  const reactions = useConnectionStore((s) => (connectionId ? s.reactions[connectionId] : undefined));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!connectionId) return;
    let alive = true;
    fetchThread(connectionId).then(() => alive && setLoaded(true));

    const supabase = createClient();
    const channel = supabase
      .channel(`dm_${connectionId}_${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dm_messages", filter: `connection_id=eq.${connectionId}` },
        (payload: any) => {
          if (payload.eventType === "DELETE") return void fetchThread(connectionId);
          const msg = rowToMessage(payload.new);
          setMessages(connectionId, (list) => [...list.filter((m) => m.id !== msg.id), msg]);
        }
      )
      // Reactions can't be filtered by connection; RLS limits them to my threads
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_reactions" }, () => fetchThread(connectionId))
      .subscribe();

    // Fallback in case realtime isn't enabled for these tables
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") fetchThread(connectionId);
    }, 4000);

    return () => {
      alive = false;
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [connectionId]);

  return { messages: messages ?? [], reactions: reactions ?? [], loaded };
}

/** Latest message per connection (for the conversation list). */
export function useLastMessages(connectionIds: string[]) {
  const [last, setLast] = useState<Record<string, DirectMessage>>({});
  const key = connectionIds.slice().sort().join(",");

  useEffect(() => {
    if (!key) {
      setLast({});
      return;
    }
    let alive = true;
    const ids = key.split(",");
    const load = async () => {
      const { data, error } = await createClient()
        .from("dm_messages")
        .select("*")
        .in("connection_id", ids)
        .order("created_at", { ascending: false })
        .limit(Math.max(50, ids.length * 10));
      if (error || !alive) return;
      const map: Record<string, DirectMessage> = {};
      for (const row of data ?? []) {
        const m = rowToMessage(row);
        if (!map[m.connectionId]) map[m.connectionId] = m;
      }
      setLast(map);
    };
    load();
    const poll = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [key]);

  return last;
}

/* -------------------------------------------------------------------------- */
/* Images                                                                     */
/* -------------------------------------------------------------------------- */

const signedUrlCache = new Map<string, { url: string; expires: number }>();

/** Signed URL for a private chat photo (cached for ~50 minutes). */
export function useDmImageUrl(path: string | null) {
  const cached = path ? signedUrlCache.get(path) : undefined;
  const [url, setUrl] = useState<string | null>(cached && cached.expires > Date.now() ? cached.url : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!path) return;
    const hit = signedUrlCache.get(path);
    if (hit && hit.expires > Date.now()) {
      setUrl(hit.url);
      return;
    }
    let alive = true;
    createClient()
      .storage.from(DM_BUCKET)
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data?.signedUrl) return setFailed(true);
        signedUrlCache.set(path, { url: data.signedUrl, expires: Date.now() + 50 * 60 * 1000 });
        setUrl(data.signedUrl);
      });
    return () => {
      alive = false;
    };
  }, [path]);

  return { url, failed };
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

function connectionFor(connectionId: string) {
  const conn = useConnectionStore.getState().connections.find((c) => c.id === connectionId);
  if (!conn || conn.status !== "accepted") throw new ServiceError("You can only message your connections.");
  return conn;
}

function friendly(message: string | undefined, fallback: string) {
  const m = (message ?? "").toLowerCase();
  if (m.includes("bucket") && m.includes("not found")) return "Photo sharing isn't set up yet. Please ask the site admin to run the latest database update.";
  if (m.includes("row-level security") || m.includes("violates")) return "You can't message this member right now.";
  if (m.includes("exceeded") || m.includes("too large")) return "That photo is too large.";
  return message || fallback;
}

/** Last time I notified each conversation, to avoid a notification per keystroke-burst. */
const lastNotified = new Map<string, number>();

export async function sendDm(connectionId: string, input: { body?: string; image?: File | null }): Promise<void> {
  const me = requireUser();
  const conn = connectionFor(connectionId);
  const otherId = conn.requesterId === me.id ? conn.addresseeId : conn.requesterId;
  const body = (input.body ?? "").trim();
  if (!body && !input.image) return;
  if (body.length > DM_MAX_LENGTH) throw new ServiceError(`Messages can be up to ${DM_MAX_LENGTH} characters.`);

  const supabase = createClient();
  const id = createUuid();

  // 1. Shrink and upload the photo first (the message points at it)
  let imagePath: string | null = null;
  if (input.image) {
    const blob = await resizeImage(input.image);
    imagePath = `${connectionId}/${id}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from(DM_BUCKET)
      .upload(imagePath, blob, { contentType: "image/jpeg", upsert: false, cacheControl: "3600" });
    if (uploadError) throw new ServiceError(friendly(uploadError.message, "Couldn't upload the photo."));
  }

  // 2. Optimistic insert
  const message: DirectMessage = {
    id,
    connectionId,
    senderId: me.id,
    body: body || null,
    imagePath,
    editedAt: null,
    deletedAt: null,
    createdAt: new Date().toISOString(),
  };
  optimisticIds.add(id);
  setMessages(connectionId, (list) => [...list, message]);

  const { error } = await supabase.from("dm_messages").insert({
    id,
    connection_id: connectionId,
    sender_id: me.id,
    body: message.body,
    image_path: imagePath,
    created_at: message.createdAt,
  });
  optimisticIds.delete(id);
  if (error) {
    setMessages(connectionId, (list) => list.filter((m) => m.id !== id));
    if (imagePath) supabase.storage.from(DM_BUCKET).remove([imagePath]).catch(() => {});
    throw new ServiceError(friendly(error.message, "Couldn't send the message."));
  }

  // 3. Notify (at most once every 20 s per conversation so a burst doesn't spam)
  const now = Date.now();
  if (now - (lastNotified.get(connectionId) ?? 0) > 20000) {
    lastNotified.set(connectionId, now);
    const preview = body ? (body.length > 80 ? `${body.slice(0, 80)}…` : body) : "📷 Sent a photo";
    pushNotification({
      userId: otherId,
      type: "direct_message",
      title: me.fullName,
      body: preview,
      href: `/connections/chat/${connectionId}`,
    });
  }
}

export async function editDm(message: DirectMessage, body: string): Promise<void> {
  const me = requireUser();
  if (message.senderId !== me.id) throw new ServiceError("You can only edit your own messages.");
  const text = body.trim();
  if (!text && !message.imagePath) throw new ServiceError("A message can't be empty. Delete it instead.");
  if (text.length > DM_MAX_LENGTH) throw new ServiceError(`Messages can be up to ${DM_MAX_LENGTH} characters.`);
  if (text === (message.body ?? "")) return;

  const editedAt = new Date().toISOString();
  const before = { body: message.body, editedAt: message.editedAt };
  patchMessage(message.connectionId, message.id, { body: text || null, editedAt });
  const { error } = await createClient()
    .from("dm_messages")
    .update({ body: text || null, edited_at: editedAt })
    .eq("id", message.id)
    .eq("sender_id", me.id);
  if (error) {
    patchMessage(message.connectionId, message.id, before);
    throw new ServiceError(friendly(error.message, "Couldn't edit the message."));
  }
}

/** Soft delete: the bubble becomes "This message was deleted" for both people. */
export async function deleteDm(message: DirectMessage): Promise<void> {
  const me = requireUser();
  if (message.senderId !== me.id) throw new ServiceError("You can only delete your own messages.");
  const deletedAt = new Date().toISOString();
  const before = { ...message };
  patchMessage(message.connectionId, message.id, { deletedAt, body: null, imagePath: null });

  const supabase = createClient();
  const { error } = await supabase
    .from("dm_messages")
    .update({ deleted_at: deletedAt, body: null, image_path: null })
    .eq("id", message.id)
    .eq("sender_id", me.id);
  if (error) {
    patchMessage(message.connectionId, message.id, before);
    throw new ServiceError(friendly(error.message, "Couldn't delete the message."));
  }
  if (message.imagePath) {
    signedUrlCache.delete(message.imagePath);
    supabase.storage.from(DM_BUCKET).remove([message.imagePath]).catch(() => {});
  }
  // Reactions on a deleted message go away too
  supabase.from("dm_reactions").delete().eq("message_id", message.id).eq("user_id", me.id).then(() => {});
  setReactions(message.connectionId, (list) => list.filter((r) => r.messageId !== message.id));
}

/** One reaction per person per message: same emoji again removes it, a new one replaces it. */
export async function reactDm(message: DirectMessage, emoji: DmReactionEmoji): Promise<void> {
  const me = requireUser();
  if (message.deletedAt) return;
  const current = (useConnectionStore.getState().reactions[message.connectionId] ?? []).find(
    (r) => r.messageId === message.id && r.userId === me.id
  );
  const supabase = createClient();
  const snapshot = useConnectionStore.getState().reactions[message.connectionId] ?? [];

  if (current?.emoji === emoji) {
    setReactions(message.connectionId, (list) => list.filter((r) => !(r.messageId === message.id && r.userId === me.id)));
    const { error } = await supabase.from("dm_reactions").delete().eq("message_id", message.id).eq("user_id", me.id);
    if (error) {
      setReactions(message.connectionId, () => snapshot);
      throw new ServiceError(friendly(error.message, "Couldn't remove the reaction."));
    }
    return;
  }

  setReactions(message.connectionId, (list) => [
    ...list.filter((r) => !(r.messageId === message.id && r.userId === me.id)),
    { messageId: message.id, userId: me.id, emoji },
  ]);
  const { error } = await supabase
    .from("dm_reactions")
    .upsert({ message_id: message.id, user_id: me.id, emoji, created_at: new Date().toISOString() }, { onConflict: "message_id,user_id" });
  if (error) {
    setReactions(message.connectionId, () => snapshot);
    throw new ServiceError(friendly(error.message, "Couldn't add the reaction."));
  }
}

/** Groups reactions for one message: [{emoji, count, mine}] */
export function useGroupedReactions(reactions: DirectReaction[], messageId: string, myId: string | null) {
  return useMemo(() => groupReactions(reactions, messageId, myId), [reactions, messageId, myId]);
}

export function groupReactions(reactions: DirectReaction[], messageId: string, myId: string | null) {
  const groups = new Map<string, { emoji: DmReactionEmoji; count: number; mine: boolean }>();
  for (const r of reactions) {
    if (r.messageId !== messageId) continue;
    const g = groups.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    g.count += 1;
    if (r.userId === myId) g.mine = true;
    groups.set(r.emoji, g);
  }
  return Array.from(groups.values());
}

export function useMyId() {
  return useAppStore((s) => s.sessionUserId);
}
