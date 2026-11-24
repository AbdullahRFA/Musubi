import type { Category, PostType, RequirementTemplate } from "@/lib/types";

/**
 * Quick-post templates for Musubi v2.
 * Supports both OFFER and REQUEST workflows across all 6 core categories.
 */
export const REQUIREMENT_TEMPLATES: RequirementTemplate[] = [
  // 1. Cooking
  {
    id: "tpl-cook-request-1",
    category: "Cooking",
    title: "Learn Traditional Japanese Home Cooking & Dashi",
    description: "Looking for an experienced neighbor to teach me traditional homestyle recipes, clear dashi preparation, and meal seasoning.",
    suggestedExchange: "exchange",
    skill: "Cooking Lessons",
    postType: "request",
  },
  {
    id: "tpl-cook-request-2",
    category: "Cooking",
    title: "Need Guidance on Nagasaki Shippoku & Simmered Dishes",
    description: "Seeking a home cook to share family recipes for regional Nagasaki dishes such as braised pork belly (Kakuni) and seasonal simmered fish.",
    suggestedExchange: "exchange",
    skill: "Regional Cooking",
    postType: "request",
  },

  // 2. Technology
  {
    id: "tpl-tech-request-1",
    category: "Technology",
    title: "Looking for Smartphone & Tablet Assistance",
    description: "I would appreciate patient, step-by-step help learning video calls on Zoom, Line messaging, and organizing photo albums on my phone.",
    suggestedExchange: "free",
    skill: "Smartphone Assistance",
    postType: "request",
  },
  {
    id: "tpl-tech-request-2",
    category: "Technology",
    title: "Help with City Ward Digital Procedures & MyNumber",
    description: "Need help navigating local municipal website procedures, setting up digital certificates, or disaster alert applications.",
    suggestedExchange: "free",
    skill: "Digital Applications",
    postType: "request",
  },

  // 3. Arts & Crafts
  {
    id: "tpl-craft-request-1",
    category: "Arts & Crafts",
    title: "Learn Traditional Japanese Calligraphy (Shodo)",
    description: "Eager to learn brush calligraphy basics, proper posture, and kanji stroke techniques from an experienced neighbor.",
    suggestedExchange: "exchange",
    skill: "Calligraphy",
    postType: "request",
  },
  {
    id: "tpl-craft-request-2",
    category: "Arts & Crafts",
    title: "Seeking Traditional Origami Lessons",
    description: "Looking for a neighbor who can teach origami folding techniques from classic peace cranes to decorative seasonal crafts.",
    suggestedExchange: "free",
    skill: "Origami",
    postType: "request",
  },

  // 4. Gardening
  {
    id: "tpl-garden-request-1",
    category: "Gardening",
    title: "Help with Garden Weeding & Pruning",
    description: "Need an energetic helping hand with seasonal garden cleaning, weeding, and moving heavy flowerpots or planters.",
    suggestedExchange: "free",
    skill: "Garden Weeding",
    postType: "request",
  },
  {
    id: "tpl-garden-request-2",
    category: "Gardening",
    title: "Seeking Balcony Plant Care & Bonsai Advice",
    description: "Need practical advice from a gardening enthusiast on soil mixtures, seasonal flower care, and trimming small balcony plants.",
    suggestedExchange: "exchange",
    skill: "Plant Care",
    postType: "request",
  },

  // 5. Daily Assistance
  {
    id: "tpl-daily-request-1",
    category: "Daily Assistance",
    title: "Grocery Shopping & Errand Support",
    description: "Help buying heavy groceries, pantry staples, and carrying bags home from the local supermarket safely.",
    suggestedExchange: "free",
    skill: "Grocery Shopping",
    postType: "request",
  },
  {
    id: "tpl-daily-request-2",
    category: "Daily Assistance",
    title: "Assistance with Seasonal Household Chores",
    description: "Looking for a neighbor to assist with light seasonal household tasks, such as changing high air filters or moving storage boxes.",
    suggestedExchange: "free",
    skill: "Household Assistance",
    postType: "request",
  },

  // 6. Companionship
  {
    id: "tpl-companion-request-1",
    category: "Companionship",
    title: "Looking for a Walking Companion",
    description: "Seeking a friendly walking partner for short, relaxed morning strolls along pleasant neighborhood streets and parks.",
    suggestedExchange: "free",
    skill: "Walking Companion",
    postType: "request",
  },
  {
    id: "tpl-companion-request-2",
    category: "Companionship",
    title: "Afternoon Tea & Relaxed Conversation",
    description: "Seeking a friendly neighbor to share a warm cup of green tea, listen to memories, and enjoy unhurried conversation.",
    suggestedExchange: "free",
    skill: "Friendly Conversation",
    postType: "request",
  },

  // 7. Community & Local Activities
  {
    id: "tpl-community-request-1",
    category: "Community & Local Activities",
    title: "Join Neighborhood Events & Group Activities",
    description: "Looking for friendly neighbors to join local festivals, community gardening, or neighborhood group activities together.",
    suggestedExchange: "free",
    skill: "Community Events",
    postType: "request",
  },
  {
    id: "tpl-community-request-2",
    category: "Community & Local Activities",
    title: "Guide for Neighborhood Historic Walks",
    description: "Looking for a longtime resident to share local stories, historic shrine visits, and community traditions on a scenic walk.",
    suggestedExchange: "free",
    skill: "Local History & Culture",
    postType: "request",
  },
];

export function templatesByCategory(category: Category, postType?: PostType) {
  return REQUIREMENT_TEMPLATES.filter((template) => {
    if (template.category !== category) return false;
    if (postType && template.postType !== postType) return false;
    return true;
  });
}

export function templatesByType(postType: PostType) {
  return REQUIREMENT_TEMPLATES.filter((template) => template.postType === postType);
}

export function templateById(id: string) {
  return REQUIREMENT_TEMPLATES.find((template) => template.id === id) ?? null;
}
