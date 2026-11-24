import { describe, expect, it } from "vitest";
import { availabilityMatches, formatCustomSlot, joinAvailability, MAX_CUSTOM_SLOTS, parseAvailability } from "@/lib/availability";

describe("availability helpers", () => {
  it("parses a preset on its own", () => {
    expect(parseAvailability("Weekends")).toEqual({ preset: "Weekends", custom: [] });
  });

  it("parses a preset plus custom slots", () => {
    const v = "Weekends; Sat 5 Dec 2026, 14:00–16:30; Mon 7 Dec 2026";
    expect(parseAvailability(v)).toEqual({ preset: "Weekends", custom: ["Sat 5 Dec 2026, 14:00–16:30", "Mon 7 Dec 2026"] });
  });

  it("treats empty / null as no preset and no slots", () => {
    expect(parseAvailability("")).toEqual({ preset: null, custom: [] });
    expect(parseAvailability(null)).toEqual({ preset: null, custom: [] });
  });

  it("joins back to the stored string and falls back to Flexible when empty", () => {
    expect(joinAvailability("Weekends", ["Sat 5 Dec 2026"])).toBe("Weekends; Sat 5 Dec 2026");
    expect(joinAvailability(null, [])).toBe("Flexible");
  });

  it("round-trips parse → join", () => {
    const v = "Weekday mornings; Tue 1 Dec 2026, from 09:00";
    const { preset, custom } = parseAvailability(v);
    expect(joinAvailability(preset, custom)).toBe(v);
  });

  it("formats a custom slot with day, month, year and times", () => {
    expect(formatCustomSlot("2026-12-05", "14:00", "16:30")).toBe("Sat 5 Dec 2026, 14:00–16:30");
    expect(formatCustomSlot("2026-12-05", "14:00")).toBe("Sat 5 Dec 2026, from 14:00");
    expect(formatCustomSlot("2026-12-05")).toBe("Sat 5 Dec 2026");
  });

  it("is not shifted by the local time zone", () => {
    // 1 Jan must stay 1 Jan whatever the machine's offset
    expect(formatCustomSlot("2027-01-01")).toBe("Fri 1 Jan 2027");
  });

  it("matches filters against presets and weekend slots", () => {
    expect(availabilityMatches("Weekends", "Weekends")).toBe(true);
    expect(availabilityMatches("Flexible; Sun 6 Dec 2026", "Weekends")).toBe(true);
    expect(availabilityMatches("Mon 7 Dec 2026", "Weekends")).toBe(false);
    expect(availabilityMatches("Weekday mornings", "Weekends")).toBe(false);
    expect(availabilityMatches("anything", "")).toBe(true);
  });

  it("caps custom slots at a sensible number", () => {
    expect(MAX_CUSTOM_SLOTS).toBeGreaterThan(0);
  });
});
