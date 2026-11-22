"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import type { Report, ReportTarget } from "@/lib/types";
import { createId } from "@/lib/utils";
import { REPORT_REASONS } from "@/lib/constants";
import { requireUser, ServiceError } from "@/lib/services/shared";

export async function reportContent(targetType: ReportTarget, targetId: string, reason: string) {
  const me = requireUser();
  if (!REPORT_REASONS.includes(reason)) {
    throw new ServiceError("Please choose a reason from the list.");
  }
  const state = useAppStore.getState();
  if (targetType === "user") {
    if (targetId === me.id) throw new ServiceError("You cannot report your own profile.");
    if (!state.users.some((user) => user.id === targetId)) throw new ServiceError("We could not find that person.");
  } else {
    const post = state.posts.find((item) => item.id === targetId);
    if (!post) throw new ServiceError("We could not find that post.");
    if (post.authorId === me.id) throw new ServiceError("You cannot report your own post.");
  }
  const report: Report = {
    id: createId("rep"),
    reporterId: me.id,
    targetType,
    targetId,
    reason,
    createdAt: new Date().toISOString(),
  };
  useAppStore.setState((current) => ({ reports: [report, ...current.reports] }));
  return report;
}

export async function blockUser(userId: string) {
  const me = requireUser();
  if (userId === me.id) throw new ServiceError("You cannot block yourself.");
  const state = useAppStore.getState();
  if (!state.users.some((user) => user.id === userId)) throw new ServiceError("We could not find that person.");
  if (state.blocks.some((block) => block.blockerId === me.id && block.blockedId === userId)) return;
  useAppStore.setState((current) => ({
    blocks: [
      { id: createId("b"), blockerId: me.id, blockedId: userId, createdAt: new Date().toISOString() },
      ...current.blocks,
    ],
  }));
}

export function useBlockedIds() {
  const blocks = useAppStore((state) => state.blocks);
  const userId = useAppStore((state) => state.sessionUserId);
  return blocks
    .filter((block) => block.blockerId === userId || block.blockedId === userId)
    .map((block) => (block.blockerId === userId ? block.blockedId : block.blockerId));
}
