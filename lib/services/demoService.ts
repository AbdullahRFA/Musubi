"use client";

import { useEffect, useState } from "react";
import { seedState } from "@/lib/mock/seed";
import { replaceState, useAppStore } from "@/lib/store/useAppStore";

export function useDemoReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const finish = () => setReady(true);
    if (useAppStore.persist.hasHydrated()) finish();
    return useAppStore.persist.onFinishHydration(finish);
  }, []);
  return ready;
}

export function resetDemo() {
  replaceState(seedState());
}

let lastProfilesFetch = 0;

/**
 * All member profiles. Loads them from the database (at most once a minute,
 * shared by every page) so names show correctly even when a page is opened
 * directly — previously only Search/Connections loaded profiles, so other
 * pages fell back to "Community Member".
 */
export function useUsers() {
  const signedIn = useAppStore((state) => Boolean(state.sessionUserId));
  useEffect(() => {
    if (!signedIn || Date.now() - lastProfilesFetch < 60_000) return;
    lastProfilesFetch = Date.now();
    import("@/lib/services/profileService").then(({ fetchProfiles }) => fetchProfiles()).catch(() => {
      lastProfilesFetch = 0;
    });
  }, [signedIn]);
  return useAppStore((state) => state.users);
}
