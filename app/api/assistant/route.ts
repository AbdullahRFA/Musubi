import { NextResponse, type NextRequest } from "next/server";
import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, AVAILABILITY } from "@/lib/constants";
import { ASSISTANT_ROUTES, ASSISTANT_SYSTEM_PROMPT } from "@/lib/assistant/knowledge";
import type { AssistantPostSummary, AssistantResponse } from "@/lib/assistant/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stable Gemini models, tried in order: if one is overloaded (503) or
// rate-limited (429) the next is used. Override with GEMINI_MODEL in
// .env.local (comma-separated for your own fallback order).
const MODELS = (process.env.GEMINI_MODEL || "gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const MAX_HISTORY = 16;
const MAX_MESSAGE_CHARS = 1000;
const MAX_POSTS_IN_CONTEXT = 60;

/* -------------------------------------------------------------------------- */
/* Request validation                                                         */
/* -------------------------------------------------------------------------- */

const RequestSchema = z.object({
  language: z.enum(["en", "ja"]).default("en"),
  page: z.string().max(200).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS * 4),
      })
    )
    .min(1)
    .max(40),
});

/* -------------------------------------------------------------------------- */
/* Structured output the model must return                                    */
/* -------------------------------------------------------------------------- */

const ROUTE_HREFS = ASSISTANT_ROUTES.map((r) => r.href) as [string, ...string[]];
const EXCHANGES = ["free", "exchange", "paid"] as const;

/** JSON Schema sent to Gemini (responseJsonSchema) so it always replies in this shape. */
const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "Plain-language answer for the member. No markdown symbols." },
    suggestedPostIds: {
      type: "array",
      items: { type: "string" },
      description: "Ids from the OPEN POSTS list that match the member's need (max 4).",
    },
    draftPost: {
      description: "A ready-to-review post draft, or null when not drafting a post.",
      anyOf: [
        {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string", enum: [...CATEGORIES] },
            skill: { type: "string" },
            exchangeMethod: { type: "string", enum: [...EXCHANGES] },
            availability: { type: "string", enum: [...AVAILABILITY] },
          },
          required: ["title", "description", "category", "skill", "exchangeMethod", "availability"],
        },
        { type: "null" },
      ],
    },
    navigate: {
      description: "One helpful page button, or null.",
      anyOf: [
        {
          type: "object",
          properties: {
            href: { type: "string", enum: ROUTE_HREFS },
            label: { type: "string" },
          },
          required: ["href", "label"],
        },
        { type: "null" },
      ],
    },
    quickReplies: {
      type: "array",
      items: { type: "string" },
      description: "Up to 3 short follow-up suggestions the member might say next.",
    },
  },
  required: ["reply", "suggestedPostIds", "draftPost", "navigate", "quickReplies"],
};

/** Server-side validation of the model's JSON before it reaches the browser. */
const OutputSchema = z.object({
  reply: z.string().min(1),
  suggestedPostIds: z.array(z.string()).default([]),
  draftPost: z
    .object({
      title: z.string(),
      description: z.string(),
      category: z.enum(CATEGORIES as [string, ...string[]]),
      skill: z.string(),
      exchangeMethod: z.enum(EXCHANGES),
      availability: z.enum(AVAILABILITY as [string, ...string[]]),
    })
    .nullable()
    .default(null),
  navigate: z.object({ href: z.string(), label: z.string() }).nullable().default(null),
  quickReplies: z.array(z.string()).default([]),
});

/* -------------------------------------------------------------------------- */
/* Simple per-instance rate limiter (best-effort guard against abuse)         */
/* -------------------------------------------------------------------------- */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > MAX_PER_WINDOW;
}

/* -------------------------------------------------------------------------- */
/* Handler                                                                    */
/* -------------------------------------------------------------------------- */

// Created lazily so a missing key produces a clear 503 instead of a crash
let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  // Fail fast: we handle fallbacks ourselves (next model), so disable the SDK's
  // default 5-attempt exponential backoff, and cap each call at 30s.
  client ??= new GoogleGenAI({ apiKey, httpOptions: { timeout: 30_000, retryOptions: { attempts: 1 } } });
  return client;
}

