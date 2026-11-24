"use client";

import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/common/AuthGuard";
import { DmThreadView } from "@/components/connections/DmThreadView";

export default function DirectMessagePage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <AuthGuard>
      <div className="mx-auto w-full max-w-3xl sm:px-4 sm:py-5 h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] md:h-[calc(100dvh-4rem)]">
        <DmThreadView connectionId={id} />
      </div>
    </AuthGuard>
  );
}
