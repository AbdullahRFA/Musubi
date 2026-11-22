"use client";

import { useMemo } from "react";
import { placeByName } from "@/lib/constants";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Need, Profile, PublicProfile, Skill } from "@/lib/types";
import { average } from "@/lib/utils";
import { useSession } from "@/lib/services/authService";
import { hiddenFrom, requireUser, ServiceError } from "@/lib/services/shared";

export type ProfilePatch = Partial<
  Pick<
    Profile,
    | "fullName"
    | "email"
    | "userGroup"
    | "ageGroup"
    | "location"
    | "bio"
    | "interests"
    | "skills"
    | "servicesOffered"
    | "servicesNeeded"
    | "availability"
    | "contactMethod"
    | "phone"
    | "avatarUrl"
  >
>;

function connected(stateUserIds: { a: string; b: string }, requests: { requesterId: string; ownerId: string; status: string }[]) {
  return requests.some(
    (request) =>
      (request.status === "accepted" || request.status === "completed") &&
      ((request.requesterId === stateUserIds.a && request.ownerId === stateUserIds.b) ||
        (request.requesterId === stateUserIds.b && request.ownerId === stateUserIds.a)),
  );
}

export function toPublicProfile(user: Profile, viewerId: string | null): PublicProfile {
  const state = useAppStore.getState();
  const received = state.reviews.filter((review) => review.revieweeId === user.id);
  const phoneShared = Boolean(
    viewerId &&
      viewerId !== user.id &&
      user.contactMethod === "phone" &&
      user.phone &&
      connected({ a: viewerId, b: user.id }, state.requests),
  );
  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    ageGroup: user.ageGroup,
    location: user.location,
    lat: user.lat,
    lng: user.lng,
    bio: user.bio,
    interests: user.interests,
    skills: user.skills,
    servicesOffered: user.servicesOffered,
    servicesNeeded: user.servicesNeeded,
    availability: user.availability,
    contactMethod: user.contactMethod,
    userGroup: user.userGroup,
    createdAt: user.createdAt,
    phone: phoneShared ? user.phone : null,
    phoneShared,
    averageRating: average(received.map((review) => review.rating)),
    reviewCount: received.length,
    completedCount: state.activities.filter((activity) => activity.participantIds.includes(user.id)).length,
  };
}

export function listSkillRows(userId: string): Skill[] {
  const user = useAppStore.getState().users.find((item) => item.id === userId);
  if (!user) return [];
  return user.skills.map((name, index) => ({ id: `${userId}-skill-${index}-${name}`, userId, name }));
}

export function listNeedRows(userId: string): Need[] {
  const user = useAppStore.getState().users.find((item) => item.id === userId);
  if (!user) return [];
  return user.servicesNeeded.map((name, index) => ({ id: `${userId}-need-${index}-${name}`, userId, name }));
}

export function useProfile(id: string | null) {
  const users = useAppStore((state) => state.users);
  const blocks = useAppStore((state) => state.blocks);
  const viewerId = useAppStore((state) => state.sessionUserId);
  return useMemo(() => {
    if (!id) return null;
    const user = users.find((item) => item.id === id);
    if (!user) return null;
    if (hiddenFrom(blocks, viewerId, user.id)) return null;
    return user;
  }, [blocks, id, users, viewerId]);
}

export function usePublicProfile(id: string) {
  const users = useAppStore((state) => state.users);
  const reviews = useAppStore((state) => state.reviews);
  const activities = useAppStore((state) => state.activities);
  const requests = useAppStore((state) => state.requests);
  const blocks = useAppStore((state) => state.blocks);
  const viewer = useSession();
  return useMemo(() => {
    const user = users.find((item) => item.id === id);
    if (!user) return null;
    if (viewer && hiddenFrom(blocks, viewer.id, user.id)) return null;
    const received = reviews.filter((review) => review.revieweeId === user.id);
    const phoneShared = Boolean(
      viewer &&
        viewer.id !== user.id &&
        user.contactMethod === "phone" &&
        user.phone &&
        requests.some(
          (request) =>
            (request.status === "accepted" || request.status === "completed") &&
            ((request.requesterId === viewer.id && request.ownerId === user.id) ||
              (request.requesterId === user.id && request.ownerId === viewer.id)),
        ),
    );
    const profile: PublicProfile = {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      ageGroup: user.ageGroup,
      location: user.location,
      lat: user.lat,
      lng: user.lng,
      bio: user.bio,
      interests: user.interests,
      skills: user.skills,
      servicesOffered: user.servicesOffered,
      servicesNeeded: user.servicesNeeded,
      availability: user.availability,
      contactMethod: user.contactMethod,
      userGroup: user.userGroup,
      createdAt: user.createdAt,
      phone: phoneShared ? user.phone : null,
      phoneShared,
      averageRating: average(received.map((review) => review.rating)),
      reviewCount: received.length,
      completedCount: activities.filter((activity) => activity.participantIds.includes(user.id)).length,
    };
    return profile;
  }, [activities, blocks, id, requests, reviews, users, viewer]);
}

export function useUserStats(userId: string) {
  const reviews = useAppStore((state) => state.reviews);
  const activities = useAppStore((state) => state.activities);
  return useMemo(() => {
    const received = reviews.filter((review) => review.revieweeId === userId);
    return {
      averageRating: average(received.map((review) => review.rating)),
      reviewCount: received.length,
      completedCount: activities.filter((activity) => activity.participantIds.includes(userId)).length,
    };
  }, [activities, reviews, userId]);
}

export async function updateProfile(patch: ProfilePatch) {
  const me = requireUser();
  if (patch.email) {
    const email = patch.email.trim().toLowerCase();
    const taken = useAppStore.getState().users.some((user) => user.email === email && user.id !== me.id);
    if (taken) throw new ServiceError("That email is already used by another member.");
    patch = { ...patch, email };
  }
  const location = patch.location ?? me.location;
  const place = placeByName(location);
  const next: Profile = {
    ...me,
    ...patch,
    fullName: (patch.fullName ?? me.fullName).trim(),
    bio: (patch.bio ?? me.bio).trim(),
    location,
    lat: place?.lat ?? (location === me.location ? me.lat : null),
    lng: place?.lng ?? (location === me.location ? me.lng : null),
    phone: patch.contactMethod === "chat" ? null : (patch.phone ?? me.phone),
    interests: patch.interests ?? me.interests,
    skills: patch.skills ?? me.skills,
    servicesOffered: patch.servicesOffered ?? me.servicesOffered,
    servicesNeeded: patch.servicesNeeded ?? me.servicesNeeded,
  };
  useAppStore.setState((state) => ({
    users: state.users.map((user) => (user.id === me.id ? next : user)),
  }));
  return next;
}

export async function updateAvatar(dataUrl: string | null) {
  const me = requireUser();
  useAppStore.setState((state) => ({
    users: state.users.map((user) => (user.id === me.id ? { ...user, avatarUrl: dataUrl } : user)),
  }));
}
