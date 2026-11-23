import { z } from "zod";

const categories = [
  "Cooking",
  "Technology",
  "Arts & Crafts",
  "Gardening",
  "Daily Assistance",
  "Companionship",
  "Community & Local Activities",
] as const;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(4, "Use at least 4 characters. Any password works in this demo."),
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80, "That name is too long."),
  age: z.coerce.number({ invalid_type_error: "Please enter your age as a number." }).min(13, "Must be at least 13 years old.").max(120, "Please enter a valid age."),
  neighborhood: z.string().trim().optional(),
  userGroup: z.enum(["og", "yg"]).optional(),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80),
  email: z.string().trim().email("Enter a valid email address."),
  age: z.coerce.number().min(13).max(120).nullable().optional(),
  userGroup: z.enum(["og", "yg"]).optional(),
  ageGroup: z.enum(["18-29", "30-49", "50-64", "65+"]).or(z.literal("")).optional(),
  location: z.string().trim().min(2, "Choose a location."),
  neighborhoods: z.array(z.string().trim().min(1)).max(5).optional(),
  bio: z.string().trim().max(400, "Please keep your bio under 400 characters."),
  availability: z.string().trim().optional(),
  contactMethod: z.enum(["chat", "phone"]),
  phone: z.string().trim().max(30),
  interests: z.array(z.string().trim().min(1).max(40)).max(12),
  skills: z.array(z.string().trim().min(1).max(40)).max(12),
  servicesOffered: z.array(z.string().trim().min(1).max(40)).max(12),
  servicesNeeded: z.array(z.string().trim().min(1).max(40)).max(12),
}).superRefine((value, ctx) => {
  if (value.contactMethod === "phone" && value.phone.replace(/\D/g, "").length < 6) {
    ctx.addIssue({
      code: "custom",
      path: ["phone"],
      message: "Add a phone number, or choose chat as your contact method.",
    });
  }
});

export const postSchema = z.object({
  title: z.string().trim().min(4, "Add a short title.").max(100),
  description: z.string().trim().min(10, "Add a short description.").max(800),
  category: z.enum(categories),
  skill: z.string().trim().min(2, "Name the skill or service.").max(60),
  location: z.string().trim().min(2, "Choose a location."),
  availability: z.string().trim().min(2, "Choose availability."),
  postType: z.enum(["offer", "request"]).default("request"),
  exchangeMethod: z.enum(["free", "exchange", "paid"]),
  amount: z.number().nullable(),
}).superRefine((value, ctx) => {
  if (value.exchangeMethod === "paid" && (!value.amount || value.amount <= 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["amount"],
      message: "Choose a demo amount. No real money is taken.",
    });
  }
});

export const respondSchema = z.object({
  message: z.string().trim().max(280, "Please keep your note under 280 characters."),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Choose a star rating.").max(5),
  comment: z.string().trim().max(200, "Please keep your comment under 200 characters."),
});

export const reportSchema = z.object({
  reason: z.string().min(2, "Choose a reason."),
});

export const onboardingSchema = z.object({
  age: z.coerce.number().min(13, "Must be at least 13").max(120, "Please enter a valid age").optional(),
  ageGroup: z.enum(["18-29", "30-49", "50-64", "65+"]).optional(),
  location: z.string().optional(),
  neighborhoods: z.array(z.string().trim().min(1)).min(1, "Please select at least 1 neighborhood.").max(5, "Select up to 5 neighborhoods.").optional(),
  availability: z.string().optional(),
  contactMethod: z.enum(["chat", "phone"]),
  skills: z.array(z.string().trim().min(1)).optional(),
  servicesNeeded: z.array(z.string().trim().min(1)).optional(),
  skill: z.string().trim().max(40).optional(),
  need: z.string().trim().max(40).optional(),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type PostValues = z.infer<typeof postSchema>;
export type ReviewValues = z.infer<typeof reviewSchema>;
