import { describe, expect, it, vi } from "vitest";
import { average, createUuid, formatDay, includesText, initials, money } from "@/lib/utils";
import { getProfileCompletion } from "@/lib/profileCompletion";
import { timeAgo } from "@/components/notifications/notificationStyles";
import type { Profile } from "@/lib/types";

const profile = (over: Partial<Profile> = {}): Profile => ({
  id: "u", email: "a@b.co", fullName: "Hana Sato", avatarUrl: null, age: 68, ageGroup: "65+", location: "Urakami, Nagasaki",
  neighborhoods: ["Urakami, Nagasaki"], lat: null, lng: null, bio: "Retired teacher who loves cooking.", interests: [], skills: ["Origami"],
  servicesOffered: [], servicesNeeded: [], availability: "Flexible", contactMethod: "chat", phone: null, userGroup: "og", createdAt: "2026-01-01", ...over,
});

describe("formatting utilities", () => {
  it("initials", () => {
    expect(initials("Hana Sato")).toBe("HS");
    expect(initials("  ken  ")).toBe("K");
    expect(initials("")).toBe("?");
  });
  it("money is in pounds without decimals", () => expect(money(10)).toBe("£10"));
  it("formatDay", () => expect(formatDay("2026-11-24T10:00:00Z")).toBe("24 Nov 2026"));
  it("average rounds to one decimal and handles empty", () => {
    expect(average([4, 5, 5])).toBe(4.7);
    expect(average([])).toBeNull();
  });
  it("includesText is case-insensitive and trims the query", () => expect(includesText("Smartphone Help", "  phone ")).toBe(true));
  it("createUuid returns RFC 4122 v4 ids", () => {
    const id = createUuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(createUuid()).not.toBe(id);
  });
});

describe("timeAgo", () => {
  it("formats recent times compactly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-24T12:00:00Z"));
    expect(timeAgo("2026-11-24T11:59:30Z")).toBe("now");
    expect(timeAgo("2026-11-24T11:55:00Z")).toBe("5m");
    expect(timeAgo("2026-11-24T09:00:00Z")).toBe("3h");
    expect(timeAgo("2026-11-22T12:00:00Z")).toBe("2d");
    expect(timeAgo("2026-11-01T12:00:00Z")).toBe("1 Nov");
    vi.useRealTimers();
  });
});

describe("profile completion gate", () => {
  it("a complete profile can post", () => expect(getProfileCompletion(profile()).complete).toBe(true));
  it("lists what's missing", () => {
    const r = getProfileCompletion(profile({ bio: "short", skills: [], neighborhoods: [], location: "" }));
    expect(r.complete).toBe(false);
    expect(r.missing.map((m) => m.id).sort()).toEqual(["bio", "neighbourhood", "skills"]);
  });
  it("a need counts instead of a skill", () => expect(getProfileCompletion(profile({ skills: [], servicesNeeded: ["Smartphone"] })).complete).toBe(true));
  it("phone contact needs a number", () => expect(getProfileCompletion(profile({ contactMethod: "phone", phone: null })).complete).toBe(false));
  it("no profile is 0% complete", () => expect(getProfileCompletion(null).percent).toBe(0));
});
