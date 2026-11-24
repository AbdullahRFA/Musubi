import { describe, expect, it } from "vitest";
import { changePasswordSchema, loginSchema, postSchema, profileSchema, registerSchema, reviewSchema } from "@/lib/validators";
import { detectGeneration, MIN_AGE } from "@/lib/constants";

const validPost = {
  title: "Help with video calls",
  description: "Please show me how to video call my family.",
  category: "Technology",
  skill: "Video calls",
  location: "Urakami, Nagasaki",
  availability: "Weekends; Sat 5 Dec 2026, 14:00–16:30",
  postType: "request",
  exchangeMethod: "free",
  amount: null,
};

describe("register validation", () => {
  const base = { fullName: "Hana Sato", email: "hana@example.com", password: "DemoPass2026", age: "68" };
  it("accepts a valid member", () => expect(registerSchema.safeParse(base).success).toBe(true));
  it(`rejects anyone under ${MIN_AGE}`, () => expect(registerSchema.safeParse({ ...base, age: String(MIN_AGE - 1) }).success).toBe(false));
  it(`accepts exactly ${MIN_AGE}`, () => expect(registerSchema.safeParse({ ...base, age: String(MIN_AGE) }).success).toBe(true));
  it("asks for the age when empty", () => {
    const r = registerSchema.safeParse({ ...base, age: "" });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain("Please enter your age.");
  });
  it("needs a letter and a number in the password", () => {
    expect(registerSchema.safeParse({ ...base, password: "onlyletters" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "12345678" }).success).toBe(false);
  });
});

describe("login validation", () => {
  it("never applies a length rule to existing passwords", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});

describe("post validation", () => {
  it("accepts a valid post with custom availability", () => expect(postSchema.safeParse(validPost).success).toBe(true));
  it("requires an amount for paid posts", () => {
    expect(postSchema.safeParse({ ...validPost, exchangeMethod: "paid", amount: null }).success).toBe(false);
    expect(postSchema.safeParse({ ...validPost, exchangeMethod: "paid", amount: 10 }).success).toBe(true);
  });
  it("rejects unknown categories", () => expect(postSchema.safeParse({ ...validPost, category: "Other" }).success).toBe(false));
});

describe("profile validation", () => {
  it("requires a phone number for phone contact", () => {
    expect(profileSchema.safeParse({ fullName: "Hana", contactMethod: "phone", phone: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ fullName: "Hana", contactMethod: "phone", phone: "095-822-1004" }).success).toBe(true);
  });
  it("allows the age to be left empty", () => {
    expect(profileSchema.safeParse({ fullName: "Hana", contactMethod: "chat", age: null }).success).toBe(true);
  });
});

describe("other forms", () => {
  it("review needs 1–5 stars", () => {
    expect(reviewSchema.safeParse({ rating: 0, comment: "" }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: 5, comment: "Great" }).success).toBe(true);
  });
  it("new password must differ from the current one", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "Abc12345", password: "Abc12345", confirmPassword: "Abc12345" }).success).toBe(false);
  });
});

describe("generation detection", () => {
  it("60+ is Older Generation, under 60 Younger", () => {
    expect(detectGeneration(60).userGroup).toBe("og");
    expect(detectGeneration(59).userGroup).toBe("yg");
  });
  it("puts every allowed age in a sensible age group", () => {
    expect(detectGeneration(68).ageGroup).toBe("65+");
    expect(detectGeneration(21).ageGroup).toBe("18-29");
    // Members can join from 15, so a 15-year-old must not be labelled 18–29
    expect(detectGeneration(15).ageGroup).toBeNull();
    expect(detectGeneration(18).ageGroup).toBe("18-29");
  });
});
