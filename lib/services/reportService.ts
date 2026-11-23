"use client";

import { useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Report, ReportTarget, Block } from "@/lib/types";
import { REPORT_REASONS } from "@/lib/constants";
import { requireUser, ServiceError } from "@/lib/services/shared";
import { createClient } from "@/lib/supabase/client";

export function rowToReport(row: any): Report {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export function rowToBlock(row: any): Block {
  return {
    id: row.id,
    blockerId: row.blocker_id,
    blockedId: row.blocked_id,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/**
 * Fetch blocked user IDs for the authenticated user from Supabase
 */
export async function fetchBlocks(): Promise<Block[]> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const currentUserId = authUser?.id || useAppStore.getState().sessionUserId;
  if (!currentUserId) return [];

  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("blocker_id", currentUserId);

  if (error || !data) return [];
  const blocks = data.map(rowToBlock);

  useAppStore.setState((state) => {
    const remoteIds = new Set(blocks.map((b) => b.id));
    const kept = state.blocks.filter((b) => !remoteIds.has(b.id));
    return { blocks: [...blocks, ...kept] };
  });

  return blocks;
}

/**
 * Reports content or a user profile to Supabase
 */
export async function reportContent(
  targetType: ReportTarget,
  targetId: string,
  reason: string,
): Promise<Report> {
  const me = requireUser();
  if (!REPORT_REASONS.includes(reason)) {
    throw new ServiceError("Please choose a reason from the list.");
  }
  const state = useAppStore.getState();
  if (targetType === "user") {
    if (targetId === me.id) throw new ServiceError("You cannot report your own profile.");
  } else {
    const post = state.posts.find((item) => item.id === targetId);
    if (post && post.authorId === me.id) throw new ServiceError("You cannot report your own post.");
  }

  const supabase = createClient();
  const newRow = {
    reporter_id: me.id,
    target_type: targetType,
    target_id: targetId,
    reason,
  };

  const { data, error } = await supabase
    .from("reports")
    .insert(newRow)
    .select()
    .single();

  let report: Report;
  if (!error && data) {
    report = rowToReport(data);
  } else {
    report = {
      id: "rep_" + Math.random().toString(36).substring(2, 9),
      reporterId: me.id,
      targetType,
      targetId,
      reason,
      createdAt: new Date().toISOString(),
    };
  }

  useAppStore.setState((current) => ({
    reports: [report, ...current.reports.filter((r) => r.id !== report.id)],
  }));

  return report;
}

/**
 * Blocks a user in Supabase
 */
export async function blockUser(userId: string): Promise<void> {
  const me = requireUser();
  if (userId === me.id) throw new ServiceError("You cannot block yourself.");
  const state = useAppStore.getState();
  if (state.blocks.some((block) => block.blockerId === me.id && block.blockedId === userId)) return;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("blocks")
    .insert({ blocker_id: me.id, blocked_id: userId })
    .select()
    .single();

  const block: Block = !error && data ? rowToBlock(data) : {
    id: "b_" + Math.random().toString(36).substring(2, 9),
    blockerId: me.id,
    blockedId: userId,
    createdAt: new Date().toISOString(),
  };

  useAppStore.setState((current) => ({
    blocks: [block, ...current.blocks.filter((b) => b.id !== block.id)],
  }));
}

/**
 * Unblocks a user in Supabase
 */
export async function unblockUser(userId: string): Promise<void> {
  const me = requireUser();
  const supabase = createClient();

  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", me.id)
    .eq("blocked_id", userId);

  useAppStore.setState((current) => ({
    blocks: current.blocks.filter(
      (block) => !(block.blockerId === me.id && block.blockedId === userId),
    ),
  }));
}

export function useBlockedIds(): string[] {
  const blocks = useAppStore((state) => state.blocks);
  const sessionUserId = useAppStore((state) => state.sessionUserId);
  const session = useAppStore((state) =>
    state.users.find((u) => u.id === state.sessionUserId)
  );
  const userId = session?.id || sessionUserId;

  useEffect(() => {
    if (userId) {
      fetchBlocks();
    }
  }, [userId]);

  return useMemo(
    () =>
      blocks
        .filter((block) => block.blockerId === userId || block.blockedId === userId)
        .map((block) => (block.blockerId === userId ? block.blockedId : block.blockerId)),
    [blocks, userId],
  );
}
