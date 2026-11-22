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

export function useUsers() {
  return useAppStore((state) => state.users);
}
