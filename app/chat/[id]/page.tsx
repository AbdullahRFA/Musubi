"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/common/AuthGuard";
import { ChatThreadView } from "@/components/chat/ChatThreadView";
import { useLanguage } from "@/lib/i18n";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { language } = useLanguage();
  const isJa = language === "ja";

  return (
    <AuthGuard>
      <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-3">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-[#315B4B] hover:text-[#254639] bg-[#E7EEE4] hover:bg-[#d8e3d4] px-4 py-2.5 rounded-xl transition-colors min-h-[44px] shadow-xs"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{isJa ? "← すべてのメッセージ一覧へ戻る" : "← Back to all messages"}</span>
          </Link>
        </div>

        {/* Conversation Thread */}
        <div className="h-[calc(100vh-170px)] min-h-[580px]">
          <ChatThreadView
            conversationId={conversationId}
            showBackButton={true}
            onBack={() => router.push("/chat")}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
