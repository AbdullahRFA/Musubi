"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Profile } from "@/lib/types";

export const MIN_BIO_LENGTH = 20;

export interface CompletionItem {
  id: "name" | "age" | "neighbourhood" | "bio" | "skills" | "phone";
  label: string;
  done: boolean;
}

/**
 * What a member must fill in before they can publish posts. Kept in one place
 * so the UI gate and the createPost() guard always agree.
 */
export function getProfileCompletion(profile: Profile | null | undefined) {
  const neighbourhoods = profile?.neighborhoods?.length ? profile.neighborhoods : profile?.location ? [profile.location] : [];
  const items: CompletionItem[] = [
    { id: "name", label: "Your full name", done: (profile?.fullName?.trim().length ?? 0) >= 2 },
    { id: "age", label: "Your age", done: typeof profile?.age === "number" && profile.age >= 13 },
    { id: "neighbourhood", label: "At least one neighbourhood", done: neighbourhoods.length > 0 },
    {
      id: "bio",
      label: `A short bio (at least ${MIN_BIO_LENGTH} characters)`,
      done: (profile?.bio?.trim().length ?? 0) >= MIN_BIO_LENGTH,
    },
    {
      id: "skills",
      label: "At least one skill you can share or help you need",
      done: (profile?.skills?.length ?? 0) + (profile?.servicesNeeded?.length ?? 0) > 0,
    },
  ];
  if (profile?.contactMethod === "phone") {
    items.push({ id: "phone", label: "Your phone number (you chose phone contact)", done: Boolean(profile.phone?.trim()) });
  }
  const doneCount = items.filter((i) => i.done).length;
  return {
    items,
    missing: items.filter((i) => !i.done),
    complete: doneCount === items.length,
    percent: Math.round((doneCount / items.length) * 100),
  };
}

/**
 * Completion for the signed-in member. `ready` is false until the real profile
 * row has loaded (useSession() returns a placeholder before that), so the UI
 * never flashes a "complete your profile" prompt for complete members.
 */
export function useProfileCompletion() {
  const userId = useAppStore((s) => s.sessionUserId);
  const profile = useAppStore((s) => s.users.find((u) => u.id === s.sessionUserId) ?? null);
  return useMemo(
    () => ({ ready: Boolean(userId && profile), signedIn: Boolean(userId), ...getProfileCompletion(profile) }),
    [userId, profile]
  );
}
