"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import type { Profile, UserGroup } from "@/lib/types";
import { createId } from "@/lib/utils";
import { ServiceError, requireUser } from "@/lib/services/shared";
import { detectGeneration, placeByName } from "@/lib/constants";

export function useSession() {
  const userId = useAppStore((state) => state.sessionUserId);
  const users = useAppStore((state) => state.users);
  if (!userId) return null;
  return users.find((user) => user.id === userId) ?? null;
}

function blankProfile(input: {
  email: string;
  fullName: string;
  userGroup?: UserGroup;
  age?: number | null;
  neighborhood?: string;
  neighborhoods?: string[];
}): Profile {
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

  return {
    id: createId("u"),
    email: input.email,
    fullName: input.fullName,
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
}

export async function signIn(email: string, _password: string) {
  const normalized = email.trim().toLowerCase();
  const existing = useAppStore.getState().users.find((user) => user.email === normalized);
  const user =
    existing ??
    blankProfile({
      email: normalized,
      fullName: normalized.split("@")[0] || "New member",
      userGroup: "yg",
    });
  if (!existing) {
    useAppStore.setState((state) => ({ users: [...state.users, user] }));
  }
  useAppStore.setState({ sessionUserId: user.id });
  return user;
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  age?: number;
  neighborhood?: string;
  neighborhoods?: string[];
  userGroup?: UserGroup;
}) {
  const normalized = input.email.trim().toLowerCase();
  const taken = useAppStore.getState().users.some((user) => user.email === normalized);
  if (taken) {
    throw new ServiceError("That email is already registered. Please log in.");
  }
  if (input.password.trim().length < 4) {
    throw new ServiceError("Use at least 4 characters. Any password works in this demo.");
  }
  const user = blankProfile({
    email: normalized,
    fullName: input.fullName.trim(),
    age: input.age,
    neighborhood: input.neighborhood,
    neighborhoods: input.neighborhoods,
    userGroup: input.userGroup,
  });
  useAppStore.setState((state) => ({
    users: [...state.users, user],
    sessionUserId: user.id,
  }));
  return user;
}

export async function signOut() {
  useAppStore.setState({ sessionUserId: null });
}

export async function updateAccount(input: { fullName: string; email: string; userGroup: UserGroup }) {
  const me = requireUser();
  const email = input.email.trim().toLowerCase();
  const taken = useAppStore
    .getState()
    .users.some((user) => user.email === email && user.id !== me.id);
  if (taken) throw new ServiceError("That email is already used by another member.");
  const next: Profile = {
    ...me,
    fullName: input.fullName.trim(),
    email,
    userGroup: input.userGroup,
  };
  useAppStore.setState((state) => ({
    users: state.users.map((user) => (user.id === me.id ? next : user)),
  }));
  return next;
}
