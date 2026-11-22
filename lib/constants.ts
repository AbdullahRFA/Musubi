import type { AgeGroup, Category, ExchangeMethod, UserGroup } from "@/lib/types";

export const CATEGORIES: Category[] = [
  "Daily Assistance",
  "Technology Help",
  "Companionship",
  "Home Assistance",
  "Learning",
];

export const EXCHANGE_METHODS: { value: ExchangeMethod; label: string; hint: string }[] = [
  {
    value: "knowledge",
    label: "Knowledge exchange",
    hint: "Share experience, stories, or a skill.",
  },
  {
    value: "service",
    label: "Service exchange",
    hint: "Trade a practical helping hand.",
  },
  {
    value: "payment",
    label: "Monetary payment",
    hint: "A demo amount only. No real money.",
  },
];

export const AGE_GROUPS: AgeGroup[] = ["18-29", "30-49", "50-64", "65+"];

export const AVAILABILITY = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekday evenings",
  "Weekends",
  "Flexible",
];

export const PLACES: { name: string; lat: number; lng: number }[] = [
  { name: "Maple Hill", lat: 51.5074, lng: -0.1278 },
  { name: "Harbor Town", lat: 51.5155, lng: -0.0922 },
  { name: "Riverside", lat: 51.5033, lng: -0.1195 },
  { name: "Cedar Park", lat: 51.521, lng: -0.141 },
  { name: "Oak Lane", lat: 51.495, lng: -0.105 },
];

export const REPORT_REASONS = [
  "Spam or misleading",
  "Harassment or unkind behaviour",
  "Scam or suspicious payment",
  "Inappropriate content",
  "Safety concern",
  "Other",
];

export const DEMO_AMOUNTS = [10, 15, 20, 25];

export const SAFETY_TEXT =
  "Completed activities and ratings help you decide but are not a guarantee of safety.";

export const DEMO_PAYMENT_BANNER = "DEMO payment – no real money is processed.";

export const GROUP_LABEL: Record<UserGroup, string> = {
  og: "Older Generation (O.G.)",
  yg: "Younger Generation (Y.G.)",
};

export function placeByName(name: string) {
  return PLACES.find((place) => place.name === name) ?? null;
}

export function exchangeLabel(method: string) {
  return EXCHANGE_METHODS.find((item) => item.value === method)?.label ?? method;
}

export function groupShort(group: UserGroup) {
  return group === "og" ? "O.G." : "Y.G.";
}
