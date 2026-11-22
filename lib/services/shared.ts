"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import type { Block, Profile } from "@/lib/types";

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceError";
  }
}

export function requireUser() {
  const state = useAppStore.getState();
  const user = state.users.find((item) => item.id === state.sessionUserId);
  if (!user) throw new ServiceError("Please log in to continue.");
  return user;
}

export function isBlocked(blocks: Block[], a: string, b: string) {
  return blocks.some(
    (block) =>
      (block.blockerId === a && block.blockedId === b) ||
      (block.blockerId === b && block.blockedId === a),
  );
}

export function userById(users: Profile[], id: string) {
  return users.find((user) => user.id === id) ?? null;
}

export function hiddenFrom(blocks: Block[], viewerId: string | null, otherId: string) {
  if (!viewerId || viewerId === otherId) return false;
  return isBlocked(blocks, viewerId, otherId);
}
