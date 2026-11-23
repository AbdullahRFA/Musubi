import type { Category, PostType, RequirementTemplate } from "@/lib/types";

/**
 * Quick-post templates for Tsunagu Generations v2.
 * Supports both OFFER and REQUEST workflows across all 6 core categories.
 */
export const REQUIREMENT_TEMPLATES: RequirementTemplate[] = [
  // 1. Cooking
  {
    id: "tpl-cook-offer",
    category: "Cooking",
    title: "Traditional Japanese Cooking Lessons",
    description: "I can share family recipes, dashi stock preparation, and seasonal home-style Japanese cooking.",
    suggestedExchange: "exchange",
    skill: "Japanese Cooking",
    postType: "offer",
  },
  {
    id: "tpl-cook-request",
    category: "Cooking",
    title: "Learn Japanese Home Cooking",
    description: "Looking for an experienced neighbor to teach me traditional home recipes and meal seasoning.",
    suggestedExchange: "exchange",
    skill: "Cooking Lessons",
    postType: "request",
  },

  // 2. Technology
  {
    id: "tpl-tech-offer",
    category: "Technology",
    title: "Smartphone & Tablet Guidance",
    description: "Patient, step-by-step assistance with smartphone setup, line messaging, camera tips, and apps.",
    suggestedExchange: "free",
    skill: "Smartphone Guidance",
    postType: "offer",
  },
  {
    id: "tpl-tech-request",
    category: "Technology",
    title: "Looking for Smartphone Assistance",
    description: "I would appreciate patient help learning video calls on Zoom and organizing photo albums on my phone.",
    suggestedExchange: "free",
    skill: "Smartphone Assistance",
    postType: "request",
  },

  // 3. Arts & Crafts
  {
    id: "tpl-craft-offer",
    category: "Arts & Crafts",
    title: "Traditional Origami Lessons",
    description: "I can teach origami folding techniques from classic peace cranes to decorative seasonal crafts.",
    suggestedExchange: "free",
    skill: "Origami",
    postType: "offer",
  },
  {
    id: "tpl-craft-request",
    category: "Arts & Crafts",
    title: "Learn Traditional Japanese Calligraphy",
    description: "Eager to learn brush calligraphy (Shodo) basics and kanji stroke techniques from a master.",
    suggestedExchange: "exchange",
    skill: "Calligraphy",
    postType: "request",
  },

  // 4. Gardening
  {
    id: "tpl-garden-offer",
    category: "Gardening",
    title: "Balcony Plant Care & Gardening Wisdom",
    description: "Experienced in small-space gardening, bonsai trimming, and vegetable care. Glad to share tips.",
    suggestedExchange: "exchange",
    skill: "Plant Care",
    postType: "offer",
  },
  {
    id: "tpl-garden-request",
    category: "Gardening",
    title: "Help with Garden Weeding & Pruning",
    description: "Need an energetic helping hand with seasonal garden cleaning, weeding, and moving flowerpots.",
    suggestedExchange: "free",
    skill: "Garden Weeding",
    postType: "request",
  },

  // 5. Daily Assistance
  {
    id: "tpl-daily-offer",
    category: "Daily Assistance",
    title: "Grocery Pickup & Neighborhood Errands",
    description: "I can pick up groceries, packages, or daily necessities during my regular supermarket runs.",
    suggestedExchange: "free",
    skill: "Grocery Errands",
    postType: "offer",
  },
  {
    id: "tpl-daily-request",
    category: "Daily Assistance",
    title: "Grocery Shopping & Errand Support",
    description: "Help buying heavy groceries and carrying bags home from the local market safely.",
    suggestedExchange: "free",
    skill: "Grocery Shopping",
    postType: "request",
  },

  // 6. Companionship
  {
    id: "tpl-companion-offer",
    category: "Companionship",
    title: "Afternoon Tea & Relaxed Conversation",
    description: "Happy to sit down for a warm cup of green tea, listen to memories, and share pleasant conversation.",
    suggestedExchange: "free",
    skill: "Friendly Conversation",
    postType: "offer",
  },
  {
    id: "tpl-companion-request",
    category: "Companionship",
    title: "Looking for a Walking Companion",
    description: "Seeking a friendly walking partner for short, relaxed morning strolls along pleasant neighborhood streets.",
    suggestedExchange: "free",
    skill: "Walking Companion",
    postType: "request",
  },

  // 7. Community & Local Activities
  {
    id: "tpl-community-offer",
    category: "Community & Local Activities",
    title: "Neighborhood Walking Tour & Cultural History",
    description: "I love sharing the history, local shrines, and hidden spots of our neighborhood with interested neighbors.",
    suggestedExchange: "free",
    skill: "Local History & Culture",
    postType: "offer",
  },
  {
    id: "tpl-community-request",
    category: "Community & Local Activities",
    title: "Join Neighborhood Events & Group Activities",
    description: "Looking for friendly neighbors to join local festivals, community gardening, or neighborhood group activities together.",
    suggestedExchange: "free",
    skill: "Community Events",
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
