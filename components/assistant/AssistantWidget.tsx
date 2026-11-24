"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  MapPin,
  Mic,
  MicOff,
  PenLine,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Square,
  Zap,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/services/authService";
import { useSpeech } from "@/lib/assistant/useSpeech";
import {
  ASSISTANT_DRAFT_KEY,
  type AssistantDraftPost,
  type AssistantMessage,
  type AssistantResponse,
} from "@/lib/assistant/types";
import { ExchangeBadge } from "@/components/posts/PostBadges";
import { FAQS, FAQ_BY_ID, FAQ_TOPICS, type FaqTopic } from "@/lib/assistant/faq";
import { answerLanguage, matchFaq } from "@/lib/assistant/faqMatcher";
import { FormattedReply, toSpeechText } from "@/components/assistant/FormattedReply";

const STORAGE_KEY = "tsunagu_assistant_conversation";
const AUTO_SPEAK_KEY = "tsunagu_assistant_autospeak";

const COPY = {
  en: {
    open: "Ask Tsunagu Guide",
    title: "Tsunagu Guide",
    subtitle: "Your friendly helper",
    welcome:
      "Hello! I'm Tsunagu Guide. I can show you how the website works, help you find a neighbour who can help, or write a post for you. You can type, or press the microphone and just talk.",
    starters: ["How does this website work?", "Find someone to help with my smartphone", "Help me write a post", "Is it safe to meet people?"],
    placeholder: "Type your question...",
    listening: "Listening... speak now",
    send: "Send",
    thinking: "Thinking...",
    readAloud: "Read replies aloud",
    listen: "Listen",
    stop: "Stop",
    reset: "Start a new conversation",
    draftTitle: "Draft post (you can edit before publishing)",
    publish: "Review & publish",
    view: "View",
    error: "Sorry, something went wrong. Please try again.",
    noVoice: "Voice input isn't supported in this browser. Please type instead.",
    instant: "Instant answer",
    stopAnswer: "Stop",
    stopped: "Stopped. You can ask something else.",
    slow: "This is taking longer than usual. You can press Stop and try another question.",
    commonQuestions: "Common questions",
    hideQuestions: "Hide common questions",
  },
  ja: {
    open: "つなぐガイドに聞く",
    title: "つなぐガイド",
    subtitle: "やさしいお手伝い役",
    welcome:
      "こんにちは！つなぐガイドです。サイトの使い方のご案内、お手伝いしてくれるご近所さん探し、投稿の作成をお手伝いします。文字で入力するか、マイクを押して話しかけてください。",
    starters: ["このサイトの使い方を教えて", "スマホを手伝ってくれる人を探したい", "投稿を作るのを手伝って", "人と会うのは安全？"],
    placeholder: "質問を入力してください...",
    listening: "聞いています... お話しください",
    send: "送信",
    thinking: "考えています...",
    readAloud: "返事を読み上げる",
    listen: "聞く",
    stop: "停止",
    reset: "新しい会話を始める",
    draftTitle: "投稿の下書き（公開前に編集できます）",
    publish: "確認して公開",
    view: "見る",
    error: "申し訳ありません、エラーが発生しました。もう一度お試しください。",
    noVoice: "このブラウザは音声入力に対応していません。文字で入力してください。",
    instant: "すぐにお答え",
    stopAnswer: "停止",
    stopped: "停止しました。別の質問をどうぞ。",
    slow: "いつもより時間がかかっています。「停止」を押して、別の質問を試すこともできます。",
    commonQuestions: "よくある質問",
    hideQuestions: "よくある質問を閉じる",
  },
} as const;