export async function POST(request: NextRequest) {
  const ai = getClient();
  if (!ai) {
    console.error("Assistant: GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "The assistant isn't set up yet. Please try again later." },
      { status: 503 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "You're sending messages very quickly. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Keep the most recent turns, trimmed, starting with a user message
  let history = body.messages.slice(-MAX_HISTORY).map((m) => ({
    role: m.role,
    content: m.content.slice(0, m.role === "user" ? MAX_MESSAGE_CHARS : MAX_MESSAGE_CHARS * 3),
  }));
  while (history.length && history[0].role !== "user") history = history.slice(1);
  if (!history.length || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  }

  /* ---------- Live context: open posts + signed-in member ---------- */
  const supabase = await createClient();
  const [{ data: postRows }, { data: authData }] = await Promise.all([
    supabase
      .from("posts")
      .select("id,title,description,category,skill,location,availability,exchange_method,amount,post_type")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(MAX_POSTS_IN_CONTEXT),
    supabase.auth.getUser(),
  ]);

  const posts: AssistantPostSummary[] = (postRows ?? []).map((row: any) => ({
    id: String(row.id),
    title: row.title,
    category: row.category,
    skill: row.skill,
    location: row.location,
    availability: row.availability,
    exchangeMethod: row.exchange_method,
    amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : null,
    postType: row.post_type || "request",
    description: String(row.description ?? ""),
  }));

  let memberContext = "The visitor is NOT logged in (a guest).";
  const authUser = authData?.user;
  if (authUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,user_group,location,neighborhoods,skills,services_needed,interests,availability")
      .eq("id", authUser.id)
      .maybeSingle();
    if (profile) {
      memberContext = [
        `The member is logged in. First name: ${String(profile.full_name || "").split(" ")[0] || "Member"}.`,
        `Group: ${profile.user_group === "og" ? "Older Generation (60+)" : "Younger Generation"}.`,
        `Neighbourhoods: ${(profile.neighborhoods ?? []).join(", ") || profile.location || "not set"}.`,
        `Skills they share: ${(profile.skills ?? []).join(", ") || "none listed"}.`,
        `Help they need: ${(profile.services_needed ?? []).join(", ") || "none listed"}.`,
        `Interests: ${(profile.interests ?? []).join(", ") || "none listed"}.`,
        `Usual availability: ${profile.availability || "Flexible"}.`,
        "Use their neighbourhood and availability as defaults when drafting a post.",
      ].join("\n");
    } else {
      memberContext = "The member is logged in (profile details unavailable).";
    }
  }

  const postsContext = posts.length
    ? posts
        .map(
          (p) =>
            `id=${p.id} | ${p.postType.toUpperCase()} | ${p.category} | "${p.title}" | skill: ${p.skill} | ${p.location} | ${p.availability} | ${
              p.exchangeMethod === "paid" ? `paid demo £${p.amount ?? "?"}` : p.exchangeMethod
            } | ${p.description.slice(0, 160)}`
        )
        .join("\n")
    : "(There are no open posts right now.)";

  const liveContext = `CURRENT CONTEXT
Site language: ${body.language === "ja" ? "Japanese" : "English"}.
Page the member is viewing: ${body.page || "unknown"}.
${memberContext}

OPEN POSTS (${posts.length})
${postsContext}`;

  /* ---------- Call Gemini ---------- */
  const politeDecline = (): AssistantResponse => ({
    reply:
      body.language === "ja"
        ? "申し訳ありません、その内容にはお答えできません。サイトの使い方や投稿についてお手伝いできます。"
        : "I'm sorry, I can't help with that. I'm happy to help you use the website or find and create posts.",
    posts: [],
    draftPost: null,
    navigate: null,
    quickReplies: [],
  });

  try {
    const genRequest = {
      contents: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: `${ASSISTANT_SYSTEM_PROMPT}\n\n${liveContext}`,
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_JSON_SCHEMA,
        maxOutputTokens: 4096,
        temperature: 0.6,
        // Stop waiting as soon as the visitor presses Stop (or leaves)
        abortSignal: request.signal,
      },
    };

    // Try each model; move on only when it's busy / unavailable
    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    let lastError: unknown = null;
    // Two passes over the list with a short pause: Google's "high demand"
    // spikes are usually brief.
    outer: for (let pass = 0; pass < 2; pass++) {
      if (pass > 0) await new Promise((r) => setTimeout(r, 1500));
      for (const model of MODELS) {
        // Visitor stopped the answer: don't spend quota on more fallbacks
        if (request.signal.aborted) {
          return new NextResponse(null, { status: 499 });
        }
        try {
          response = await ai.models.generateContent({ model, ...genRequest });
          break outer;
        } catch (err) {
          if (request.signal.aborted) return new NextResponse(null, { status: 499 });
          lastError = err;
          const busy = err instanceof ApiError && (err.status === 429 || err.status === 404 || err.status >= 500);
          if (!busy) throw err;
          console.warn(`Assistant: ${model} unavailable (${(err as ApiError).status}), trying next model`);
        }
      }
    }
    if (!response) throw lastError;

    // Blocked by safety filters
    const finish = response.candidates?.[0]?.finishReason;
    if (response.promptFeedback?.blockReason || finish === "SAFETY" || finish === "PROHIBITED_CONTENT") {
      return NextResponse.json<AssistantResponse>(politeDecline());
    }

    const raw = response.text ?? "";
    let parsed: z.infer<typeof OutputSchema> | null = null;
    try {
      const result = OutputSchema.safeParse(JSON.parse(raw));
      if (result.success) parsed = result.data;
    } catch {
      // not JSON — handled below
    }

    if (!parsed) {
      console.warn("Assistant: unparseable model output", raw.slice(0, 300));
      return NextResponse.json<AssistantResponse>({
        reply:
          body.language === "ja"
            ? "すみません、うまく聞き取れませんでした。別の言い方でもう一度お願いできますか？"
            : "Sorry, I didn't catch that. Could you say it another way?",
        posts: [],
        draftPost: null,
        navigate: null,
        quickReplies: [],
      });
    }

    // Never trust ids / links blindly: keep only posts that exist and known routes
    const byId = new Map(posts.map((p) => [p.id, p]));
    const suggested = Array.from(new Set(parsed.suggestedPostIds))
      .map((id) => byId.get(id))
      .filter((p): p is AssistantPostSummary => Boolean(p))
      .slice(0, 4);
    const route = parsed.navigate ? ASSISTANT_ROUTES.find((r) => r.href === parsed!.navigate!.href) : undefined;

    return NextResponse.json<AssistantResponse>({
      reply: parsed.reply,
      posts: suggested.map(({ description, ...rest }) => ({ ...rest, description: description.slice(0, 140) })),
      draftPost: parsed.draftPost,
      navigate: route ? { href: route.href, label: parsed.navigate!.label || route.label } : null,
      quickReplies: parsed.quickReplies.slice(0, 3),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Assistant Gemini API error ${error.status}:`, error.message);
      // Google reports a bad key as 400 API_KEY_INVALID rather than 401
      if (error.status === 401 || error.status === 403 || /API_KEY_INVALID|API key not valid/i.test(error.message)) {
        return NextResponse.json({ error: "The assistant isn't set up correctly. Please try again later." }, { status: 503 });
      }
      if (error.status === 429 || error.status >= 500) {
        return NextResponse.json(
          {
            error:
              body.language === "ja"
                ? "ただいまAIがとても混み合っています。少し待ってから、もう一度お試しください。"
                : "The assistant is very busy right now. Please wait a moment and try again.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: "The assistant couldn't answer just now. Please try again." }, { status: 502 });
    }
    console.error("Assistant unexpected error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
