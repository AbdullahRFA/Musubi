"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { rowToProfile } from "@/lib/services/authService";
import { useAppStore } from "@/lib/store/useAppStore";

/**
 * Client-side provider that maintains synchronization between
 * Supabase Auth sessions and the application store.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();

    // 1. Initial session check on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileRow) {
            const profile = rowToProfile(profileRow);
            useAppStore.setState((state) => ({
              sessionUserId: profile.id,
              users: state.users.some((u) => u.id === profile.id)
                ? state.users.map((u) => (u.id === profile.id ? profile : u))
                : [...state.users, profile],
            }));
          } else {
            useAppStore.setState({ sessionUserId: session.user.id });
          }
        } catch {
          useAppStore.setState({ sessionUserId: session.user.id });
        }
      }
    });

    // 2. Listen to auth changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileRow) {
            const profile = rowToProfile(profileRow);
            useAppStore.setState((state) => ({
              sessionUserId: profile.id,
              users: state.users.some((u) => u.id === profile.id)
                ? state.users.map((u) => (u.id === profile.id ? profile : u))
                : [...state.users, profile],
            }));
          } else {
            useAppStore.setState({ sessionUserId: session.user.id });
          }
        } catch {
          useAppStore.setState({ sessionUserId: session.user.id });
        }
      } else if (event === "SIGNED_OUT") {
        useAppStore.setState({ sessionUserId: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
