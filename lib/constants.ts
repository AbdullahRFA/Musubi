import type { AgeGroup, Category, ExchangeMethod, UserGroup } from "@/lib/types";

export const CATEGORIES: Category[] = [
  "Cooking",
  "Technology",
  "Arts & Crafts",
  "Gardening",
  "Daily Assistance",
  "Companionship",
  "Community & Local Activities",
];

export const EXCHANGE_METHODS: { value: ExchangeMethod; label: string; hint: string }[] = [
  {
    value: "free",
    label: "Free",
    hint: "Voluntary community support at no cost.",
  },
  {
    value: "exchange",
    label: "Skill Exchange",
    hint: "Trade a skill, cultural knowledge, or practical assistance.",
  },
  {
    value: "paid",
    label: "Paid (Demo)",
    hint: "A simulated payment for demonstration purposes. No real money.",
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
  { name: "Hamamachi, Nagasaki", lat: 32.7431, lng: 129.8797 },
  { name: "Urakami, Nagasaki", lat: 32.7725, lng: 129.8665 },
  { name: "Peace Park, Nagasaki", lat: 32.7767, lng: 129.8633 },
  { name: "Glover Hills, Nagasaki", lat: 32.7335, lng: 129.8702 },
  { name: "Dejima, Nagasaki", lat: 32.7428, lng: 129.8732 },
  { name: "Meganebashi, Nagasaki", lat: 32.7471, lng: 129.8803 },
  { name: "Inasayama, Nagasaki", lat: 32.7531, lng: 129.8516 },
  { name: "Shiroyama, Nagasaki", lat: 32.7667, lng: 129.8552 },
  { name: "Nagasaki Station Area", lat: 32.7533, lng: 129.8709 },
  { name: "Oura, Nagasaki", lat: 32.7344, lng: 129.8711 },
  { name: "Sumiyoshi, Nagasaki", lat: 32.7936, lng: 129.8623 },
  { name: "Sakamoto, Nagasaki", lat: 32.7742, lng: 129.8756 },
];

export const POPULAR_NEIGHBORHOODS = [
  "Hamamachi, Nagasaki",
  "Urakami, Nagasaki",
  "Peace Park, Nagasaki",
  "Glover Hills, Nagasaki",
  "Dejima, Nagasaki",
  "Meganebashi, Nagasaki",
  "Inasayama, Nagasaki",
  "Shiroyama, Nagasaki",
  "Nagasaki Station Area",
  "Oura, Nagasaki",
  "Sumiyoshi, Nagasaki",
  "Sakamoto, Nagasaki",
];

export const SUGGESTED_SKILLS = [
  "Traditional Cooking",
  "Origami",
  "Japanese Calligraphy",
  "Smartphone Assistance",
  "Video Calling (Zoom/LINE)",
  "Gardening & Bonsai",
  "Storytelling & Local History",
  "English Conversation",
  "Japanese Language Practice",
  "Knitting & Sewing",
  "Piano / Guitar Basics",
  "Digital Photography",
  "Woodworking & Crafts",
  "Baking & Pastries",
];

export const SUGGESTED_SERVICES = [
  "Smartphone Guidance",
  "Walking Companion",
  "Grocery Errands",
  "Garden Maintenance & Weeding",
  "Heavy Lifting Assistance",
  "Zoom / Video Call Setup",
  "Traditional Cooking Lessons",
  "Tea & Friendly Chat",
  "Photo Scanning & Backup",
  "Pet Sitting & Dog Walking",
  "App Setup & Troubleshooting",
  "Language Exchange",
];

export const SUGGESTED_INTERESTS = [
  "Gardening",
  "Cooking & Food",
  "Reading",
  "Music",
  "Walking & Nature",
  "Local History",
  "Arts & Crafts",
  "Tea Ceremony",
  "Photography",
  "Languages",
  "Technology",
  "Board Games & Shogi",
  "Volunteering",
  "Festivals & Culture",
];

/**
 * Automatically detects age group and generation group based on age.
 * Rule: 60+ is Older Generation (og), <60 is Younger Generation (yg).
 */
export function detectGeneration(age: number): {
  userGroup: UserGroup;
  label: string;
  shortLabel: string;
  ageGroup: AgeGroup;
} {
  const isOlder = age >= 60;
  const userGroup: UserGroup = isOlder ? "og" : "yg";
  const label = isOlder ? "Older Generation (60+)" : "Younger Generation (<60)";
  const shortLabel = isOlder ? "Older Generation" : "Younger Generation";
  const ageGroup: AgeGroup =
    age >= 65 ? "65+" : age >= 50 ? "50-64" : age >= 30 ? "30-49" : "18-29";
  return { userGroup, label, shortLabel, ageGroup };
}

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
