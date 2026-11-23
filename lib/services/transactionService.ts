"use client";

import { useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Post, ServiceRequest, Transaction } from "@/lib/types";
import { money } from "@/lib/utils";
import { pushNotification } from "@/lib/services/notificationService";
import { requireUser, ServiceError, userById } from "@/lib/services/shared";
import { createClient } from "@/lib/supabase/client";

export function rowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    requestId: row.request_id,
    postId: row.post_id ?? null,
    payerId: row.payer_id,
    payeeId: row.payee_id,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export function payerIdFor(post: Post, request: ServiceRequest) {
  return post.postType === "offer" ? request.requesterId : request.ownerId;
}

export function payeeIdFor(post: Post, request: ServiceRequest) {
  return payerIdFor(post, request) === request.requesterId ? request.ownerId : request.requesterId;
}

/**
 * Fetch transactions for the current authenticated user
 */
export async function fetchTransactions(): Promise<Transaction[]> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const currentUserId = authUser?.id || useAppStore.getState().sessionUserId;
  if (!currentUserId) return [];

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .or(`payer_id.eq.${currentUserId},payee_id.eq.${currentUserId}`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  const transactions = data.map(rowToTransaction);

  useAppStore.setState((state) => {
    const remoteIds = new Set(transactions.map((t) => t.id));
    const kept = state.transactions.filter((t) => !remoteIds.has(t.id));
    return { transactions: [...transactions, ...kept] };
  });

  return transactions;
}

export function useTransactions() {
  const items = useAppStore((state) => state.transactions);
  const sessionUserId = useAppStore((state) => state.sessionUserId);
  const session = useAppStore((state) =>
    state.users.find((u) => u.id === state.sessionUserId)
  );
  const userId = session?.id || sessionUserId;

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

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

/**
 * Simulates and logs demo payment transaction in Supabase
 */
export async function payDemo(requestId: string): Promise<Transaction> {
  const me = requireUser();
  const state = useAppStore.getState();
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) throw new ServiceError("We could not find that request.");
  if (request.status !== "accepted" && request.status !== "completed") {
    throw new ServiceError("A demo payment is available after a request is accepted.");
  }
  const post = request.postId ? state.posts.find((item) => item.id === request.postId) : null;
  if (!post || post.exchangeMethod !== "paid" || !post.amount) {
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

  const supabase = createClient();
  const newRow = {
    request_id: requestId,
    post_id: post.id,
    payer_id: payerId,
    payee_id: payeeId,
    amount: post.amount,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(newRow)
    .select()
    .single();

  let transaction: Transaction;
  if (!error && data) {
    transaction = rowToTransaction(data);
  } else {
    transaction = {
      id: "t_" + Math.random().toString(36).substring(2, 9),
      requestId,
      postId: post.id,
      payerId,
      payeeId,
      amount: post.amount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  }

  useAppStore.setState((current) => ({
    transactions: [transaction, ...current.transactions.filter((t) => t.id !== transaction.id)],
  }));

  // Simulate payment processing
  await wait(900);
  const failed = Math.random() < 0.1; // 10% demo chance
  const status = failed ? "failed" : "successful";

  if (!error && data) {
    await supabase
      .from("transactions")
      .update({ status })
      .eq("id", transaction.id);
  }

  const finishedTx = { ...transaction, status: status as "failed" | "successful" };

  useAppStore.setState((current) => ({
    transactions: current.transactions.map((item) =>
      item.id === transaction.id ? finishedTx : item,
    ),
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
      href: "/my-activity?tab=transactions",
    });
  });

  return finishedTx;
}
