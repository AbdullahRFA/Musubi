import type { RequirementTemplate } from "@/lib/types";

/**
 * Quick-post templates. Kept as data so a future admin screen can
 * load the same shape from the requirement_templates table.
 */
export const REQUIREMENT_TEMPLATES: RequirementTemplate[] = [
  {
    id: "tpl-grocery",
    category: "Daily Assistance",
    title: "Grocery shopping",
    description: "Help buying groceries and carrying them home.",
    suggestedExchange: "service",
    skill: "Grocery shopping",
  },
  {
    id: "tpl-medicine",
    category: "Daily Assistance",
    title: "Medicine pickup",
    description: "Help collecting a prescription from the pharmacy.",
    suggestedExchange: "service",
    skill: "Medicine pickup",
  },
  {
    id: "tpl-phone",
    category: "Technology Help",
    title: "Smartphone assistance",
    description: "Patient help learning everyday tasks on a smartphone.",
    suggestedExchange: "knowledge",
    skill: "Smartphone assistance",
  },
  {
    id: "tpl-video",
    category: "Technology Help",
    title: "Video call setup",
    description: "Help joining a video call with family or friends.",
    suggestedExchange: "knowledge",
    skill: "Video call setup",
  },
  {
    id: "tpl-conversation",
    category: "Companionship",
    title: "Conversation",
    description: "A calm conversation over tea or a bench in the park.",
    suggestedExchange: "knowledge",
    skill: "Conversation",
  },
  {
    id: "tpl-walking",
    category: "Companionship",
    title: "Walking companion",
    description: "A walking companion for a short route nearby.",
    suggestedExchange: "knowledge",
    skill: "Walking companion",
  },
  {
    id: "tpl-gardening",
    category: "Home Assistance",
    title: "Gardening",
    description: "Help with light gardening such as weeding or watering.",
    suggestedExchange: "service",
    skill: "Gardening",
  },
  {
    id: "tpl-household",
    category: "Home Assistance",
    title: "Small household tasks",
    description: "Help with a small household task that is hard to do alone.",
    suggestedExchange: "service",
    skill: "Small household tasks",
  },
  {
    id: "tpl-learning",
    category: "Learning",
    title: "Help learning a new skill",
    description: "A patient partner while learning something new.",
    suggestedExchange: "knowledge",
    skill: "Learning together",
  },
];

export function templatesByCategory(category: string) {
  return REQUIREMENT_TEMPLATES.filter((template) => template.category === category);
}

export function templateById(id: string) {
  return REQUIREMENT_TEMPLATES.find((template) => template.id === id) ?? null;
}
