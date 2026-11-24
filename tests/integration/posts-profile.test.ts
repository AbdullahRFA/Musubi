import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeSupabase, opsOn } from "./fakeSupabase";
import { emptyState, member } from "./setup";

let fake = makeFakeSupabase();
vi.mock("@/lib/supabase/client", () => ({ createClient: () => fake }));

import { useAppStore } from "@/lib/store/useAppStore";
import { createPost } from "@/lib/services/postService";
import { updateProfile } from "@/lib/services/profileService";

const input = {
  title: "Help me video call", description: "Please teach me how to video call.", category: "Technology" as const, skill: "Video calls",
  location: "Takaomachi, Nagasaki", availability: "Weekends; Sat 5 Dec 2026, 14:00–16:30", postType: "request" as const,
  exchangeMethod: "free" as const, amount: null, templateId: null,
};

beforeEach(() => {
  fake = makeFakeSupabase();
  useAppStore.setState({ ...emptyState(), users: [member("hana", { location: "Takaomachi, Nagasaki", lat: 32.78, lng: 129.88 })], sessionUserId: "hana" }, true);
});

describe("creating posts", () => {
  it("is blocked until the profile is complete", async () => {
    useAppStore.setState({ users: [member("hana", { bio: "", skills: [] })] });
    await expect(createPost(input)).rejects.toThrow(/complete your profile/);
    expect(opsOn(fake, "posts")).toHaveLength(0);
  });

  it("uses the member's own pin when posting at their own location", async () => {
    await createPost(input);
    expect(opsOn(fake, "posts", "insert")[0].payload).toMatchObject({ location: "Takaomachi, Nagasaki", lat: 32.78, lng: 129.88, availability: input.availability });
  });

  it("uses the area's centre for a known neighbourhood", async () => {
    await createPost({ ...input, location: "Urakami, Nagasaki" });
    expect(opsOn(fake, "posts", "insert")[0].payload).toMatchObject({ lat: 32.7725, lng: 129.8665 });
  });

  it("never stores an amount on free posts", async () => {
    await createPost({ ...input, amount: 25 as any });
    expect(opsOn(fake, "posts", "insert")[0].payload.amount).toBeNull();
  });
});

describe("saving the profile", () => {
  it("saves a pin set by the member", async () => {
    const p = await updateProfile({ location: "Hiranomachi, Nagasaki", neighborhoods: ["Hiranomachi, Nagasaki"], lat: 32.77, lng: 129.86 });
    expect(p).toMatchObject({ location: "Hiranomachi, Nagasaki", lat: 32.77, lng: 129.86 });
  });

  it("clearing the pin on a custom area really clears it", async () => {
    const p = await updateProfile({ location: "Takaomachi, Nagasaki", lat: null, lng: null });
    expect(p.lat).toBeNull();
    expect(p.lng).toBeNull();
  });

  it("keeps the existing pin when the location isn't touched", async () => {
    const p = await updateProfile({ bio: "Updated bio for my neighbours." });
    expect(p).toMatchObject({ lat: 32.78, lng: 129.88 });
  });

  it("sets the generation from the age, and no stored age group for 15–17", async () => {
    expect(await updateProfile({ age: 16 })).toMatchObject({ userGroup: "yg", ageGroup: null });
    expect(await updateProfile({ age: 72 })).toMatchObject({ userGroup: "og", ageGroup: "65+" });
  });

  it("drops the phone number when switching to chat-only", async () => {
    useAppStore.setState({ users: [member("hana", { contactMethod: "phone", phone: "095-000-0000" })] });
    expect((await updateProfile({ contactMethod: "chat" })).phone).toBeNull();
  });
});
