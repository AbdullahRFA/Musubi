import { AVAILABILITY } from "@/lib/constants";

/**
 * Availability is stored as one readable string so existing data keeps
 * working. A member can pick one general preset ("Weekends") and add specific
 * dates/times, all joined with "; ", e.g.
 *   "Weekends; Sat 30 Nov 2026, 14:00–16:00; Mon 2 Dec 2026, from 10:00"
 */
export const SLOT_SEPARATOR = "; ";
export const MAX_CUSTOM_SLOTS = 5;

export function parseAvailability(value: string | null | undefined) {
  const parts = (value ?? "")
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  const preset = parts.find((p) => AVAILABILITY.includes(p)) ?? null;
  const custom = parts.filter((p) => !AVAILABILITY.includes(p));
  return { preset, custom };
}

export function joinAvailability(preset: string | null, custom: string[]) {
  const joined = [preset, ...custom].filter(Boolean).join(SLOT_SEPARATOR);
  return joined || "Flexible";
}

/** "2026-11-30", "14:00", "16:00" → "Sat 30 Nov 2026, 14:00–16:00" */
export function formatCustomSlot(date: string, start?: string, end?: string) {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(y, m - 1, d)))
    .replace(",", "");
  if (start && end) return `${day}, ${start}–${end}`;
  if (start) return `${day}, from ${start}`;
  return day;
}

/** True when any of a member's/post's availability slots matches the filter. */
export function availabilityMatches(value: string | null | undefined, filter: string) {
  if (!filter) return true;
  const { preset, custom } = parseAvailability(value);
  if (preset === filter) return true;
  // A specific Saturday/Sunday slot also counts as "Weekends"
  if (filter === "Weekends") return custom.some((slot) => /^(Sat|Sun)\b/.test(slot));
  return false;
}
