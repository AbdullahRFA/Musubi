"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Send,
  ShieldCheck,
  Phone,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Coins,
  MessageCircle,
} from "lucide-react";
import {
  useThread,
  sendMessage,
  QUICK_REPLIES,
  type QuickReplyOption,
} from "@/lib/services/chatService";
import { usePublicProfile } from "@/lib/services/profileService";
import { confirmCompletion } from "@/lib/services/requestService";
import { useSession } from "@/lib/services/authService";
import { useAppStore } from "@/lib/store/useAppStore";
import { useLanguage } from "@/lib/i18n";
import { formatWhen, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatThreadViewProps {
  conversationId: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatThreadView({
  conversationId,
  onBack,
  showBackButton = false,
}: ChatThreadViewProps) {
  const router = useRouter();
  const thread = useThread(conversationId);
  const session = useSession();
  const otherPublic = usePublicProfile(thread?.other?.id ?? "");
  const activities = useAppStore((s) => s.activities);
  const reviews = useAppStore((s) => s.reviews);
  const { language } = useLanguage();
  const isJa = language === "ja";

  const [inputBody, setInputBody] = useState("");
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [quickHint, setQuickHint] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center h-full min-h-[400px] bg-card rounded-2xl border-2 border-border">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-xl font-bold text-foreground mb-2">
          {isJa ? "メッセージが見つかりません" : "Conversation not found"}
        </h3>
        <p className="text-base text-muted-foreground max-w-md mb-6">
          {isJa
            ? "この会話は存在しないか、権限がありません。"
            : "This conversation may not be active or you may not be a participant."}
        </p>
        {onBack && (
          <Button onClick={onBack} variant="outline" size="lg" className="font-bold">
            {isJa ? "← 一覧に戻る" : "← Back to List"}
          </Button>
        )}
      </div>
    );
  }

  const { messages, other, request, post } = thread;
  const isCompleted = request.status === "completed";
  const isRequester = request.requesterId === session?.id;
  const myDone = isRequester ? request.requesterDone : request.ownerDone;
  const otherDone = isRequester ? request.ownerDone : request.requesterDone;

  const matchedActivity = activities.find(
    (a) => a.requestId === request.id || (a.postId && a.postId === post?.id)
  );
  const myReview = matchedActivity && session
    ? reviews.find((r) => r.activityId === matchedActivity.id && r.authorId === session.id)
    : null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputBody.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await sendMessage(conversationId, text);
      setInputBody("");
      setQuickHint(null);
    } catch (err: any) {
      alert(err?.message || (isJa ? "送信に失敗しました。" : "Failed to send message."));
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (qr: QuickReplyOption) => {
    const text = isJa ? qr.ja : qr.en;
    setInputBody(text);
    setQuickHint(
      isJa
        ? "✨ メッセージを入力しました。「送信」を押して届けてください。"
        : "✨ Quick reply filled in. Tap Send to deliver."
    );
    inputRef.current?.focus();
  };

  const handleReadAloud = (messageId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert(
        isJa
          ? "お使いのブラウザは音声読み上げに対応していません。"
          : "Speech synthesis is not supported on this device."
      );
      return;
    }

    if (speakingId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isJa ? "ja-JP" : "en-US";
    utterance.rate = 0.9; // Slightly slower, clear pace suitable for elderly ears
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCompleteActivity = async () => {
    const confirmPrompt = otherDone
      ? (isJa ? "相手がすでに完了確認しています。あなたも完了確認してレビューに進みますか？" : "Partner has confirmed completion! Confirm to complete this exchange and leave feedback?")
      : (isJa ? "この活動を完了としてマークしますか？相手の確認後にレビューが可能になります。" : "Mark this exchange as completed? Once both of you confirm, feedback will unlock.");
    if (!confirm(confirmPrompt)) return;

    setCompleting(true);
    try {
      const res = await confirmCompletion(request.id);
      if (res.completed && res.activityId) {
        router.push(`/feedback/${res.activityId}`);
      } else {
        alert(
          isJa
            ? "あなたの完了を確認しました！相手の方の完了確認をお待ちください。"
            : "You marked this completed! Waiting for the other person to confirm."
        );
      }
    } catch (err: any) {
      alert(err?.message || (isJa ? "更新に失敗しました。" : "Failed to update completion."));
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border-2 border-border overflow-hidden shadow-sm">
      {/* Thread Header */}
      <div className="p-4 sm:p-5 bg-card border-b-2 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {showBackButton && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0"
              aria-label={isJa ? "一覧に戻る" : "Back to messages"}
            >
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </button>
          )}

          <div className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-lg shrink-0 border border-border">
            {other ? initials(other.fullName) : "?"}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile/${other?.id}`}
                className="font-bold text-lg sm:text-xl text-foreground hover:text-primary transition-colors truncate"
              >
                {other?.fullName ?? (isJa ? "地域の仲間" : "Community Member")}
              </Link>
              {other && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E7EEE4] text-[#315B4B]">
                  {other.userGroup === "og"
                    ? isJa
                      ? "シニア世代 (60+)"
                      : "Senior (60+)"
                    : isJa
                    ? "若者世代 (<60)"
                    : "Youth (<60)"}
                </span>
              )}
            </div>

            {post && (
              <div className="text-xs sm:text-sm text-muted-foreground truncate max-w-sm sm:max-w-md mt-0.5">
                <span className="font-semibold text-primary">
                  {isJa ? "📌 依頼: " : "📌 Topic: "}
                </span>
                <span>{post.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions in Header */}
        <div className="flex items-center gap-2 pl-2 sm:pl-0 flex-wrap shrink-0">
          {/* Phone contact if shared */}
          {otherPublic?.phoneShared && otherPublic.phone && (
            <a
              href={`tel:${otherPublic.phone}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-950 border-2 border-emerald-300 text-xs sm:text-sm font-bold hover:bg-emerald-100 transition-colors"
              title={isJa ? "電話をかける" : "Call"}
            >
              <Phone className="h-4 w-4 text-emerald-700" />
              <span>{otherPublic.phone}</span>
            </a>
          )}

          {/* Demo Payment link if monetary post */}
          {post?.exchangeMethod === "paid" && post.amount && (
            <Link href="/transactions">
              <Button
                size="sm"
                variant="outline"
                className="text-xs sm:text-sm font-bold gap-1 border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100 h-10 px-3"
              >
                <Coins className="h-4 w-4 text-blue-600" />
                <span>Pay £{post.amount} (Demo)</span>
              </Button>
            </Link>
          )}

          {/* Mutual Completion / Review Button */}
          {isCompleted ? (
            matchedActivity ? (
              myReview ? (
                <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{isJa ? "レビュー済み" : "Feedback Given"}</span>
                </span>
              ) : (
                <Link href={`/feedback/${matchedActivity.id}`}>
                  <Button
                    size="sm"
                    className="text-xs sm:text-sm font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs h-10 px-3"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isJa ? "評価・レビューを書く" : "Rate & Review"}</span>
                  </Button>
                </Link>
              )
            ) : (
              <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{isJa ? "完了済み" : "Completed"}</span>
              </span>
            )
          ) : myDone && !otherDone ? (
            <span
              className="text-xs sm:text-sm font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-2 rounded-xl flex items-center gap-1.5"
              title={isJa ? "相手の完了確認を待っています" : "Waiting for partner to mark completed"}
            >
              <Clock className="h-4 w-4 text-amber-600 animate-spin" />
              <span>{isJa ? "相手の確認待ち" : "Waiting for Partner"}</span>
            </span>
          ) : !myDone && otherDone ? (
            <Button
              size="sm"
              onClick={handleCompleteActivity}
              disabled={completing}
              className="text-xs sm:text-sm font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs h-10 px-3 animate-pulse"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isJa ? "相手確認済・完了する" : "Partner Confirmed • Finish"}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCompleteActivity}
              disabled={completing}
              className="text-xs sm:text-sm font-bold gap-1.5 text-foreground hover:border-primary border-2 h-10 px-3"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{isJa ? "活動を完了にする" : "Mark Completed"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Non-blocking Friendly Safety Advice Card */}
      <div className="bg-[#FEF9EE] border-b-2 border-[#F6E0B5] px-4 py-2.5 text-xs sm:text-sm text-[#7A4B00] flex items-center gap-2.5 shrink-0">
        <ShieldCheck className="h-5 w-5 text-[#D97706] shrink-0" />
        <span className="font-medium">
          {isJa
            ? "【安心の約束】初めてお会いする時は、公民館・図書館・カフェなど明るい公共の場所を選びましょう。"
            : "Safety Tip: For first meetings, please choose a bright public place like a community center, library, or cafe."}
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAF9F5]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <Sparkles className="h-8 w-8 text-primary/70" />
            <p className="text-lg font-bold text-foreground">
              {isJa
                ? "メッセージを送ってやり取りを始めましょう"
                : "This is the start of your message thread."}
            </p>
            <p className="text-base text-muted-foreground max-w-sm">
              {isJa
                ? "下のワンタップ返信ボタンを使うと、簡単に返信できます。"
                : "Say hello and coordinate when and where to meet. You can use quick replies below!"}
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === session?.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[75%]">
                  {!isMe && (
                    <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs shrink-0 mb-1 border border-border">
                      {other ? initials(other.fullName) : "?"}
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl text-base sm:text-lg leading-relaxed shadow-xs ${
                      isMe
                        ? "bg-[#315B4B] text-white rounded-br-xs"
                        : "bg-white text-foreground border-2 border-[#D1D5DB] rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>

                    {/* Audio Read-Aloud Button for Incoming Messages */}
                    {!isMe && (
                      <div className="mt-2 pt-2 border-t border-border/40 flex items-center">
                        <button
                          type="button"
                          onClick={() => handleReadAloud(m.id, m.body)}
                          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#315B4B] bg-[#E7EEE4] hover:bg-[#d8e3d4] px-3 py-1 rounded-full transition-colors min-h-[36px]"
                          title={isJa ? "音声で読み上げます" : "Listen to this message"}
                        >
                          {speakingId === m.id ? (
                            <>
                              <VolumeX className="h-4 w-4 text-red-600 animate-pulse" />
                              <span className="text-red-700">{isJa ? "停止" : "Stop"}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 text-[#315B4B]" />
                              <span>{isJa ? "音声で聞く" : "Listen"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground px-2">
                  <Clock className="h-3 w-3" />
                  <span>{formatWhen(m.createdAt)}</span>
                  {m.canned && (
                    <span className="italic">
                      ({isJa ? "自動応答" : "auto-reply"})
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Elder-Friendly 1-Tap Quick Replies Bar */}
      <div className="bg-[#F3F7F2] border-t-2 border-border p-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-[#315B4B] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#315B4B]" />
            <span>{isJa ? "ワンタップ簡単返信（文字入力不要）:" : "1-Tap Quick Replies:"}</span>
          </span>
          {quickHint && (
            <span className="text-xs text-emerald-800 font-semibold animate-pulse truncate">
              {quickHint}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {QUICK_REPLIES.map((qr) => (
            <button
              key={qr.id}
              type="button"
              onClick={() => handleQuickReply(qr)}
              className="shrink-0 px-3.5 py-2 rounded-xl border-2 border-[#CBD5E1] bg-white hover:border-[#315B4B] hover:bg-[#FAF9F5] active:scale-98 text-xs sm:text-sm font-bold text-foreground transition-all shadow-xs flex items-center gap-1.5 min-h-[44px]"
            >
              <span>{qr.icon}</span>
              <span>{isJa ? qr.ja : qr.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message Input & Big Send Button */}
      <form
        onSubmit={handleSend}
        className="p-3 sm:p-4 bg-card border-t-2 border-border flex items-center gap-2.5 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={
            isJa ? "メッセージを入力するか、上のボタンを選んでください..." : "Type a message or select a quick reply..."
          }
          value={inputBody}
          onChange={(e) => {
            setInputBody(e.target.value);
            if (quickHint) setQuickHint(null);
          }}
          disabled={sending}
          maxLength={500}
          className="flex-1 h-13 sm:h-14 px-4 text-base sm:text-lg rounded-xl border-2 border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-60 shadow-xs"
        />
        <Button
          type="submit"
          disabled={sending || !inputBody.trim()}
          className="h-13 sm:h-14 px-6 text-base sm:text-lg font-bold gap-2 bg-[#315B4B] hover:bg-[#254639] text-white rounded-xl shadow-xs shrink-0 min-w-[100px]"
        >
          <Send className="h-5 w-5" />
          <span>{isJa ? "送信" : "Send"}</span>
        </Button>
      </form>
    </div>
  );
}
