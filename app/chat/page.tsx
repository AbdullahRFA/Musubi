"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { MessageSquare, ShieldCheck, ChevronRight, Compass, Search, CheckCircle2 } from "lucide-react";
import { useConversations } from "@/lib/services/chatService";
import { useUnreadByConversation } from "@/lib/services/notificationService";
import { initials } from "@/lib/utils";
import { timeAgo } from "@/components/notifications/notificationStyles";
import { useAppStore } from "@/lib/store/useAppStore";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/common/AuthGuard";
import { ChatThreadView } from "@/components/chat/ChatThreadView";
import { useLanguage } from "@/lib/i18n";

function ChatMasterDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramId = searchParams.get("id");
  const conversations = useConversations();
  const myId = useAppStore((s) => s.sessionUserId);
  const unreadByConvo = useUnreadByConversation();
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

  const groupLabel = (g: "og" | "yg") =>
    g === "og" ? (isJa ? "シニア世代" : "Older Generation") : isJa ? "若い世代" : "Younger Generation";

  // Search + status filter for the conversation list
  const [listQuery, setListQuery] = useState("");
  const [listFilter, setListFilter] = useState<"all" | "active" | "completed">("all");
  const isDone = (status?: string) => status === "completed";
  const activeCount = conversations.filter((c) => !isDone(c.request?.status)).length;
  const completedCount = conversations.length - activeCount;
  const shownConversations = conversations.filter((c) => {
    if (listFilter === "active" && isDone(c.request?.status)) return false;
    if (listFilter === "completed" && !isDone(c.request?.status)) return false;
    const q = listQuery.trim().toLowerCase();
    if (!q) return true;
    return [c.other?.fullName, c.post?.title, c.last?.body].some((v) => v?.toLowerCase().includes(q));
  });

  return (
    <div className={`page-container max-w-7xl ${selectedId ? "px-0 sm:px-6 py-0 sm:py-6" : "py-5 sm:py-8"} space-y-4 sm:space-y-6`}>
      {/* Header (hidden on phones while a thread is open to give the conversation full height) */}
      <div className={`${selectedId ? "hidden md:flex" : "flex"} flex-col sm:flex-row sm:items-end justify-between gap-3 animate-fade-up`}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </span>
            {isJa ? "メッセージ・やり取り" : "Messages & Arrangements"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
            {isJa
              ? "依頼が承認されると、こちらで個別に待ち合わせや相談を行えます。"
              : "Private conversations unlock once a service request is accepted."}
          </p>
        </div>
        {conversations.length > 0 && (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full bg-[#E7EEE4] text-[#315B4B] border border-[#315B4B]/20">
            <ShieldCheck className="h-4 w-4" />
            {isJa ? `やり取り中: ${activeCount}件` : `${activeCount} active ${activeCount === 1 ? "chat" : "chats"}`}
          </span>
        )}
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 sm:p-14 text-center space-y-4 max-w-2xl mx-auto animate-fade-up">
          <div className="h-16 w-16 rounded-full bg-[#E7EEE4] text-[#315B4B] flex items-center justify-center mx-auto animate-float">
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
          <Button asChild size="lg" variant="secondary" className="font-bold gap-2">
            <Link href="/posts">
              <Compass className="h-5 w-5" />
              {isJa ? "コミュニティ投稿を見る" : "Browse Community Posts"}
            </Link>
          </Button>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 md:h-[calc(100dvh-15rem)] md:min-h-[520px] ${
            selectedId ? "h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))]" : ""
          }`}
        >
          {/* Conversation list */}
          <div
            className={`flex-col min-h-0 bg-card rounded-2xl border-2 border-border overflow-hidden md:col-span-5 lg:col-span-4 ${
              selectedId ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="space-y-2.5 border-b border-border bg-[#FAF9F5] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={listQuery}
                  onChange={(e) => setListQuery(e.target.value)}
                  placeholder={isJa ? "名前や投稿で検索" : "Search by name or post"}
                  aria-label={isJa ? "会話を検索" : "Search conversations"}
                  className="h-11 w-full rounded-full border-2 border-border bg-white pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:border-primary/40 focus:border-[#315B4B] focus:outline-none"
                />
              </div>
              <div role="group" aria-label={isJa ? "状態で絞り込む" : "Filter conversations"} className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
                {(
                  [
                    ["all", isJa ? "すべて" : "All", conversations.length],
                    ["active", isJa ? "進行中" : "Active", activeCount],
                    ["completed", isJa ? "完了" : "Completed", completedCount],
                  ] as const
                ).map(([value, label, count]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setListFilter(value)}
                    aria-pressed={listFilter === value}
                    className={`rounded-full px-2 py-1.5 text-xs font-bold transition-all sm:text-sm ${
                      listFilter === value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label} <span className="tabular-nums opacity-70">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <ul className="flex-1 overflow-y-auto overscroll-contain divide-y divide-border/70">
              {shownConversations.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {isJa ? "該当する会話はありません。" : "No conversations match."}
                </li>
              )}
              {shownConversations.map(({ conversation, other, last, post, request }) => {
                const isSelected = selectedId === conversation.id;
                const completed = isDone(request?.status);
                const lastFromMe = last?.senderId === myId;
                const unread = isSelected ? 0 : unreadByConvo[conversation.id] ?? 0;
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={`group w-full text-left px-4 py-4 transition-colors duration-200 flex items-start gap-3 border-l-4 ${
                        isSelected
                          ? "bg-[#F3F7F2] border-l-[#315B4B]"
                          : unread > 0
                          ? "bg-primary/[0.04] border-l-primary/60 hover:bg-primary/[0.07]"
                          : "bg-card border-l-transparent hover:bg-[#FAF9F5]"
                      }`}
                    >
                      <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-base border border-border overflow-hidden transition-transform group-hover:scale-105">
                        {other?.avatarUrl ? (
                          <img src={other.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : other ? (
                          initials(other.fullName)
                        ) : (
                          "?"
                        )}
                      </div>
                        {unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-card" aria-hidden="true" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className={`text-base text-foreground truncate ${unread > 0 ? "font-black" : "font-bold"}`}>
                            {other?.fullName ?? (isJa ? "地域の仲間" : "Community Member")}
                          </h3>
                          <time
                            dateTime={last ? last.createdAt : conversation.createdAt}
                            className={`shrink-0 text-[11px] ${unread > 0 ? "font-bold text-primary" : "text-muted-foreground"}`}
                          >
                            {timeAgo(last ? last.createdAt : conversation.createdAt)}
                          </time>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 mb-1 min-w-0">
                          {completed ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              {isJa ? "完了" : "Completed"}
                            </span>
                          ) : (
                            other && (
                              <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded bg-[#E7EEE4] text-[#315B4B]">
                                {groupLabel(other.userGroup)}
                              </span>
                            )
                          )}
                          {post && (
                            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded truncate">
                              {post.title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p
                            className={`flex-1 text-sm truncate leading-snug ${
                              unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground"
                            }`}
                          >
                            {last ? (
                              <>
                                {lastFromMe && <span className="font-semibold text-foreground/70">{isJa ? "あなた: " : "You: "}</span>}
                                {last.body}
                              </>
                            ) : isJa ? (
                              "やり取りを開始しましょう"
                            ) : (
                              "Say hello!"
                            )}
                          </p>
                          {unread > 0 && (
                            <span
                              className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground tabular-nums animate-in zoom-in-95"
                              aria-label={`${unread} unread`}
                            >
                              {unread > 9 ? "9+" : unread}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        className={`h-5 w-5 shrink-0 self-center transition-all duration-200 group-hover:translate-x-0.5 ${
                          isSelected ? "text-[#315B4B]" : "text-muted-foreground/60"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Thread */}
          <div className={`min-h-0 md:col-span-7 lg:col-span-8 ${selectedId ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
            {selectedId ? (
              <ChatThreadView key={selectedId} conversationId={selectedId} showBackButton onBack={handleBackToList} />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full bg-card rounded-2xl border-2 border-dashed border-border text-muted-foreground space-y-2">
                <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-1" />
                <p className="text-base font-bold text-foreground">
                  {isJa ? "左の一覧から会話を選択してください" : "Select a conversation to start reading"}
                </p>
                <p className="text-sm">{isJa ? "ワンタップでメッセージを確認・返信できます。" : "One click to view and reply instantly."}</p>
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
          <div className="flex min-h-[50vh] items-center justify-center gap-3 p-8 text-muted-foreground">
            <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Loading messages...
          </div>
        }
      >
        <ChatMasterDetail />
      </Suspense>
    </AuthGuard>
  );
}
