"use client";

import { create } from "zustand";
import type { Connection, DirectMessage, DirectReaction } from "@/lib/types";

/**
 * In-memory store for connections and direct messages. Kept separate from the
 * persisted app store: chat data should always come fresh from Supabase and
 * never be written to the browser's localStorage.
 */
interface ConnectionState {
  connections: Connection[];
  connectionsLoaded: boolean;
  /** messages per connection id, oldest first */
  messages: Record<string, DirectMessage[]>;
  /** reactions per message id */
  reactions: Record<string, DirectReaction[]>;
}

export const useConnectionStore = create<ConnectionState>(() => ({
  connections: [],
  connectionsLoaded: false,
  messages: {},
  reactions: {},
}));

export function resetConnectionStore() {
  useConnectionStore.setState({ connections: [], connectionsLoaded: false, messages: {}, reactions: {} });
}
