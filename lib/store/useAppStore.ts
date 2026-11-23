"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedState } from "@/lib/mock/seed";
import type { AppState } from "@/lib/types";

export const useAppStore = create<AppState>()(
  persist(() => seedState(), {
    name: "tsunagu-generations",
    version: 3,
    migrate: () => seedState(),
    skipHydration: false,
  }),
);

export function replaceState(next: AppState) {
  useAppStore.setState(next, true);
}
