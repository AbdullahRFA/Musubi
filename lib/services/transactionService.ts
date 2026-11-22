"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Post, ServiceRequest, Transaction } from "@/lib/types";
import { createId, money } from "@/lib/utils";
import { pushNotification } from "@/lib/services/notificationService";
import { requireUser, ServiceError, userById } from "@/lib/services/shared";

export function payerIdFor(post: Post, request: ServiceRequest) {
  return post.postType === "offer" ? request.requesterId : request.ownerId;
}

export function payeeIdFor(post: Post, request: ServiceRequest) {
  return payerIdFor(post, request) === request.requesterId ? request.ownerId : request.requesterId;
}

export function useTransactions() {
  const items = useAppStore((state) => state.transactions);
  const userId = useAppStore((state) => state.sessionUserId);
  return useMemo(
    () =>
      items
        .filter((item) => item.payerId === userId || item.payeeId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items, userId],
  );
}

export function useTransactionsForRequest(requestId: string) {
  const items = useAppStore((state) => state.transactions);
  return useMemo(
    () =>
      items
        .filter((item) => item.requestId === requestId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items, requestId],
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function payDemo(requestId: string) {
  const me = requireUser();
  const state = useAppStore.getState();
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) throw new ServiceError("We could not find that request.");
  if (request.status !== "accepted" && request.status !== "completed") {
    throw new ServiceError("A demo payment is available after a request is accepted.");
  }
  const post = request.postId ? state.posts.find((item) => item.id === request.postId) : null;
  if (!post || post.exchangeMethod !== "payment" || !post.amount) {
    throw new ServiceError("This activity does not use a demo payment.");
  }
  const payerId = payerIdFor(post, request);
  const payeeId = payeeIdFor(post, request);
  if (me.id !== payerId) throw new ServiceError("Only the person who agreed to pay can run this demo payment.");
  const previous = state.transactions
    .filter((item) => item.requestId === requestId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (previous?.status === "successful") throw new ServiceError("This demo payment is already complete.");
  if (previous?.status === "pending") throw new ServiceError("A demo payment is already in progress.");

  const pending: Transaction = {
    id: createId("t"),
    requestId,
    postId: post.id,
    payerId,
    payeeId,
    amount: post.amount,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  useAppStore.setState((current) => ({ transactions: [pending, ...current.transactions] }));
  await wait(900);
  const failed = Math.random() < 0.2;
  const status = failed ? "failed" : "successful";
  useAppStore.setState((current) => ({
    transactions: current.transactions.map((item) => (item.id === pending.id ? { ...item, status } : item)),
  }));
  const payer = userById(useAppStore.getState().users, payerId);
  const body = failed
    ? `The demo payment of ${money(post.amount)} did not go through. You can retry.`
    : `Demo payment of ${money(post.amount)} was recorded. No real money moved.`;
  [payerId, payeeId].forEach((userId) => {
    pushNotification({
      userId,
      type: "payment",
      title: failed ? "Demo payment failed" : "Demo payment recorded",
      body: failed ? body : `${payer?.fullName ?? "A member"} — ${body}`,
      href: "/transactions",
    });
  });
  return { ...pending, status };
}
