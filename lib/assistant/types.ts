import type { Category, ExchangeMethod, PostType } from "@/lib/types";

/** Compact post info the assistant can show as a result card. */
export interface AssistantPostSummary {
  id: string;
  title: string;
  category: Category;
  skill: string;
  location: string;
  availability: string;
  exchangeMethod: ExchangeMethod;
  amount: number | null;
  postType: PostType;
  description: string;
}

export interface AssistantDraftPost {
  title: string;
  description: string;
  category: string;
  skill: string;
  exchangeMethod: "free" | "exchange" | "paid";
  availability: string;
}

/** Shape returned by POST /api/assistant. */
export interface AssistantResponse {
  reply: string;
  posts: AssistantPostSummary[];
  draftPost: AssistantDraftPost | null;
  navigate: { href: string; label: string } | null;
  quickReplies: string[];
}

/** A message in the widget's local conversation. */
export interface AssistantMessage extends Partial<Omit<AssistantResponse, "reply">> {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
  /** "faq" when answered instantly from the stored FAQ (no AI call). */
  source?: "faq" | "ai";
  /** Marker shown when the user stopped a slow answer (not sent to the AI). */
  stopped?: boolean;
}

/** sessionStorage key used to hand a draft to the post form. */
export const ASSISTANT_DRAFT_KEY = "tsunagu_assistant_draft";
