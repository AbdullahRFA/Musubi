import type { AppState, Post, Profile, ServiceRequest } from "@/lib/types";

// Services use window.setTimeout in places; give node a window
(globalThis as any).window ??= globalThis;

export const emptyState = (): AppState => ({
  users: [], posts: [], requests: [], conversations: [], messages: [], notifications: [], transactions: [],
  reviews: [], activities: [], reports: [], blocks: [], safetyAck: {}, sessionUserId: null,
});

export const member = (id: string, over: Partial<Profile> = {}): Profile => ({
  id, email: `${id}@example.com`, fullName: id === "hana" ? "Hana Sato" : "Ken Tanaka", avatarUrl: null, age: 68, ageGroup: "65+",
  location: "Urakami, Nagasaki", neighborhoods: ["Urakami, Nagasaki"], lat: 32.77, lng: 129.87,
  bio: "A friendly neighbour who loves helping.", interests: [], skills: ["Origami"], servicesOffered: [], servicesNeeded: [],
  availability: "Flexible", contactMethod: "chat", phone: null, userGroup: "og", createdAt: "2026-01-01T00:00:00Z", ...over,
});

export const post = (over: Partial<Post> = {}): Post => ({
  id: "p1", authorId: "hana", title: "Help me video call", description: "Please teach me video calls.", category: "Technology",
  skill: "Video calls", location: "Urakami, Nagasaki", lat: 32.77, lng: 129.87, availability: "Weekends", postType: "request",
  exchangeMethod: "paid", amount: 10, status: "in_progress", templateId: null, createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", ...over,
});

export const request = (over: Partial<ServiceRequest> = {}): ServiceRequest => ({
  id: "r1", postId: "p1", requesterId: "ken", ownerId: "hana", message: "Happy to help", status: "accepted", direct: false,
  requesterDone: false, ownerDone: false, createdAt: "2026-11-02T00:00:00Z", updatedAt: "2026-11-02T00:00:00Z", ...over,
});
