import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeSupabase, opsOn } from "./fakeSupabase";
import { emptyState, member } from "./setup";

let fake = makeFakeSupabase();
vi.mock("@/lib/supabase/client", () => ({ createClient: () => fake }));

import { useAppStore } from "@/lib/store/useAppStore";
import { useConnectionStore } from "@/lib/store/useConnectionStore";
import { acceptConnection, blockMember, declineConnection, removeConnection, sendConnectionRequest } from "@/lib/services/connectionService";
import type { Connection } from "@/lib/types";

const conn = (over: Partial<Connection>): Connection => ({ id: "c1", requesterId: "ken", addresseeId: "hana", status: "pending", createdAt: "x", updatedAt: "x", ...over });

beforeEach(() => {
  fake = makeFakeSupabase();
  useAppStore.setState({ ...emptyState(), users: [member("hana"), member("ken")], sessionUserId: "hana" }, true);
  useConnectionStore.setState({ connections: [], connectionsLoaded: true, messages: {}, reactions: {} });
});

describe("connection requests", () => {
  it("sends a request and notifies the other member", async () => {
    await sendConnectionRequest("ken");
    expect(opsOn(fake, "connections", "insert")[0].payload).toMatchObject({ requester_id: "hana", addressee_id: "ken", status: "pending" });
    expect(opsOn(fake, "notifications", "insert")[0].payload).toMatchObject({ user_id: "ken", type: "connection_request" });
    expect(useConnectionStore.getState().connections[0].status).toBe("pending");
  });

  it("cannot connect with yourself", async () => {
    await expect(sendConnectionRequest("hana")).rejects.toThrow(/yourself/);
  });

  it("cannot connect with a blocked member (either direction)", async () => {
    useAppStore.setState({ blocks: [{ id: "b", blockerId: "ken", blockedId: "hana", createdAt: "x" } as any] });
    await expect(sendConnectionRequest("ken")).rejects.toThrow(/can't connect/);
    expect(opsOn(fake, "connections")).toHaveLength(0);
  });

  it("connecting back to someone who already asked you accepts their request", async () => {
    useConnectionStore.setState({ connections: [conn({})] });
    await sendConnectionRequest("ken");
    expect(opsOn(fake, "connections", "insert")).toHaveLength(0);
    expect(opsOn(fake, "connections", "update")[0].payload).toMatchObject({ status: "accepted" });
    expect(useConnectionStore.getState().connections[0].status).toBe("accepted");
  });

  it("a declined request can be sent again", async () => {
    useConnectionStore.setState({ connections: [conn({ requesterId: "hana", addresseeId: "ken", status: "rejected" })] });
    await sendConnectionRequest("ken");
    expect(opsOn(fake, "connections", "update")[0].payload).toMatchObject({ requester_id: "hana", addressee_id: "ken", status: "pending" });
  });

  it("does not send a duplicate pending request", async () => {
    useConnectionStore.setState({ connections: [conn({ requesterId: "hana", addresseeId: "ken" })] });
    await sendConnectionRequest("ken");
    expect(fake.calls).toHaveLength(0);
  });

  it("only the receiver can accept or decline", async () => {
    useConnectionStore.setState({ connections: [conn({ requesterId: "hana", addresseeId: "ken" })] });
    await expect(acceptConnection("c1")).rejects.toThrow();
    await expect(declineConnection("c1")).rejects.toThrow();
  });

  it("declining is silent (no notification to the sender)", async () => {
    useConnectionStore.setState({ connections: [conn({})] });
    await declineConnection("c1");
    expect(opsOn(fake, "notifications")).toHaveLength(0);
    expect(useConnectionStore.getState().connections[0].status).toBe("rejected");
  });

  it("accepting notifies the sender with a link to the private chat", async () => {
    useConnectionStore.setState({ connections: [conn({})] });
    await acceptConnection("c1");
    expect(opsOn(fake, "notifications", "insert")[0].payload).toMatchObject({ user_id: "ken", type: "connection_accepted", href: "/connections/chat/c1" });
  });

  it("removing a connection also drops its messages locally", async () => {
    useConnectionStore.setState({ connections: [conn({ status: "accepted" })], messages: { c1: [{ id: "m" } as any] } });
    await removeConnection("c1");
    expect(useConnectionStore.getState().connections).toHaveLength(0);
    expect(useConnectionStore.getState().messages.c1).toBeUndefined();
  });

  it("blocking removes the connection too", async () => {
    useConnectionStore.setState({ connections: [conn({ status: "accepted" })] });
    await blockMember("ken");
    expect(opsOn(fake, "blocks", "insert").length + opsOn(fake, "blocks", "upsert").length).toBe(1);
    expect(opsOn(fake, "connections", "delete")).toHaveLength(1);
  });
});
