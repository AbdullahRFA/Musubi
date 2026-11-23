"use client";

import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Profile, UserGroup } from "@/lib/types";
import { ServiceError, requireUser } from "@/lib/services/shared";
import { detectGeneration, placeByName } from "@/lib/constants";

/**
 * Maps Supabase snake_case profiles table row to the domain Profile type
 */
export function rowToProfile(row: any): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || "",
    avatarUrl: row.avatar_url ?? null,
    age: row.age ?? null,
    ageGroup: row.age_group ?? null,
    location: row.location ?? "",
    neighborhoods: row.neighborhoods && Array.isArray(row.neighborhoods) && row.neighborhoods.length > 0
      ? row.neighborhoods
      : row.location
      ? [row.location]
      : [],
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    bio: row.bio ?? "",
    interests: row.interests ?? [],
    skills: row.skills ?? [],
    servicesOffered: row.services_offered ?? [],
    servicesNeeded: row.services_needed ?? [],
    availability: row.availability ?? "Flexible",
    contactMethod: row.contact_method ?? "chat",
    phone: row.phone ?? null,
    userGroup: (row.user_group as UserGroup) || "yg",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/**
 * Maps domain Profile fields to Supabase snake_case columns
 */
export function profileToRow(profile: Partial<Profile>): Record<string, any> {
  const row: Record<string, any> = {};
  if (profile.id !== undefined) row.id = profile.id;
  if (profile.email !== undefined) row.email = profile.email;
  if (profile.fullName !== undefined) row.full_name = profile.fullName;
  if (profile.avatarUrl !== undefined) row.avatar_url = profile.avatarUrl;
  if (profile.age !== undefined) row.age = profile.age;
  if (profile.ageGroup !== undefined) row.age_group = profile.ageGroup;
  if (profile.location !== undefined) row.location = profile.location;
  if (profile.neighborhoods !== undefined) row.neighborhoods = profile.neighborhoods;
  if (profile.lat !== undefined) row.lat = profile.lat;
  if (profile.lng !== undefined) row.lng = profile.lng;
  if (profile.bio !== undefined) row.bio = profile.bio;
  if (profile.interests !== undefined) row.interests = profile.interests;
  if (profile.skills !== undefined) row.skills = profile.skills;
  if (profile.servicesOffered !== undefined) row.services_offered = profile.servicesOffered;
  if (profile.servicesNeeded !== undefined) row.services_needed = profile.servicesNeeded;
  if (profile.availability !== undefined) row.availability = profile.availability;
  if (profile.contactMethod !== undefined) row.contact_method = profile.contactMethod;
  if (profile.phone !== undefined) row.phone = profile.phone;
  if (profile.userGroup !== undefined) row.user_group = profile.userGroup;
  row.updated_at = new Date().toISOString();
  return row;
}

/**
 * Helper to sync the current user profile into the in-memory store
 */
export function syncSessionUser(profile: Profile) {
  useAppStore.setState((state) => {
    const exists = state.users.some((u) => u.id === profile.id);
    return {
      sessionUserId: profile.id,
      users: exists ? state.users.map((u) => (u.id === profile.id ? profile : u)) : [...state.users, profile],
    };
  });
}

/**
 * React hook to get the current authenticated session user profile
 */
export function useSession(): Profile | null {
  const userId = useAppStore((state) => state.sessionUserId);
  const users = useAppStore((state) => state.users);
  if (!userId) return null;
  return users.find((user) => user.id === userId) ?? null;
}

/**
 * Sign in using Supabase Auth
 */
