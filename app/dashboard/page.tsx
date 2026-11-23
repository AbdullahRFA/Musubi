"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // The v2 architecture integrates all dashboard actions directly into the Homepage (/)
    router.replace("/");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8 text-center text-muted-foreground">
      Redirecting to homepage...
    </div>
  );
}
