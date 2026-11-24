import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));
import { conversationIdFromHref } from "@/lib/services/notificationService";
import { groupReactions } from "@/lib/services/dmService";

describe("notification links → conversations", () => {
  it("maps post chats and direct messages to separate conversation ids", () => {
    expect(conversationIdFromHref("/chat/abc")).toBe("abc");
    expect(conversationIdFromHref("/chat?id=abc")).toBe("abc");
    expect(conversationIdFromHref("/connections/chat/xyz")).toBe("dm:xyz");
    expect(conversationIdFromHref("/posts/1")).toBeNull();
  });
});

describe("message reactions", () => {
  it("groups, counts and marks my own reaction", () => {
    const r = [
      { messageId: "m1", userId: "a", emoji: "❤️" as const },
      { messageId: "m1", userId: "b", emoji: "❤️" as const },
      { messageId: "m1", userId: "c", emoji: "👍" as const },
      { messageId: "m2", userId: "a", emoji: "😂" as const },
    ];
    expect(groupReactions(r, "m1", "a")).toEqual([
      { emoji: "❤️", count: 2, mine: true },
      { emoji: "👍", count: 1, mine: false },
    ]);
    expect(groupReactions(r, "m3", "a")).toEqual([]);
  });
});
