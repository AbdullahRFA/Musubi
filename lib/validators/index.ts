import { z } from "zod";
import { MIN_AGE } from "@/lib/constants";

const categories = [
  "Cooking",
  "Technology",
  "Arts & Crafts",
  "Gardening",
  "Daily Assistance",
  "Companionship",
  "Community & Local Activities",
] as const;

/** Shared rule for any NEW password (register, reset, change). Matches Supabase's minimum (6) with headroom. */
const newPassword = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Password is too long.")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number.");

const email = z.string().trim().min(1, "Please enter your email address.").email("Enter a valid email address.");

/** Login only checks that a password was entered — never a length rule. */
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Please enter your password."),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80, "That name is too long."),
  email,
  password: newPassword,
  // Empty input must say "please enter", not "must be at least 13"
  age: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z
      .number({ required_error: "Please enter your age.", invalid_type_error: "Please enter your age as a number." })
      .int("Please enter your age as a whole number.")
      .min(MIN_AGE, `You must be at least ${MIN_AGE} years old to join.`)
      .max(120, "Please enter a valid age.")
  ),
  neighborhood: z.string().trim().optional(),
  userGroup: z.enum(["og", "yg"]).optional(),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80),
  email: z.string().trim().email("Enter a valid email address.").optional(),
  age: z.coerce.number().min(MIN_AGE, `Must be at least ${MIN_AGE}`).max(120).nullable().optional(),
  userGroup: z.enum(["og", "yg"]).optional(),
  ageGroup: z.enum(["18-29", "30-49", "50-64", "65+"]).or(z.literal("")).optional(),
  location: z.string().trim().optional(),
  neighborhoods: z.array(z.string().trim().min(1)).max(5).optional(),
  bio: z.string().trim().max(400, "Please keep your bio under 400 characters.").optional().default(""),
  availability: z.string().trim().optional().default("Flexible"),
  contactMethod: z.enum(["chat", "phone"]).default("chat"),
  phone: z.string().trim().max(30).optional().nullable(),
  interests: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
  skills: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
  servicesOffered: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
  servicesNeeded: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
}).superRefine((value, ctx) => {
  if (value.contactMethod === "phone" && (!value.phone || value.phone.replace(/\D/g, "").length < 6)) {
    ctx.addIssue({
      code: "custom",
      path: ["phone"],
      message: "Add a phone number with at least 6 digits, or choose chat as your contact method.",
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
  age: z.coerce.number().min(MIN_AGE, `Must be at least ${MIN_AGE}`).max(120, "Please enter a valid age").optional(),
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

/* Passwords ---------------------------------------------------------------- */


export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  })
  .refine((v) => !v.currentPassword || v.currentPassword !== v.password, {
    path: ["password"],
    message: "New password must be different from your current password.",
  });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type PostValues = z.infer<typeof postSchema>;
export type ReviewValues = z.infer<typeof reviewSchema>;
