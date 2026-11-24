"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  Lock,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useThread, sendMessage, QUICK_REPLIES, type QuickReplyOption } from "@/lib/services/chatService";
import { usePublicProfile } from "@/lib/services/profileService";
import { confirmCompletion } from "@/lib/services/requestService";
import { CompletePaymentDialog } from "@/components/transactions/CompletePaymentDialog";
import { markConversationRead, setActiveConversation, getActiveConversation } from "@/lib/services/notificationService";
import { useSession } from "@/lib/services/authService";
import { useAppStore } from "@/lib/store/useAppStore";
import { useLanguage } from "@/lib/i18n";
import { initials, money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface ChatThreadViewProps {
  conversationId: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const SAFETY_DISMISSED_KEY = "tsunagu_chat_safety_dismissed";
const MAX_MESSAGE = 500;
/** Messages from the same sender within this window are grouped together. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* Small formatting helpers                                                   */
/* -------------------------------------------------------------------------- */

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string, isJa: boolean) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return isJa ? "今日" : "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return isJa ? "昨日" : "Yesterday";
  return new Intl.DateTimeFormat(isJa ? "ja-JP" : "en-GB", { weekday: "short", day: "numeric", month: "short" }).format(d);
}

function timeLabel(iso: string, isJa: boolean) {
  return new Intl.DateTimeFormat(isJa ? "ja-JP" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ChatThreadView({ conversationId, onBack, showBackButton = false }: ChatThreadViewProps) {
  const router = useRouter();
  const thread = useThread(conversationId);
  const session = useSession();
  const otherPublic = usePublicProfile(thread?.other?.id ?? "");
  const activities = useAppStore((s) => s.activities);
  const reviews = useAppStore((s) => s.reviews);
  const transactions = useAppStore((s) => s.transactions);
  const { language } = useLanguage();
  const isJa = language === "ja";

  const [inputBody, setInputBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showQuick, setShowQuick] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [waitingNotice, setWaitingNotice] = useState(false);
  const [safetyDismissed, setSafetyDismissed] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const [unseen, setUnseen] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastCountRef = useRef(0);

  const messageCount = thread?.messages.length ?? 0;
  const lastSenderIsMe = thread?.messages[messageCount - 1]?.senderId === session?.id;

  // Safety tip: show until the member dismisses it once
  useEffect(() => {
    try {
      setSafetyDismissed(localStorage.getItem(SAFETY_DISMISSED_KEY) === "1");
    } catch {
      setSafetyDismissed(false);
    }
  }, []);

  // Don't show "not found" while the thread is still loading
  useEffect(() => {
    setGaveUp(false);
    const t = setTimeout(() => setGaveUp(true), 4000);
    return () => clearTimeout(t);
  }, [conversationId]);

  // Auto-scroll only when the member is already at the bottom (or sent the
  // message); otherwise show a "New messages" pill instead of jumping.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const added = messageCount - lastCountRef.current;
    const first = lastCountRef.current === 0;
    lastCountRef.current = messageCount;
    if (first || atBottom || lastSenderIsMe) {
      el.scrollTo({ top: el.scrollHeight, behavior: first ? "auto" : "smooth" });
      setUnseen(0);
    } else if (added > 0) {
      setUnseen((n) => n + added);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCount]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near);
    if (near) setUnseen(0);
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setUnseen(0);
  };

  // Messenger-style read receipts: while this thread is open, its message
  // notifications are cleared and new ones don't raise a toast
  useEffect(() => {
    setActiveConversation(conversationId);
    markConversationRead(conversationId);
    const onVisible = () => {
      if (document.visibilityState === "visible") markConversationRead(conversationId);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (getActiveConversation() === conversationId) setActiveConversation(null);
    };
  }, [conversationId]);

  useEffect(() => {
    if (document.visibilityState === "visible") markConversationRead(conversationId);
  }, [conversationId, messageCount]);

  // Stop read-aloud when leaving
  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    []
  );

  // Grow the composer with its content (up to ~5 lines)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [inputBody]);

  /* ---------- Loading / not found ---------- */
  if (!thread) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-8 text-center sm:p-12">
        {gaveUp ? (
          <>
            <MessageCircle className="mb-3 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-bold text-foreground">{isJa ? "メッセージが見つかりません" : "Conversation not found"}</h3>
            <p className="mb-6 max-w-md text-base text-muted-foreground">
              {isJa
                ? "この会話は存在しないか、権限がありません。"
                : "This conversation may have ended, or you may not be a participant."}
            </p>
            {onBack && (
              <Button onClick={onBack} variant="outline" size="lg" className="gap-2 font-bold">
                <ArrowLeft className="h-5 w-5" />
                {isJa ? "一覧に戻る" : "Back to messages"}
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            {isJa ? "読み込み中..." : "Loading conversation..."}
          </div>
        )}
      </div>
    );
  }

  /* ---------- Derived state ---------- */
  const { messages, other, request, post } = thread;
  const isCompleted = request.status === "completed";
  const isRequester = request.requesterId === session?.id;
  const myDone = isRequester ? request.requesterDone : request.ownerDone;
  const otherDone = isRequester ? request.ownerDone : request.requesterDone;
  const otherName = other?.fullName ?? (isJa ? "地域の仲間" : "Community member");
  const otherFirst = otherName.split(" ")[0];

  const matchedActivity = activities.find((a) => a.requestId === request.id || (a.postId && a.postId === post?.id));
  const myReview =
    matchedActivity && session ? reviews.find((r) => r.activityId === matchedActivity.id && r.reviewerId === session.id) : null;

  // Demo payment: only the payer sees "Pay", and only until a payment succeeds
  const isPaid = post?.exchangeMethod === "paid" && Boolean(post.amount);
  const isPayer = isPaid && (post?.postType === "offer" ? isRequester : !isRequester);
  const paymentDone = transactions.some((t) => t.requestId === request.id && t.status === "successful");

  // Progress: 0 accepted, 1 meeting, 2 confirming, 3 review
  const stage = isCompleted ? 3 : myDone || otherDone ? 2 : 1;
  const steps = isJa
    ? ["承認済み", "会って手伝う", "双方で完了確認", "レビュー"]
    : ["Accepted", "Meet & help", "Both confirm", "Review"];

  const groupLabel = other?.userGroup === "og" ? (isJa ? "シニア世代" : "Older Generation") : isJa ? "若い世代" : "Younger Generation";
  const area = otherPublic?.neighborhoods?.[0] || otherPublic?.location || other?.location;

  const avatar = (size: string) => (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary font-bold text-secondary-foreground ${size}`}
    >
      {otherPublic?.avatarUrl ? <img src={otherPublic.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(otherName)}
    </div>
  );

  /* ---------- Actions ---------- */
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputBody.trim();
    if (!text || sending || isCompleted) return;
    setSending(true);
    setSendError(null);
    try {
      await sendMessage(conversationId, text);
      setInputBody("");
      setShowQuick(false);
      inputRef.current?.focus();
    } catch (err: any) {
      // Keep the text so the member can retry
      setSendError(err?.message || (isJa ? "送信に失敗しました。もう一度お試しください。" : "Couldn't send. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (qr: QuickReplyOption) => {
    setInputBody(isJa ? qr.ja : qr.en);
    setShowQuick(false);
    inputRef.current?.focus();
  };

  const handleReadAloud = (messageId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isJa ? "ja-JP" : "en-US";
    utterance.rate = 0.9; // slightly slower, clear pace
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Payers must finish the demo payment before marking the task completed
  const openComplete = () => {
    if (isPayer && !paymentDone) setPaymentOpen(true);
    else setConfirmOpen(true);
  };

  const handleComplete = async () => {
    setCompleting(true);
    setCompleteError(null);
    try {
      const res = await confirmCompletion(request.id);
      setConfirmOpen(false);
      if (res.completed && res.activityId) router.push(`/feedback/${res.activityId}`);
      else setWaitingNotice(true);
    } catch (err: any) {
      setCompleteError(err?.message || (isJa ? "更新に失敗しました。" : "Couldn't update. Please try again."));
      setConfirmOpen(true); // surface the error in the confirmation dialog
    } finally {
      setCompleting(false);
    }
  };

  const dismissSafety = () => {
    setSafetyDismissed(true);
    try {
      localStorage.setItem(SAFETY_DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  };

  /* ---------- Primary next action for the progress bar ---------- */
  const primaryAction = isCompleted ? (
    matchedActivity && !myReview ? (
      <Button asChild size="sm" className="gap-1.5 bg-emerald-600 font-bold text-white hover:bg-emerald-700">
        <Link href={`/feedback/${matchedActivity.id}`}>
          <Star className="h-4 w-4" />
          {isJa ? "評価・レビューを書く" : "Rate & review"}
        </Link>
      </Button>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-800">
        <CheckCircle2 className="h-4 w-4" />
        {myReview ? (isJa ? "レビュー済み" : "Feedback given") : isJa ? "完了済み" : "Completed"}
      </span>
    )
  ) : myDone ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-900">
      <Clock className="h-4 w-4 animate-pulse" />
      {isJa ? `${otherFirst}さんの確認待ち` : `Waiting for ${otherFirst}`}
    </span>
  ) : otherDone ? (
    <Button size="sm" onClick={openComplete} className="gap-1.5 bg-emerald-600 font-bold text-white hover:bg-emerald-700">
      <CheckCircle2 className="h-4 w-4" />
      {isJa ? "相手確認済・完了する" : `${otherFirst} confirmed — finish`}
    </Button>
  ) : (
    <Button size="sm" variant="outline" onClick={openComplete} className="gap-1.5 font-bold hover:border-emerald-600 hover:text-emerald-700">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      {isJa ? "完了にする" : "Mark completed"}
    </Button>
  );

  /* ---------- Render ---------- */
  let lastDay = "";
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-none border-y-2 border-border bg-card shadow-sm sm:rounded-2xl sm:border-2">
      {/* ===== Header ===== */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-3 sm:px-5">
        {showBackButton && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:hidden"
            aria-label={isJa ? "一覧に戻る" : "Back to messages"}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
        <Link href={`/profile/${other?.id}`} className="shrink-0" aria-label={isJa ? "プロフィールを見る" : `View ${otherName}'s profile`}>
          {avatar("h-11 w-11 text-base")}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${other?.id}`} className="block truncate text-base font-bold text-foreground transition-colors hover:text-primary sm:text-lg">
            {otherName}
          </Link>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            {groupLabel}
            {area ? ` · ${area}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {otherPublic?.phoneShared && otherPublic.phone && (
            <a
              href={`tel:${otherPublic.phone}`}
              className="flex h-10 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-100"
              title={isJa ? "電話をかける" : `Call ${otherFirst}`}
              aria-label={isJa ? "電話をかける" : `Call ${otherFirst}`}
            >
              <Phone className="h-4 w-4" />
              <span className="hidden lg:inline">{otherPublic.phone}</span>
            </a>
          )}
          <Link
            href={`/profile/${other?.id}`}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
            title={isJa ? "プロフィール" : "View profile"}
            aria-label={isJa ? "プロフィール" : "View profile"}
          >
            <UserRound className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* ===== Exchange progress ===== */}
      <section className="shrink-0 space-y-2.5 border-b border-border bg-muted/30 px-3 py-3 sm:px-5" aria-label={isJa ? "やり取りの進み具合" : "Exchange progress"}>
        {post && (
          <Link href={`/posts/${post.id}`} className="group flex min-w-0 items-center gap-1.5 text-sm">
            <span className="shrink-0 font-semibold text-primary">{isJa ? "依頼:" : "About:"}</span>
            <span className="truncate font-medium text-foreground group-hover:text-primary group-hover:underline underline-offset-4">{post.title}</span>
          </Link>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ol className="flex min-w-0 flex-1 items-center gap-1.5">
            {steps.map((label, i) => {
              const done = i < stage || (i === 3 && isCompleted && Boolean(myReview));
              const current = i === stage && !done;
              return (
                <Fragment key={label}>
                  <li className="flex min-w-0 items-center gap-1.5" aria-current={current ? "step" : undefined}>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        done ? "bg-emerald-600 text-white" : current ? "border-2 border-primary text-primary" : "border-2 border-border text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span
                      className={`truncate text-xs font-semibold ${current ? "text-foreground" : "text-muted-foreground"} ${
                        current ? "inline" : "hidden sm:inline"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                  {i < steps.length - 1 && (
                    <li aria-hidden="true" className={`h-0.5 min-w-[12px] flex-1 rounded-full ${i < stage ? "bg-emerald-600" : "bg-border"}`} />
                  )}
                </Fragment>
              );
            })}
          </ol>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isPayer &&
              (paymentDone ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-900">
                  <Check className="h-4 w-4" />
                  {isJa ? "支払い済み (デモ)" : "Paid (demo)"}
                </span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)} className="gap-1.5 border-blue-300 bg-blue-50 font-bold text-blue-900 hover:bg-blue-100">
                  <Coins className="h-4 w-4" />
                  {isJa ? `${money(post!.amount!)} を支払う (デモ)` : `Pay ${money(post!.amount!)} (demo)`}
                </Button>
              ))}
            {primaryAction}
          </div>
        </div>
        {waitingNotice && !isCompleted && (
          <p role="status" className="text-xs font-semibold text-amber-800 animate-in fade-in">
            {isJa
              ? `完了を記録しました。${otherFirst}さんも確認すると、レビューを書けます。`
              : `You've marked it completed. Once ${otherFirst} confirms too, you can leave a review.`}
          </p>
        )}
      </section>

      {/* ===== Messages ===== */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto overscroll-contain bg-[#FAF9F5] px-3 py-4 sm:px-6"
          aria-live="polite"
          aria-label={isJa ? "メッセージ" : "Messages"}
        >
          {!safetyDismissed && !isCompleted && (
            <div className="mx-auto mb-4 flex max-w-lg items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-sm text-amber-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="flex-1">
                {isJa
                  ? "初めて会う時は、公民館・図書館・カフェなど明るい公共の場所を選びましょう。"
                  : "For your first meeting, choose a bright public place like a community centre, library or cafe."}
              </p>
              <button
                type="button"
                onClick={dismissSafety}
                className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-amber-800 hover:bg-amber-100"
                aria-label={isJa ? "閉じる" : "Dismiss tip"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7EEE4] text-[#315B4B]">
                <Sparkles className="h-7 w-7" />
              </span>
              <p className="text-lg font-bold text-foreground">
                {isJa ? `${otherFirst}さんに挨拶しましょう` : `Say hello to ${otherFirst}`}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {isJa
                  ? "会う日時と場所を決めましょう。下の「簡単返信」も使えます。"
                  : "Agree on a day, time and public place to meet. Quick replies below can help."}
              </p>
            </div>
          ) : (
            <ol className="space-y-1">
              {messages.map((m, i) => {
                const isMe = m.senderId === session?.id;
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const day = dayKey(m.createdAt);
                const showDay = day !== lastDay;
                lastDay = day;
                const startsGroup =
                  showDay || !prev || prev.senderId !== m.senderId || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > GROUP_WINDOW_MS;
                const endsGroup =
                  !next ||
                  next.senderId !== m.senderId ||
                  dayKey(next.createdAt) !== day ||
                  new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() > GROUP_WINDOW_MS;

                return (
                  <Fragment key={m.id}>
                    {showDay && (
                      <li className="flex justify-center py-3">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{dayLabel(m.createdAt, isJa)}</span>
                      </li>
                    )}
                    <li className={`flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 ${isMe ? "justify-end" : "justify-start"} ${startsGroup ? "pt-2" : ""}`}>
                      {!isMe && <div className="w-8 shrink-0">{endsGroup && avatar("h-8 w-8 text-xs")}</div>}
                      <div className={`flex max-w-[85%] flex-col sm:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}>
                          <div
                            className={`px-4 py-2.5 text-base leading-relaxed shadow-xs sm:text-[17px] ${
                              isMe
                                ? `bg-[#315B4B] text-white ${startsGroup ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-r-md"}`
                                : `border border-border bg-white text-foreground ${startsGroup ? "rounded-2xl rounded-tl-md" : "rounded-2xl rounded-l-md"}`
                            }`}
                          >
                            <p data-no-translate className="whitespace-pre-wrap break-words">{m.body}</p>
                          </div>
                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => handleReadAloud(m.id, m.body)}
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                                speakingId === m.id ? "bg-red-50 text-red-600" : "text-muted-foreground/70 hover:bg-[#E7EEE4] hover:text-[#315B4B]"
                              }`}
                              title={speakingId === m.id ? (isJa ? "停止" : "Stop") : isJa ? "読み上げる" : "Read aloud"}
                              aria-label={speakingId === m.id ? (isJa ? "読み上げを停止" : "Stop reading") : isJa ? "読み上げる" : "Read aloud"}
                            >
                              {speakingId === m.id ? <VolumeX className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                        {endsGroup && (
                          <span className="mt-1 px-1 text-[11px] text-muted-foreground">
                            {timeLabel(m.createdAt, isJa)}
                            {m.canned && <span className="italic"> · {isJa ? "自動応答" : "auto-reply"}</span>}
                          </span>
                        )}
                      </div>
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          )}
        </div>

        {unseen > 0 && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#315B4B] px-4 py-2 text-sm font-bold text-white shadow-lift animate-in fade-in slide-in-from-bottom-2"
          >
            <ArrowDown className="h-4 w-4" />
            {isJa ? `新しいメッセージ ${unseen}件` : `${unseen} new ${unseen === 1 ? "message" : "messages"}`}
          </button>
        )}
      </div>

      {/* ===== Composer / read-only footer ===== */}
      {isCompleted ? (
        <div className="flex shrink-0 flex-col items-center gap-2 border-t border-border bg-muted/40 px-4 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            {isJa ? "このやり取りは完了しました。メッセージは閲覧のみです。" : "This exchange is completed. The chat is now read-only."}
          </p>
          {matchedActivity && !myReview && (
            <Button asChild size="sm" className="gap-1.5 font-bold">
              <Link href={`/feedback/${matchedActivity.id}`}>
                <Star className="h-4 w-4" />
                {isJa ? "レビューを書く" : "Leave a review"}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="shrink-0 border-t border-border bg-card">
          {showQuick && (
            <div className="flex gap-2 overflow-x-auto border-b border-border bg-[#F3F7F2] px-3 py-2.5 scrollbar-none snap-x animate-in fade-in slide-in-from-bottom-2">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.id}
                  type="button"
                  onClick={() => handleQuickReply(qr)}
                  className="flex min-h-[44px] shrink-0 snap-start items-center gap-1.5 rounded-full border border-[#315B4B]/25 bg-white px-3.5 text-sm font-semibold text-foreground shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#315B4B]"
                >
                  <span aria-hidden="true">{qr.icon}</span>
                  {isJa ? qr.ja : qr.en}
                </button>
              ))}
            </div>
          )}
          {sendError && (
            <p role="alert" className="border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {sendError}
            </p>
          )}
          <form onSubmit={handleSend} className="flex items-end gap-2 p-2.5 sm:p-3">
            <button
              type="button"
              onClick={() => setShowQuick((v) => !v)}
              aria-expanded={showQuick}
              className={`flex h-12 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-bold transition-colors ${
                showQuick ? "bg-[#315B4B] text-white" : "bg-[#E7EEE4] text-[#315B4B] hover:bg-[#d8e3d4]"
              }`}
              title={isJa ? "簡単返信" : "Quick replies"}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{isJa ? "簡単返信" : "Quick replies"}</span>
              <ChevronDown className={`hidden h-4 w-4 transition-transform sm:block ${showQuick ? "rotate-180" : ""}`} />
            </button>
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputBody}
                onChange={(e) => {
                  setInputBody(e.target.value);
                  if (sendError) setSendError(null);
                }}
                onKeyDown={(e) => {
                  // Enter sends; Shift+Enter adds a new line (IME-safe)
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                maxLength={MAX_MESSAGE}
                placeholder={isJa ? `${otherFirst}さんへのメッセージ...` : `Message ${otherFirst}...`}
                aria-label={isJa ? "メッセージ" : "Message"}
                enterKeyHint="send"
                className="block max-h-40 min-h-[48px] w-full resize-none rounded-2xl border-2 border-border bg-white px-4 py-3 text-base text-foreground placeholder:text-muted-foreground transition-colors hover:border-primary/40 focus:border-[#315B4B] focus:outline-none"
              />
              {inputBody.length > MAX_MESSAGE - 100 && (
                <span className="pointer-events-none absolute bottom-1.5 right-3 text-[11px] font-semibold tabular-nums text-amber-700">
                  {inputBody.length}/{MAX_MESSAGE}
                </span>
              )}
            </div>
            <Button
              type="submit"
              disabled={sending || !inputBody.trim()}
              aria-label={isJa ? "送信" : "Send"}
              className="h-12 w-12 shrink-0 rounded-full bg-[#315B4B] p-0 text-white shadow-xs hover:bg-[#254639] sm:w-auto sm:px-5"
            >
              {sending ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span className="hidden font-bold sm:inline">{isJa ? "送信" : "Send"}</span>
            </Button>
          </form>
        </div>
      )}

      {/* ===== Completion confirmation ===== */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !completing && setConfirmOpen(open)}
        title={otherDone ? (isJa ? "やり取りを完了しますか？" : "Finish this exchange?") : isJa ? "完了にしますか？" : "Mark as completed?"}
        description={
          otherDone
            ? isJa
              ? `${otherFirst}さんはすでに完了を確認しています。確認するとレビューに進みます。`
              : `${otherFirst} has already confirmed. Confirm to finish and leave a review.`
            : isJa
            ? `${otherFirst}さんも確認すると完了になり、お互いにレビューを書けます。`
            : `Once ${otherFirst} confirms too, the exchange is completed and you can both leave a review.`
        }
      >
        {completeError && <p role="alert" className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{completeError}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={completing} onClick={() => setConfirmOpen(false)}>
            {isJa ? "まだ" : "Not yet"}
          </Button>
          <Button type="button" onClick={handleComplete} disabled={completing} className="gap-1.5 bg-emerald-600 font-bold text-white hover:bg-emerald-700">
            {completing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <CheckCircle2 className="h-4 w-4" />}
            {isJa ? "完了にする" : "Yes, mark completed"}
          </Button>
        </div>
      </Dialog>

      {/* ===== Demo payment required before completing ===== */}
      <CompletePaymentDialog
        requestId={request.id}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        completing={completing}
        onMarkCompleted={async () => {
          if (myDone || isCompleted) return setPaymentOpen(false);
          await handleComplete();
          setPaymentOpen(false);
        }}
      />
    </div>
  );
}
