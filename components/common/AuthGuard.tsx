"use client";

import { useEffect } from "react";
import { LogoMark } from "@/components/common/Logo";
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
          <LogoMark className="mx-auto h-14 w-14 animate-pulse" />
          <p className="text-muted-foreground font-medium">Loading Musubi...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
