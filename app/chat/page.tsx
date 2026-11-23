"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  MessageSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Compass,
} from "lucide-react";
import { useConversations } from "@/lib/services/chatService";
import { formatWhen, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/common/AuthGuard";
import { ChatThreadView } from "@/components/chat/ChatThreadView";
import { useLanguage } from "@/lib/i18n";

function ChatMasterDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramId = searchParams.get("id");
  const conversations = useConversations();
  const { language } = useLanguage();
  const isJa = language === "ja";

  // Active selected conversation ID
  const [selectedId, setSelectedId] = useState<string | null>(paramId);

  // Sync selectedId with URL parameter if provided
  useEffect(() => {
    if (paramId) {
      setSelectedId(paramId);
    }
  }, [paramId]);

  // On larger screens, auto-select the first conversation if none selected (0 clicks to view!)
  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      // Auto-select first thread on desktop viewports
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        setSelectedId(conversations[0].conversation.id);
      }
    }
  }, [conversations, selectedId]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    router.replace(`/chat?id=${id}`, { scroll: false });
  };

  const handleBackToList = () => {
    setSelectedId(null);
    router.replace("/chat", { scroll: false });
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
      {/* Top Header */}
      <div className="border-b-2 border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <MessageSquare className="h-7 w-7 text-primary" />
            <span>{isJa ? "メッセージ・やり取り" : "Messages & Arrangements"}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
            {isJa
              ? "依頼が承認されると、こちらで個別に待ち合わせや相談を行えます。"
              : "Private conversations unlock once a service request is accepted."}
          </p>
        </div>

        {conversations.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full bg-[#E7EEE4] text-[#315B4B] border border-[#CBD5E1]">
              {isJa
                ? `やり取り中: ${conversations.length}件`
                : `${conversations.length} active chats`}
            </span>
          </div>
        )}
      </div>

      {conversations.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 sm:p-14 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="h-16 w-16 rounded-full bg-[#E7EEE4] text-[#315B4B] flex items-center justify-center mx-auto">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {isJa ? "現在進行中のメッセージはありません" : "No active conversations yet"}
          </h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            {isJa
              ? "投稿にお手伝いの応募をしたり、届いた依頼を承認すると、ここにメッセージ画面が開きます。"
              : "When you or a neighbor accept a service request, a private chat unlocks here."}
          </p>
          <div className="pt-2">
            <Link href="/posts">
              <Button size="lg" className="font-bold gap-2 text-base h-13 px-6 bg-[#315B4B] hover:bg-[#254639] text-white">
                <Compass className="h-5 w-5" />
                <span>{isJa ? "コミュニティ投稿を見る" : "Browse Community Posts"}</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Master-Detail Container */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[calc(100vh-190px)] min-h-[580px]">
          {/* Conversation List Column */}
          {/* On mobile: visible only when no thread is selected. On desktop: always visible as left column */}
          <div
            className={`flex flex-col bg-card rounded-2xl border-2 border-border overflow-hidden md:col-span-5 lg:col-span-4 ${
              selectedId ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-3 sm:p-4 bg-[#FAF9F5] border-b-2 border-border flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold text-foreground">
                {isJa ? "メッセージ一覧" : "All Conversations"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isJa ? "クリックして開く" : "Click to view"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y-2 divide-border/60">
              {conversations.map(({ conversation, other, last, post }) => {
                const isSelected = selectedId === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full text-left p-4 sm:p-5 transition-all flex items-start gap-3.5 hover:bg-[#FAF9F5] ${
                      isSelected
                        ? "bg-[#F3F7F2] border-l-4 border-l-[#315B4B]"
                        : "bg-card"
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-base shrink-0 border border-border mt-0.5">
                      {other ? initials(other.fullName) : "?"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base sm:text-lg text-foreground truncate">
                          {other?.fullName ?? (isJa ? "地域の仲間" : "Community Member")}
                        </h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {last ? formatWhen(last.createdAt) : formatWhen(conversation.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 mb-1 flex-wrap">
                        {other && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E7EEE4] text-[#315B4B]">
                            {other.userGroup === "og"
                              ? isJa
                                ? "シニア"
                                : "Senior"
                              : isJa
                              ? "ユース"
                              : "Youth"}
                          </span>
                        )}
                        {post && (
                          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded truncate max-w-[170px] sm:max-w-[200px]">
                            {post.title}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground truncate leading-snug">
                        {last ? last.body : (isJa ? "やり取りを開始しましょう" : "Say hello!")}
                      </p>
                    </div>

                    <ChevronRight className={`h-5 w-5 shrink-0 self-center transition-colors ${
                      isSelected ? "text-[#315B4B]" : "text-muted-foreground/60"
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Thread Detail Column */}
          {/* On mobile: visible when selected. On desktop: always visible as right column */}
          <div
            className={`flex-1 md:col-span-7 lg:col-span-8 h-full ${
              selectedId ? "flex flex-col" : "hidden md:flex md:flex-col"
            }`}
          >
            {selectedId ? (
              <ChatThreadView
                conversationId={selectedId}
                showBackButton={true}
                onBack={handleBackToList}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full bg-card rounded-2xl border-2 border-border text-muted-foreground space-y-2">
                <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-1" />
                <p className="text-base font-bold text-foreground">
                  {isJa ? "左の一覧から会話を選択してください" : "Select a conversation to start reading"}
                </p>
                <p className="text-sm">
                  {isJa ? "ワンタップでメッセージを確認・返信できます。" : "One click to view and reply instantly."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatListPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl p-12 text-center text-muted-foreground">
            Loading messages...
          </div>
        }
      >
        <ChatMasterDetail />
      </Suspense>
    </AuthGuard>
  );
}
