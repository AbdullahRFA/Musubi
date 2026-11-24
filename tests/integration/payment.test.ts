import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeSupabase, opsOn } from "./fakeSupabase";
import { emptyState, member, post, request } from "./setup";

let fake = makeFakeSupabase();
vi.mock("@/lib/supabase/client", () => ({ createClient: () => fake }));

import { useAppStore } from "@/lib/store/useAppStore";
import { confirmCompletion } from "@/lib/services/requestService";
import { getPaymentRequirement, payDemo, PaymentRequiredError } from "@/lib/services/transactionService";

const signIn = (id: string, extra = {}) =>
  useAppStore.setState({ ...emptyState(), users: [member("hana"), member("ken", { age: 21, userGroup: "yg" })], posts: [post()], requests: [request()], sessionUserId: id, ...extra }, true);

describe("pay-then-complete (paid request post: the author pays)", () => {
  beforeEach(() => {
    fake = makeFakeSupabase();
    vi.useFakeTimers();
  });

  it("the payer must pay before marking completed", async () => {
    signIn("hana");
    expect(getPaymentRequirement("r1")).toMatchObject({ mustPay: true, paid: false, amount: 10, payerId: "hana", payeeId: "ken" });
    await expect(confirmCompletion("r1")).rejects.toBeInstanceOf(PaymentRequiredError);
    expect(opsOn(fake, "service_requests", "update")).toHaveLength(0);
  });

  it("after a demo payment the payer can complete", async () => {
    signIn("hana");
    const paying = payDemo("r1");
    await vi.runAllTimersAsync();
    const tx = await paying;
    expect(tx.status).toBe("successful");
    expect(opsOn(fake, "transactions", "insert")[0].payload).toMatchObject({ payer_id: "hana", payee_id: "ken", amount: 10, status: "pending" });
    expect(opsOn(fake, "transactions", "update")[0].payload).toEqual({ status: "successful" });
    expect(getPaymentRequirement("r1").mustPay).toBe(false);
    await expect(confirmCompletion("r1")).resolves.toEqual({ completed: false, activityId: null });
  });

  it("the payee is never blocked by the payment", async () => {
    signIn("ken");
    expect(getPaymentRequirement("r1").mustPay).toBe(false);
    await expect(confirmCompletion("r1")).resolves.toMatchObject({ completed: false });
  });

  it("only the payer can run the demo payment", async () => {
    signIn("ken");
    await expect(payDemo("r1")).rejects.toThrow(/Only the person who agreed to pay/);
  });

  it("cannot pay twice", async () => {
    signIn("hana", { transactions: [{ id: "t1", requestId: "r1", postId: "p1", payerId: "hana", payeeId: "ken", amount: 10, status: "successful", createdAt: "x" }] });
    await expect(payDemo("r1")).rejects.toThrow(/already complete/);
  });

  it("a failed save is reported, not silently shown as paid", async () => {
    fake = makeFakeSupabase((q) => (q.table === "transactions" && q.op === "insert" ? { error: { message: "rls" } } : undefined));
    signIn("hana");
    await expect(payDemo("r1")).rejects.toThrow(/couldn't start/);
    expect(useAppStore.getState().transactions).toHaveLength(0);
  });

  it("free posts have no payment step", async () => {
    signIn("hana", { posts: [post({ exchangeMethod: "free", amount: null })] });
    expect(getPaymentRequirement("r1").mustPay).toBe(false);
    await expect(confirmCompletion("r1")).resolves.toMatchObject({ completed: false });
  });

  it("when both confirm, the activity completes and the post closes", async () => {
    signIn("hana", { requests: [request({ requesterDone: true })], transactions: [{ id: "t1", requestId: "r1", postId: "p1", payerId: "hana", payeeId: "ken", amount: 10, status: "successful", createdAt: "x" }] });
    const r = await confirmCompletion("r1");
    expect(r.completed).toBe(true);
    expect(useAppStore.getState().requests[0].status).toBe("completed");
    expect(useAppStore.getState().posts[0].status).toBe("completed");
  });
});
