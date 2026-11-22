"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/services/authService";
import { useDemoReady } from "@/lib/services/demoService";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const ready = useDemoReady();
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session) {
      router.replace("/login");
    }
  }, [ready, session, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground font-medium">Loading Tsunagu Generations...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
