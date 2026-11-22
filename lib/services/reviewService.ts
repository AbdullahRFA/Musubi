"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Review } from "@/lib/types";
import { createId } from "@/lib/utils";
import { pushNotification } from "@/lib/services/notificationService";
import { requireUser, ServiceError, userById } from "@/lib/services/shared";

export function useReviewsForUser(userId: string) {
  const reviews = useAppStore((state) => state.reviews);
  const users = useAppStore((state) => state.users);
  return useMemo(
    () =>
      reviews
        .filter((review) => review.revieweeId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((review) => ({ review, author: userById(users, review.reviewerId) })),
    [reviews, userId, users],
  );
}

export function useActivity(activityId: string) {
  const activities = useAppStore((state) => state.activities);
  const reviews = useAppStore((state) => state.reviews);
  const userId = useAppStore((state) => state.sessionUserId);
  return useMemo(() => {
    const activity = activities.find((item) => item.id === activityId) ?? null;
    if (!activity || !userId || !activity.participantIds.includes(userId)) return null;
    const mine = reviews.find((review) => review.activityId === activityId && review.reviewerId === userId) ?? null;
    const otherId = activity.participantIds.find((id) => id !== userId) ?? "";
    return { activity, mine, otherId };
  }, [activities, activityId, reviews, userId]);
}

export function useMyActivities() {
  const activities = useAppStore((state) => state.activities);
  const userId = useAppStore((state) => state.sessionUserId);
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

export async function leaveReview(activityId: string, rating: number, comment: string) {
  const me = requireUser();
  const state = useAppStore.getState();
  const activity = state.activities.find((item) => item.id === activityId);
  if (!activity) throw new ServiceError("Feedback is available only for a completed activity.");
  if (!activity.participantIds.includes(me.id)) {
    throw new ServiceError("You can leave feedback only for your own activities.");
  }
  const request = state.requests.find((item) => item.id === activity.requestId);
  if (!request || request.status !== "completed") {
    throw new ServiceError("Feedback opens after both people confirm the activity is complete.");
  }
  if (state.reviews.some((review) => review.activityId === activityId && review.reviewerId === me.id)) {
    throw new ServiceError("You already left feedback for this activity.");
  }
  if (rating < 1 || rating > 5) throw new ServiceError("Choose a rating from 1 to 5 stars.");
  const trimmed = comment.trim();
  if (trimmed.length > 200) throw new ServiceError("Please keep your comment under 200 characters.");
  const otherId = activity.participantIds.find((id) => id !== me.id);
  if (!otherId) throw new ServiceError("We could not find the other person for this activity.");
  const review: Review = {
    id: createId("rev"),
    activityId,
    reviewerId: me.id,
    revieweeId: otherId,
    rating,
    comment: trimmed,
    createdAt: new Date().toISOString(),
  };
  useAppStore.setState((current) => ({ reviews: [review, ...current.reviews] }));
  pushNotification({
    userId: otherId,
    type: "review",
    title: "New feedback",
    body: `${me.fullName} left a ${rating}-star review.`,
    href: `/profile/${otherId}`,
  });
  return review;
}
