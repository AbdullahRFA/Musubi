"use client";

import { useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Review, Activity } from "@/lib/types";
import { pushNotification } from "@/lib/services/notificationService";
import { requireUser, ServiceError, userById } from "@/lib/services/shared";
import { createClient } from "@/lib/supabase/client";
import { rowToProfile } from "@/lib/services/authService";
import { rowToActivity } from "@/lib/services/requestService";

export function rowToReview(row: any): Review {
  return {
    id: row.id,
    activityId: row.activity_id,
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewee_id,
    rating: row.rating,
    comment: row.comment || "",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/**
 * Fetch public reviews received by a user from Supabase
 */
export async function fetchReviewsForUser(userId: string): Promise<Review[]> {
  if (!userId) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  const reviews = data.map(rowToReview);

  // Fetch profiles of reviewers if not already in store
  const reviewerIds = Array.from(new Set(reviews.map((r) => r.reviewerId)));
  const cachedUserIds = new Set(useAppStore.getState().users.map((u) => u.id));
  const missingUserIds = reviewerIds.filter((id) => !cachedUserIds.has(id));

  if (missingUserIds.length > 0) {
    const { data: userRows } = await supabase
      .from("profiles")
      .select("*")
      .in("id", missingUserIds);

    if (userRows) {
      const users = userRows.map(rowToProfile);
      useAppStore.setState((state) => ({ users: [...state.users, ...users] }));
    }
  }

  useAppStore.setState((state) => {
    const remoteIds = new Set(reviews.map((r) => r.id));
    const kept = state.reviews.filter((r) => !remoteIds.has(r.id));
    return { reviews: [...reviews, ...kept] };
  });

  return reviews;
}

/**
 * Fetch a specific completed activity and its reviews from Supabase
 */
export async function fetchActivity(activityId: string): Promise<Activity | null> {
  if (!activityId) return null;
  const supabase = createClient();

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", activityId)
    .single();

  if (error || !data) return null;
  const activity = rowToActivity(data);

  // Fetch reviews for this activity
  const { data: revData } = await supabase
    .from("reviews")
    .select("*")
    .eq("activity_id", activityId);

  const reviews = (revData || []).map(rowToReview);

  useAppStore.setState((state) => {
    const remoteRevIds = new Set(reviews.map((r) => r.id));
    const keptRevs = state.reviews.filter((r) => !remoteRevIds.has(r.id));
    return {
      activities: state.activities.some((a) => a.id === activity.id)
        ? state.activities.map((a) => (a.id === activity.id ? activity : a))
        : [activity, ...state.activities],
      reviews: [...reviews, ...keptRevs],
    };
  });

  return activity;
}

/**
 * Hook to retrieve reviews for a user with auto-fetching
 */
export function useReviewsForUser(userId: string) {
  const reviews = useAppStore((state) => state.reviews);
  const users = useAppStore((state) => state.users);

  useEffect(() => {
    if (userId) {
      fetchReviewsForUser(userId);
    }
  }, [userId]);

  return useMemo(
    () =>
      reviews
        .filter((review) => review.revieweeId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((review) => ({ review, author: userById(users, review.reviewerId) })),
    [reviews, userId, users],
  );
}

/**
 * Hook to retrieve an activity and user's review status
 */
export function useActivity(activityId: string) {
  const activities = useAppStore((state) => state.activities);
  const reviews = useAppStore((state) => state.reviews);
  const sessionUserId = useAppStore((state) => state.sessionUserId);
  const session = useAppStore((state) =>
    state.users.find((u) => u.id === state.sessionUserId)
  );
  const userId = session?.id || sessionUserId;

  useEffect(() => {
    if (activityId) {
      fetchActivity(activityId);
    }
  }, [activityId]);

  return useMemo(() => {
    const activity = activities.find((item) => item.id === activityId) ?? null;
    if (!activity || !userId || !activity.participantIds.includes(userId)) return null;
    const mine =
      reviews.find(
        (review) => review.activityId === activityId && review.reviewerId === userId,
      ) ?? null;
    const otherId = activity.participantIds.find((id) => id !== userId) ?? "";
    return { activity, mine, otherId };
  }, [activities, activityId, reviews, userId]);
}

export function useMyActivities() {
  const activities = useAppStore((state) => state.activities);
  const sessionUserId = useAppStore((state) => state.sessionUserId);
  const session = useAppStore((state) =>
    state.users.find((u) => u.id === state.sessionUserId)
  );
  const userId = session?.id || sessionUserId;

  return useMemo(
    () =>
      activities
        .filter((activity) => userId && activity.participantIds.includes(userId))
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [activities, userId],
  );
}

export function useActivitiesForUser(userId: string) {
  const activities = useAppStore((state) => state.activities);
  return useMemo(
    () =>
      activities
        .filter((activity) => activity.participantIds.includes(userId))
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [activities, userId],
  );
}

/**
 * Submits a star rating and comment review to Supabase PostgreSQL
 */
export async function leaveReview(activityId: string, rating: number, comment: string): Promise<Review> {
  const me = requireUser();
  const state = useAppStore.getState();

  if (rating < 1 || rating > 5) throw new ServiceError("Choose a rating from 1 to 5 stars.");
  const trimmed = comment.trim();
  if (trimmed.length > 200) throw new ServiceError("Please keep your comment under 200 characters.");

  // Check activity existence in local store or fetch
  let activity = state.activities.find((item) => item.id === activityId);
  if (!activity) {
    const fetched = await fetchActivity(activityId);
    if (fetched) activity = fetched;
  }

  if (!activity) throw new ServiceError("Feedback is available only for a completed activity.");
  if (!activity.participantIds.includes(me.id)) {
    throw new ServiceError("You can leave feedback only for your own activities.");
  }

  const otherId = activity.participantIds.find((id) => id !== me.id);
  if (!otherId) throw new ServiceError("We could not find the other person for this activity.");

  // Check if review already submitted
  const alreadyReviewed = state.reviews.some(
    (review) => review.activityId === activityId && review.reviewerId === me.id,
  );
  if (alreadyReviewed) {
    throw new ServiceError("You already left feedback for this activity.");
  }

  const supabase = createClient();
  const newRow = {
    activity_id: activityId,
    reviewer_id: me.id,
    reviewee_id: otherId,
    rating,
    comment: trimmed,
  };

  const { data, error } = await supabase
    .from("reviews")
    .insert(newRow)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to insert review:", error);
    throw new ServiceError(error?.message || "Failed to submit review.");
  }

  const review = rowToReview(data);

  useAppStore.setState((current) => ({
    reviews: [review, ...current.reviews.filter((r) => r.id !== review.id)],
  }));

  pushNotification({
    userId: otherId,
    type: "review",
    title: "New feedback",
    body: `${me.fullName} left a ${rating}-star review.`,
    href: `/profile/${otherId}`,
  });

  return review;
}