export async function signIn(email: string, password: string): Promise<Profile> {
  const normalized = email.trim().toLowerCase();
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error) {
    throw new ServiceError(error.message || "Invalid email or password.");
  }

  if (!data.user) {
    throw new ServiceError("Failed to authenticate user.");
  }

  // Fetch user profile from Supabase
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profileRow) {
    // If profile row doesn't exist yet, construct and insert a fallback profile
    const fallbackProfile: Profile = {
      id: data.user.id,
      email: normalized,
      fullName: data.user.user_metadata?.full_name || normalized.split("@")[0] || "Member",
      avatarUrl: data.user.user_metadata?.avatar_url || null,
      age: data.user.user_metadata?.age ?? null,
      ageGroup: data.user.user_metadata?.age_group ?? null,
      location: data.user.user_metadata?.location || "",
      neighborhoods: data.user.user_metadata?.neighborhoods || [],
      lat: null,
      lng: null,
      bio: "",
      interests: [],
      skills: [],
      servicesOffered: [],
      servicesNeeded: [],
      availability: "Flexible",
      contactMethod: "chat",
      phone: null,
      userGroup: (data.user.user_metadata?.user_group as UserGroup) || "yg",
      createdAt: data.user.created_at || new Date().toISOString(),
    };

    await supabase.from("profiles").upsert(profileToRow(fallbackProfile));
    syncSessionUser(fallbackProfile);
    return fallbackProfile;
  }

  const profile = rowToProfile(profileRow);
  syncSessionUser(profile);
  return profile;
}

/**
 * Sign up a new user using Supabase Auth and create their profile
 */
export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  age?: number;
  neighborhood?: string;
  neighborhoods?: string[];
  userGroup?: UserGroup;
}): Promise<Profile> {
  const normalized = input.email.trim().toLowerCase();

  if (input.password.trim().length < 6) {
    throw new ServiceError("Password must be at least 6 characters.");
  }

  const age = input.age ?? null;
  let userGroup = input.userGroup || "yg";
  let ageGroup = null;

  if (age !== null && age !== undefined) {
    const gen = detectGeneration(age);
    userGroup = gen.userGroup;
    ageGroup = gen.ageGroup;
  }

  const neighborhoods = input.neighborhoods ?? (input.neighborhood ? [input.neighborhood] : []);
  const location = neighborhoods[0] || input.neighborhood || "";
  const place = placeByName(location);

  const supabase = createClient();

  // 1. Create auth user in Supabase
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        age,
        age_group: ageGroup,
        user_group: userGroup,
        location,
        neighborhoods,
      },
    },
  });

  if (error) {
    throw new ServiceError(error.message || "Failed to create account.");
  }

  if (!data.user) {
    throw new ServiceError("Registration failed. Please try again.");
  }

  // 2. Build initial Profile
  const profile: Profile = {
    id: data.user.id,
    email: normalized,
    fullName: input.fullName.trim(),
    avatarUrl: null,
    age,
    ageGroup,
    location,
    neighborhoods,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    bio: "",
    interests: [],
    skills: [],
    servicesOffered: [],
    servicesNeeded: [],
    availability: "Flexible",
    contactMethod: "chat",
    phone: null,
    userGroup,
    createdAt: new Date().toISOString(),
  };

  // 3. Upsert profile into public.profiles table
  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert(profileToRow(profile));

  if (upsertError) {
    console.warn("Could not insert profile immediately:", upsertError.message);
  }

  syncSessionUser(profile);
  return profile;
}

/**
 * Sign in / Sign up with Google OAuth
 */
export async function signInWithGoogle(): Promise<void> {
  const supabase = createClient();
  const redirectTo = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : undefined;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new ServiceError(error.message || "Failed to start Google sign-in.");
  }
}

/**
 * Sign out of Supabase
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  useAppStore.setState({ sessionUserId: null });
}

/**
 * Update basic account details (name, email, user group)
 */
export async function updateAccount(input: {
  fullName: string;
  email: string;
  userGroup: UserGroup;
}): Promise<Profile> {
  const me = requireUser();
  const email = input.email.trim().toLowerCase();
  const supabase = createClient();

  // If email changed, update auth.users
  if (email !== me.email) {
    const { error: authError } = await supabase.auth.updateUser({ email });
    if (authError) throw new ServiceError(authError.message);
  }

  const next: Profile = {
    ...me,
    fullName: input.fullName.trim(),
    email,
    userGroup: input.userGroup,
  };

  const { error } = await supabase
    .from("profiles")
    .update(profileToRow({ fullName: next.fullName, email: next.email, userGroup: next.userGroup }))
    .eq("id", me.id);

  if (error) {
    throw new ServiceError(error.message || "Failed to update account.");
  }

  syncSessionUser(next);
  return next;
}