let idCounter = 0;
const newId = () => `m_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

function loadConversation(): AssistantMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AssistantMessage[]) : [];
  } catch {
    return [];
  }
}

export function AssistantWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const { language } = useLanguage();
  const lang = language === "ja" ? "ja" : "en";
  const t = COPY[lang];

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [slow, setSlow] = useState(false);
  // In-flight AI request: lets the user stop it, and lets us ignore late answers
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const [openTopic, setOpenTopic] = useState<FaqTopic | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeech(lang);

  // Restore conversation + preference for this browser tab
  useEffect(() => {
    setMessages(loadConversation());
    try {
      setAutoSpeak(localStorage.getItem(AUTO_SPEAK_KEY) === "on");
    } catch {
      // storage unavailable — default off
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore
    }
  }, [messages]);

  // Keep the newest message in view (scroll the panel only, never the page)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  // Escape closes; stop speaking when closed
  useEffect(() => {
    if (!open) {
      speech.stopSpeaking();
      return;
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleAutoSpeak = () => {
    const next = !autoSpeak;
    setAutoSpeak(next);
    if (!next) speech.stopSpeaking();
    try {
      localStorage.setItem(AUTO_SPEAK_KEY, next ? "on" : "off");
    } catch {
      // ignore
    }
  };

  const send = useCallback(
    async (text: string, opts: { fromVoice?: boolean } = {}) => {
      const content = text.trim();
      if (!content) return;
      // A new question replaces one that is still loading
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
        setLoading(false);
      }
      setNotice(null);
      setInput("");

      const userMsg: AssistantMessage = { id: newId(), role: "user", content };
      setShowFaq(false);

      // 1) Stored FAQ: answer instantly in the browser — no AI call needed
      const faqMatch = matchFaq(content, lang);
      if (faqMatch) {
        const { faq } = faqMatch;
        const replyLang = answerLanguage(content, lang);
        const botMsg: AssistantMessage = {
          id: newId(),
          role: "assistant",
          source: "faq",
          content: faq.answer[replyLang],
          navigate: faq.link ? { href: faq.link.href, label: faq.link.label[replyLang] } : null,
          quickReplies: (faq.related ?? [])
            .map((id) => FAQ_BY_ID.get(id)?.question[replyLang])
            .filter((q): q is string => Boolean(q))
            .slice(0, 3),
        };
        setMessages((prev) => [...prev, userMsg, botMsg]);
        if (opts.fromVoice || autoSpeak) speech.speak(botMsg.id, toSpeechText(botMsg.content));
        return;
      }

      // 2) Everything else goes to the AI
      const history = [...messages.filter((m) => !m.error && !m.stopped), userMsg];
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: lang,
            page: pathname,
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();
        if (requestId !== requestIdRef.current) return; // stopped or replaced meanwhile
        if (!res.ok) throw new Error(data?.error || t.error);

        const reply = data as AssistantResponse;
        const botMsg: AssistantMessage = { id: newId(), role: "assistant", source: "ai", ...reply, content: reply.reply };
        setMessages((prev) => [...prev, botMsg]);

        // Speak the answer when the user talked to us, or when auto-read is on
        if (opts.fromVoice || autoSpeak) speech.speak(botMsg.id, toSpeechText(reply.reply));
      } catch (err: any) {
        // Stopped by the user, or replaced by a newer question: nothing to show
        if (err?.name === "AbortError" || requestId !== requestIdRef.current) return;
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: "assistant", content: err?.message || t.error, error: true },
        ]);
      } finally {
        if (requestId === requestIdRef.current) {
          abortRef.current = null;
          setLoading(false);
        }
      }
    },
    [messages, lang, pathname, t.error, autoSpeak, speech]
  );

  /** Stop a slow AI answer so the user can ask something else. */
  const stopAnswer = useCallback(() => {
    if (!abortRef.current) return;
    abortRef.current.abort();
    abortRef.current = null;
    requestIdRef.current++; // ignore anything that still arrives
    setLoading(false);
    setMessages((prev) => [...prev, { id: newId(), role: "assistant", content: t.stopped, stopped: true }]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [t.stopped]);

  // After 8s of waiting, suggest stopping
  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Cancel any request when the panel closes or the widget unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  const startVoice = () => {
    if (!speech.voiceInputSupported) {
      setNotice(t.noVoice);
      return;
    }
    if (speech.listening) {
      speech.stopListening();
      return;
    }
    setNotice(null);
    speech.startListening(
      (text) => send(text, { fromVoice: true }),
      (message) => setNotice(message)
    );
  };

  const openDraft = (draft: AssistantDraftPost) => {
    try {
      sessionStorage.setItem(ASSISTANT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore — the form will just open empty
    }
    setOpen(false);
    router.push(session ? "/posts/new?from=assistant" : "/login");
  };

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    requestIdRef.current++;
    setLoading(false);
    speech.stopSpeaking();
    setMessages([]);
    setNotice(null);
  };

  // The full-screen chat thread on phones already has its own composer
  const hideOnPhone = pathname?.startsWith("/chat");
  // Post detail pages have their own floating "Respond" button on phones — stack above it
  const raiseOnPhone = /^\/posts\/(?!new$)[^/]+$/.test(pathname ?? "");
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && !m.error);
  const quickReplies = !loading && lastAssistant?.quickReplies?.length ? lastAssistant.quickReplies : null;

  return (
    <>
      {/* ---------- Floating launcher ---------- */}
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 250);
          }}
          className={`${hideOnPhone ? "hidden md:inline-flex" : "inline-flex"} fixed right-4 ${
            raiseOnPhone ? "bottom-[calc(9rem+env(safe-area-inset-bottom))]" : "bottom-[calc(5rem+env(safe-area-inset-bottom))]"
          } md:bottom-6 md:right-6 z-[45] items-center gap-2 rounded-full bg-gradient-to-br from-[#315B4B] to-[#234336] pl-3 pr-4 py-3 text-white shadow-lift ring-4 ring-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95 animate-fade-up`}
          aria-label={t.open}
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <Bot className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-[#315B4B] animate-pulse" />
          </span>
          <span className="hidden min-[400px]:inline text-sm font-bold">{t.open}</span>
        </button>
      )}

      {/* ---------- Panel ---------- */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-[58] bg-black/40 animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <section
            role="dialog"
            aria-label={t.title}
            className="fixed z-[59] inset-x-0 bottom-0 top-[6dvh] flex flex-col overflow-hidden rounded-t-3xl border-2 border-border bg-background shadow-lift animate-in fade-in slide-in-from-bottom-4 duration-300 md:inset-auto md:right-6 md:bottom-6 md:top-auto md:h-[min(42rem,calc(100dvh-7rem))] md:w-[26rem] md:rounded-3xl"
          >
            {/* Header */}
            <header className="flex items-center gap-3 bg-gradient-to-br from-[#315B4B] to-[#234336] px-4 py-3.5 text-white">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/20">
                <Bot className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black leading-tight">{t.title}</h2>
                <p className="text-xs text-white/80">{t.subtitle}</p>
              </div>
              {speech.voiceOutputSupported && (
                <button
                  type="button"
                  onClick={toggleAutoSpeak}
                  aria-pressed={autoSpeak}
                  title={t.readAloud}
                  aria-label={t.readAloud}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    autoSpeak ? "bg-amber-400 text-stone-900" : "hover:bg-white/15"
                  }`}
                >
                  {autoSpeak ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
              )}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  title={t.reset}
                  aria-label={t.reset}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
              >
                <ChevronDown className="h-6 w-6 md:hidden" />
                <X className="hidden h-5 w-5 md:block" />
              </button>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4" aria-live="polite">
              {/* Welcome */}
              <Bubble role="assistant">
                <FormattedReply text={t.welcome} />
              </Bubble>
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pl-10">
                  {t.starters.map((s) => (
                    <SuggestionChip key={s} onClick={() => send(s)}>
                      {s}
                    </SuggestionChip>
                  ))}
                </div>
              )}

              {/* Browse stored FAQ by topic — tap to get an instant answer */}
              <div className="pl-10">
                <button
                  type="button"
                  onClick={() => setShowFaq((v) => !v)}
                  aria-expanded={showFaq}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  {showFaq ? t.hideQuestions : t.commonQuestions}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFaq ? "rotate-180" : ""}`} />
                </button>
                {showFaq && (
                  <div className="mt-2 overflow-hidden rounded-2xl border-2 border-border bg-card divide-y divide-border animate-in fade-in slide-in-from-top-1">
                    {(Object.keys(FAQ_TOPICS) as FaqTopic[]).map((topic) => {
                      const items = FAQS.filter((f) => f.topic === topic);
                      const expanded = openTopic === topic;
                      return (
                        <div key={topic}>
                          <button
                            type="button"
                            onClick={() => setOpenTopic(expanded ? null : topic)}
                            aria-expanded={expanded}
                            className="flex w-full min-h-[48px] items-center justify-between gap-2 px-4 text-left text-sm font-bold text-foreground hover:bg-muted/60 transition-colors"
                          >
                            {FAQ_TOPICS[topic][lang]}
                            <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                              {items.length}
                              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                            </span>
                          </button>
                          {expanded && (
                            <ul className="bg-background/60 pb-1">
                              {items.map((f) => (
                                <li key={f.id}>
                                  <button
                                    type="button"
                                    onClick={() => send(f.question[lang])}
                                    className="group flex w-full min-h-[44px] items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                                  >
                                    <span className="flex-1">{f.question[lang]}</span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {messages.map((m) => (
                <div key={m.id} className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
                  {m.stopped ? (
                    <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Square className="h-3 w-3 fill-current" />
                      {m.content}
                    </p>
                  ) : (
                  <Bubble role={m.role} error={m.error}>
                    {m.source === "faq" && (
                      <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        <Zap className="h-3 w-3" />
                        {t.instant}
                      </span>
                    )}
                    {m.role === "assistant" && !m.error ? (
                      <FormattedReply text={m.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                    {m.role === "assistant" && !m.error && speech.voiceOutputSupported && (
                      <button
                        type="button"
                        onClick={() => speech.speak(m.id, toSpeechText(m.content))}
                        className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#E7EEE4] px-3 text-sm font-bold text-[#315B4B] hover:bg-[#d8e3d4] transition-colors"
                      >
                        {speech.speakingId === m.id ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        {speech.speakingId === m.id ? t.stop : t.listen}
                      </button>
                    )}
                  </Bubble>
                  )}

                  {/* Matching posts */}
                  {m.posts && m.posts.length > 0 && (
                    <div className="pl-10 space-y-2">
                      {m.posts.map((p) => (
                        <Link
                          key={p.id}
                          href={`/posts/${p.id}`}
                          onClick={() => setOpen(false)}
                          className="group block rounded-2xl border-2 border-border bg-card p-3.5 transition-all duration-200 hover:border-primary/40 hover:shadow-soft"
                        >
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">{p.category}</span>
                            <ExchangeBadge method={p.exchangeMethod} amount={p.amount} />
                          </div>
                          <p className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{p.title}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{p.location}</span>
                            <span className="ml-auto inline-flex items-center gap-1 font-bold text-primary">
                              {t.view}
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Draft post */}
                  {m.draftPost && (
                    <div className="ml-10 rounded-2xl border-2 border-primary/30 bg-primary/[0.04] p-4 space-y-2">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                        <PenLine className="h-3.5 w-3.5" />
                        {t.draftTitle}
                      </p>
                      <p className="font-bold text-foreground leading-snug">{m.draftPost.title}</p>
                      <p className="text-sm text-muted-foreground">{m.draftPost.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">{m.draftPost.category}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">{m.draftPost.availability}</span>
                        <ExchangeBadge method={m.draftPost.exchangeMethod} />
                      </div>
                      <button
                        type="button"
                        onClick={() => openDraft(m.draftPost!)}
                        className="mt-1 inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground shadow-sm transition-all hover:bg-[#7c2d12] hover:shadow-glow active:scale-[0.98]"
                      >
                        {t.publish}
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {/* Page shortcut */}
                  {m.navigate && (
                    <div className="pl-10">
                      <Link
                        href={m.navigate.href}
                        onClick={() => setOpen(false)}
                        className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-[#315B4B]/30 bg-[#E7EEE4] px-4 text-sm font-bold text-[#315B4B] transition-colors hover:bg-[#d8e3d4]"
                      >
                        {m.navigate.label}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <Bubble role="assistant">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <span className="flex gap-1" aria-hidden="true">
                          <span className="h-2 w-2 rounded-full bg-[#315B4B] animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 rounded-full bg-[#315B4B] animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 rounded-full bg-[#315B4B] animate-bounce" />
                        </span>
                        {t.thinking}
                      </span>
                      <button
                        type="button"
                        onClick={stopAnswer}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border-2 border-border px-3 text-sm font-bold text-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" />
                        {t.stopAnswer}
                      </button>
                    </div>
                    {slow && <p className="text-sm text-muted-foreground animate-in fade-in">{t.slow}</p>}
                  </div>
                </Bubble>
              )}

              {quickReplies && (
                <div className="flex flex-wrap gap-2 pl-10">
                  {quickReplies.map((q) => (
                    <SuggestionChip key={q} onClick={() => send(q)}>
                      {q}
                    </SuggestionChip>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t-2 border-border bg-card px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3 space-y-2">
              {notice && (
                <p role="alert" className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
                  {notice}
                </p>
              )}
              {speech.listening && (
                <p className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                  {speech.interim || t.listening}
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2"
              >
                <button
                  type="button"
                  onClick={startVoice}
                  aria-pressed={speech.listening}
                  aria-label={speech.listening ? t.stop : "Speak"}
                  title={speech.voiceInputSupported ? undefined : t.noVoice}
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                    speech.listening
                      ? "bg-rose-600 text-white shadow-lg"
                      : speech.voiceInputSupported
                      ? "bg-[#E7EEE4] text-[#315B4B] hover:bg-[#d8e3d4]"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {speech.listening && <span className="absolute inset-0 rounded-full bg-rose-500/50 animate-ping" />}
                  {speech.listening ? <MicOff className="relative h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  maxLength={1000}
                  placeholder={speech.listening ? t.listening : t.placeholder}
                  aria-label={t.placeholder}
                  className="min-h-[48px] max-h-32 flex-1 resize-none rounded-2xl border-2 border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground transition-colors hover:border-[#315B4B]/40 focus:outline-none focus:border-[#315B4B]"
                />
                {loading && !input.trim() ? (
                  // While the AI is thinking, the send button becomes a Stop button
                  <button
                    type="button"
                    onClick={stopAnswer}
                    aria-label={t.stopAnswer}
                    title={t.stopAnswer}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-all hover:bg-destructive active:scale-95 animate-in zoom-in-95"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </button>
                ) : (
                  // Typing a new question while loading replaces the slow one
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label={t.send}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#315B4B] text-white shadow-sm transition-all hover:bg-[#234336] hover:shadow-md active:scale-95 disabled:opacity-40"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                )}
              </form>
              <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                {lang === "ja" ? "AIの回答は間違うことがあります。" : "AI answers can make mistakes."}
              </p>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Bubble({ role, error, children }: { role: "user" | "assistant"; error?: boolean; children: React.ReactNode }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#315B4B] px-4 py-3 text-base leading-relaxed text-white shadow-xs">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E7EEE4] text-[#315B4B]">
        <Bot className="h-4 w-4" />
      </span>
      <div
        className={`max-w-[85%] rounded-2xl rounded-bl-sm border-2 px-4 py-3 text-base leading-relaxed shadow-xs ${
          error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-card text-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function SuggestionChip({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border-2 border-[#315B4B]/25 bg-card px-3.5 py-2 text-sm font-semibold text-[#315B4B] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#315B4B]/60 hover:bg-[#E7EEE4] active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
