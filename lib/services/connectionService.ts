"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { useConnectionStore } from "@/lib/store/useConnectionStore";
import { requireUser, ServiceError } from "@/lib/services/shared";
import { pushNotification } from "@/lib/services/notificationService";
import { blockUser, unblockUser } from "@/lib/services/reportService";
import { createUuid } from "@/lib/utils";
import type { Connection } from "@/lib/types";

export function rowToConnection(row: any): Connection {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

/** How the signed-in member relates to another member. */
export type ConnectionState =
  | { kind: "none" }
  | { kind: "outgoing"; connection: Connection } // I asked, waiting (or silently declined)
  | { kind: "incoming"; connection: Connection } // they asked me
  | { kind: "connected"; connection: Connection }
  | { kind: "declined_by_me"; connection: Connection }
  | { kind: "blocked" };

/* -------------------------------------------------------------------------- */
/* Fetch + realtime                                                           */
/* -------------------------------------------------------------------------- */

let inFlight: Promise<void> | null = null;

export function fetchConnections(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("connections").select("*").order("updated_at", { ascending: false });
      if (error) {
        // Most likely the migration hasn't been run yet
        console.warn("fetchConnections:", error.message);
        useConnectionStore.setState({ connectionsLoaded: true });
        return;
      }
      useConnectionStore.setState({ connections: (data ?? []).map(rowToConnection), connectionsLoaded: true });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** All my connections (any status) + live updates. */
export function useConnections() {
  const userId = useAppStore((s) => s.sessionUserId);
  const connections = useConnectionStore((s) => s.connections);
  const loaded = useConnectionStore((s) => s.connectionsLoaded);

  useEffect(() => {
    if (!userId) return;
    fetchConnections();
    const supabase = createClient();
    // RLS limits realtime rows to connections I'm part of
    const channel = supabase
      .channel(`connections_${userId}_${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => fetchConnections())
      .subscribe();
    const poll = setInterval(fetchConnections, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [userId]);

  return useMemo(() => {
    const mine = userId ? connections.filter((c) => c.requesterId === userId || c.addresseeId === userId) : [];
    const otherOf = (c: Connection) => (c.requesterId === userId ? c.addresseeId : c.requesterId);
    return {
      loaded,
      otherOf,
      accepted: mine.filter((c) => c.status === "accepted"),
      incoming: mine.filter((c) => c.status === "pending" && c.addresseeId === userId),
      outgoing: mine.filter((c) => c.requesterId === userId && (c.status === "pending" || c.status === "rejected")),
      all: mine,
    };
  }, [connections, loaded, userId]);
}

/** My relationship with one member (for Connect buttons on profiles and cards). */
export function useConnectionWith(otherId: string | null | undefined): ConnectionState {
  const userId = useAppStore((s) => s.sessionUserId);
  const blocks = useAppStore((s) => s.blocks);
  const connections = useConnectionStore((s) => s.connections);

  useEffect(() => {
    if (userId) fetchConnections();
  }, [userId]);

  return useMemo<ConnectionState>(() => {
    if (!userId || !otherId || otherId === userId) return { kind: "none" };
    if (blocks.some((b) => b.blockerId === userId && b.blockedId === otherId)) return { kind: "blocked" };
    const c = connections.find(
      (x) => (x.requesterId === userId && x.addresseeId === otherId) || (x.requesterId === otherId && x.addresseeId === userId)
    );
    if (!c) return { kind: "none" };
    if (c.status === "accepted") return { kind: "connected", connection: c };
    if (c.requesterId === userId) return { kind: "outgoing", connection: c }; // a decline stays silent to the sender
    return c.status === "pending" ? { kind: "incoming", connection: c } : { kind: "declined_by_me", connection: c };
  }, [blocks, connections, otherId, userId]);
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

function upsertLocal(conn: Connection) {
  useConnectionStore.setState((s) => ({ connections: [conn, ...s.connections.filter((c) => c.id !== conn.id)] }));
}

function friendly(message: string | undefined, fallback: string) {
  const m = (message ?? "").toLowerCase();
  if (m.includes("relation") && m.includes("does not exist")) return "Connections aren't set up yet. Please ask the site admin to run the latest database update.";
  if (m.includes("row-level security") || m.includes("violates")) return "You can't connect with this member.";
  if (m.includes("duplicate") || m.includes("unique")) return "You already have a connection request with this member.";
  return message || fallback;
}

export async function sendConnectionRequest(otherId: string): Promise<void> {
  const me = requireUser();
  if (otherId === me.id) throw new ServiceError("You can't connect with yourself.");
  const { blocks } = useAppStore.getState();
  if (blocks.some((b) => (b.blockerId === me.id && b.blockedId === otherId) || (b.blockerId === otherId && b.blockedId === me.id))) {
    throw new ServiceError("You can't connect with this member.");
  }

  const supabase = createClient();
  const existing = useConnectionStore
    .getState()
    .connections.find(
      (c) => (c.requesterId === me.id && c.addresseeId === otherId) || (c.requesterId === otherId && c.addresseeId === me.id)
    );

  if (existing?.status === "accepted") return;
  if (existing?.status === "pending" && existing.addresseeId === me.id) {
    // They already asked me — sending back means accepting
    await acceptConnection(existing.id);
    return;
  }
  if (existing?.status === "pending") return; // already requested

  const now = new Date().toISOString();
  if (existing) {
    // A previous request was declined: re-open it with me as the requester
    const updated: Connection = { ...existing, requesterId: me.id, addresseeId: otherId, status: "pending", updatedAt: now };
    const { error } = await supabase
      .from("connections")
      .update({ requester_id: me.id, addressee_id: otherId, status: "pending", updated_at: now })
      .eq("id", existing.id);
    if (error) throw new ServiceError(friendly(error.message, "Couldn't send the request."));
    upsertLocal(updated);
  } else {
    const conn: Connection = { id: createUuid(), requesterId: me.id, addresseeId: otherId, status: "pending", createdAt: now, updatedAt: now };
    const { error } = await supabase.from("connections").insert({
      id: conn.id,
      requester_id: conn.requesterId,
      addressee_id: conn.addresseeId,
      status: "pending",
      created_at: now,
      updated_at: now,
    });
    if (error) throw new ServiceError(friendly(error.message, "Couldn't send the request."));
    upsertLocal(conn);
  }

  pushNotification({
    userId: otherId,
    type: "connection_request",
    title: "New connection request",
    body: `${me.fullName} wants to connect with you.`,
    href: "/connections?tab=requests",
  });
}

export async function acceptConnection(connectionId: string): Promise<void> {
  const me = requireUser();
  const conn = useConnectionStore.getState().connections.find((c) => c.id === connectionId);
  if (!conn || conn.addresseeId !== me.id) throw new ServiceError("This request is no longer available.");
  const now = new Date().toISOString();
  const { error } = await createClient().from("connections").update({ status: "accepted", updated_at: now }).eq("id", connectionId);
  if (error) throw new ServiceError(friendly(error.message, "Couldn't accept the request."));
  upsertLocal({ ...conn, status: "accepted", updatedAt: now });

  pushNotification({
    userId: conn.requesterId,
    type: "connection_accepted",
    title: "Connection accepted",
    body: `${me.fullName} accepted your connection request. Say hello!`,
    href: `/connections/chat/${connectionId}`,
  });
}

/** Decline quietly (the sender isn't notified, like Facebook). */
export async function declineConnection(connectionId: string): Promise<void> {
  const me = requireUser();
  const conn = useConnectionStore.getState().connections.find((c) => c.id === connectionId);
  if (!conn || conn.addresseeId !== me.id) throw new ServiceError("This request is no longer available.");
  const now = new Date().toISOString();
  const { error } = await createClient().from("connections").update({ status: "rejected", updated_at: now }).eq("id", connectionId);
  if (error) throw new ServiceError(friendly(error.message, "Couldn't decline the request."));
  upsertLocal({ ...conn, status: "rejected", updatedAt: now });
}

/** Cancel my pending request, or remove an existing connection (deletes the chat too). */
export async function removeConnection(connectionId: string): Promise<void> {
  const { error } = await createClient().from("connections").delete().eq("id", connectionId);
  if (error) throw new ServiceError(friendly(error.message, "Couldn't update the connection."));
  useConnectionStore.setState((s) => {
    const { [connectionId]: _removed, ...messages } = s.messages;
    return { connections: s.connections.filter((c) => c.id !== connectionId), messages };
  });
}

/** Block a member: also removes any connection or pending request with them. */
export async function blockMember(otherId: string): Promise<void> {
  const me = requireUser();
  await blockUser(otherId);
  const conn = useConnectionStore
    .getState()
    .connections.find(
      (c) => (c.requesterId === me.id && c.addresseeId === otherId) || (c.requesterId === otherId && c.addresseeId === me.id)
    );
  if (conn) await removeConnection(conn.id).catch(() => {});
}

export async function unblockMember(otherId: string): Promise<void> {
  await unblockUser(otherId);
}

/* -------------------------------------------------------------------------- */
/* Profile counts (LinkedIn-style)                                            */
/* -------------------------------------------------------------------------- */

/**
 * Number of accepted connections a member has. Uses the `connection_count`
 * database function so it works on anyone's profile; on my own profile it
 * falls back to my local list if that function isn't installed yet.
 * Returns undefined while loading and null when the count isn't available.
 */
export function useConnectionCount(userId: string | null | undefined): number | null | undefined {
  const myId = useAppStore((s) => s.sessionUserId);
  const connections = useConnectionStore((s) => s.connections);
  const [count, setCount] = useState<number | null | undefined>(undefined);

  // Re-count when my own connections change (e.g. I connect with this member)
  const myAcceptedKey = connections
    .filter((c) => c.status === "accepted")
    .map((c) => c.id)
    .sort()
    .join(",");

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    createClient()
      .rpc("connection_count", { uid: userId })
      .then(({ data, error }) => {
        if (!alive) return;
        if (!error && typeof data === "number") return setCount(data);
        if (userId === myId) {
          const mine = useConnectionStore
            .getState()
            .connections.filter((c) => c.status === "accepted" && (c.requesterId === userId || c.addresseeId === userId));
          setCount(mine.length);
        } else setCount(null);
      });
    return () => {
      alive = false;
    };
  }, [userId, myId, myAcceptedKey]);

  useEffect(() => {
    if (myId) fetchConnections();
  }, [myId]);

  return count;
}

/** Ids of members connected to both me and `otherId`. */
export function useMutualConnections(otherId: string | null | undefined): string[] {
  const myId = useAppStore((s) => s.sessionUserId);
  const connections = useConnectionStore((s) => s.connections);
  const [ids, setIds] = useState<string[]>([]);
  const key = connections.filter((c) => c.status === "accepted").length;

  useEffect(() => {
    if (!otherId || !myId || otherId === myId) {
      setIds([]);
      return;
    }
    let alive = true;
    createClient()
      .rpc("mutual_connections", { other: otherId })
      .then(({ data, error }) => {
        if (!alive) return;
        setIds(error || !Array.isArray(data) ? [] : data.map((row: any) => row.user_id ?? row));
      });
    return () => {
      alive = false;
    };
  }, [otherId, myId, key]);

  return ids;
}
