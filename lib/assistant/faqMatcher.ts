/**
 * Instant, offline FAQ matching for the Musubi Guide.
 *
 * Runs entirely in the browser. When a question confidently matches a stored
 * FAQ we answer immediately; otherwise (or for personal "find / write for me"
 * requests that need live posts) the question goes to the AI.
 */
import { FAQS, type FaqEntry, type FaqLang } from "@/lib/assistant/faq";

export interface FaqMatch {
  faq: FaqEntry;
  score: number;
}

/** Minimum confidence to answer from the FAQ instead of the AI. */
export const FAQ_THRESHOLD = 0.62;

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

const STOPWORDS = new Set(
  (
    "a an the is are am was were be been do does did i me my mine you your yours we our us it its this that these those " +
    "to of in on at for with from by about as and or but if so can could would should will shall may might must " +
    "please kindly just really very there here what how when where who which why tell show let get got " +
    "hi hello hey thanks thank ok okay want wanted like would'd i'm im"
  ).split(/\s+/)
);

/** A few synonyms so different words reach the same FAQ. */
const SYNONYMS: Record<string, string> = {
  signup: "register",
  "sign-up": "register",
  enrol: "register",
  enroll: "register",
  login: "log",
  signin: "log",
  logon: "log",
  logout: "logout",
  signout: "logout",
  site: "website",
  app: "website",
  web: "website",
  neighborhood: "neighbourhood",
  neighborhoods: "neighbourhood",
  neighbourhoods: "neighbourhood",
  area: "neighbourhood",
  areas: "neighbourhood",
  photo: "picture",
  pic: "picture",
  avatar: "picture",
  image: "picture",
  remove: "delete",
  erase: "delete",
  pay: "payment",
  paid: "payment",
  paying: "payment",
  cost: "payment",
  price: "payment",
  fee: "payment",
  message: "chat",
  messages: "chat",
  messaging: "chat",
  talk: "chat",
  reply: "respond",
  answer: "respond",
  apply: "respond",
  rating: "review",
  rate: "review",
  feedback: "review",
  font: "text",
  letters: "text",
  bigger: "large",
  larger: "large",
  safe: "safety",
  secure: "safety",
  scam: "report",
  password: "password",
  pw: "password",
};

function stem(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("es") && !word.endsWith("ses")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function normalise(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[.,!?;:()\[\]{}"“”、。？！「」『』（）・〜~…]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function enTokens(text: string): string[] {
  return normalise(text)
    .split(" ")
    .map((w) => SYNONYMS[w] ?? w)
    .filter((w) => w && !STOPWORDS.has(w))
    .map(stem);
}

function jaCompact(text: string): string {
  // Japanese has no spaces; drop spacing/punctuation and common polite endings
  return normalise(text)
    .replace(/\s+/g, "")
    .replace(/(ですか|でしょうか|ますか|ください|下さい|たいです|ですが|です|ます|ね|よ)$/g, "")
    // Question wording and particles vary ("パスワードを変更するには" vs "パスワードの変更"),
    // so compare the content words only
    .replace(/(どうすればいい|どうやって|どうすれば|するには|したいのですが|したい|する方法|の方法|方法|には|できる|すれば|とは|って)/g, "")
    .replace(/[をのはがにへでもか]/g, "");
}

function bigrams(text: string): string[] {
  if (text.length < 2) return text ? [text] : [];
  const out: string[] = [];
  for (let i = 0; i < text.length - 1; i++) out.push(text.slice(i, i + 2));
  return out;
}

function dice(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const counts = new Map<string, number>();
  for (const g of a) counts.set(g, (counts.get(g) ?? 0) + 1);
  let overlap = 0;
  for (const g of b) {
    const c = counts.get(g);
    if (c) {
      overlap++;
      counts.set(g, c - 1);
    }
  }
  return (2 * overlap) / (a.length + b.length);
}

const hasJapanese = (text: string) => /[぀-ヿ㐀-鿿]/.test(text);

/* -------------------------------------------------------------------------- */
/* Requests that need the AI (live posts / personal drafting)                 */
/* -------------------------------------------------------------------------- */

const EN_HOW_QUESTION = /^(how|what|where|when|why|who|which|can i|could i|is |are |do i|does|should i|will )/;
const EN_AI_INTENT =
  /\b(find me|find someone|find somebody|search for|look(ing)? for|need (someone|somebody|a person|help with)|write (a|my|me)|draft|for me|recommend|suggest|match me|anyone who|someone who|somebody who|i need|i want someone|can someone|could someone)\b/;
// Asking to find a person or to have something written always needs live data
const JA_AI_INTENT = /(探して|探しています|探したい|書いて|作って|下書き|おすすめ|紹介して|くれる人|くれる方|いませんか|募集したい)/;
// "How do I…?" questions are FAQ material even if they mention finding someone
// (mirrors EN_HOW_QUESTION, e.g. 助けてくれる人の探し方は？)
const JA_HOW_QUESTION = /(方法|やり方|し方|方は|どうやって|どうすれば|には[?？]?$)/;

/**
 * True when the message asks the assistant to *do* something personal (find
 * matching posts, write a draft). Those need live data, so they go to the AI
 * even if they resemble an FAQ.
 */
export function needsAi(text: string): boolean {
  const n = normalise(text);
  if (hasJapanese(text)) {
    return JA_AI_INTENT.test(n) && !JA_HOW_QUESTION.test(n);
  }
  if (EN_AI_INTENT.test(n) && !EN_HOW_QUESTION.test(n)) return true;
  // Long, story-like messages are usually personal requests
  return n.split(" ").length > 22;
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                    */
/* -------------------------------------------------------------------------- */

function scoreEnglish(query: string, faq: FaqEntry): number {
  const q = enTokens(query);
  const qSet = new Set(q);
  const nq = normalise(query);
  let best = 0;
  for (const pattern of [faq.question.en, ...faq.patterns.en]) {
    const np = normalise(pattern);
    // Whole phrase present (e.g. "forgot my password" inside a longer sentence)
    if (np.length >= 6 && nq.includes(np)) {
      // Longer exact phrases are stronger evidence than word overlap
      best = Math.max(best, Math.min(1, 0.95 + np.length / 400));
      continue;
    }
    const p = enTokens(pattern);
    if (!p.length || !qSet.size) continue;
    const matched = p.filter((t) => qSet.has(t)).length;
    if (!matched) continue;
    const recall = matched / p.length; // how much of the pattern the user said
    const precision = matched / qSet.size; // how much of the user's words are explained
    best = Math.max(best, Math.min(0.94, 0.65 * recall + 0.35 * precision));
  }
  return best;
}

function scoreJapanese(query: string, faq: FaqEntry): number {
  const q = jaCompact(query);
  if (!q) return 0;
  const qGrams = bigrams(q);
  let best = 0;
  for (const pattern of [faq.question.ja, ...faq.patterns.ja]) {
    const p = jaCompact(pattern);
    if (!p) continue;
    if (q.includes(p)) {
      // Longer contained phrases are stronger evidence; scale by coverage
      const coverage = p.length / q.length;
      const base = p.length >= 4 ? 0.8 : 0.66;
      best = Math.max(best, Math.min(1, base + 0.25 * coverage));
      continue;
    }
    best = Math.max(best, dice(qGrams, bigrams(p)));
  }
  return best;
}

/** Best FAQ for a question, or null when nothing matches confidently. */
export function matchFaq(text: string, lang: FaqLang): FaqMatch | null {
  const trimmed = text.trim();
  if (trimmed.length < 2 || needsAi(trimmed)) return null;

  const useJa = hasJapanese(trimmed) || (lang === "ja" && !/[a-z]{3,}/i.test(trimmed));
  let best: FaqMatch | null = null;
  for (const faq of FAQS) {
    const score = useJa ? scoreJapanese(trimmed, faq) : scoreEnglish(trimmed, faq);
    if (!best || score > best.score) best = { faq, score };
  }
  return best && best.score >= FAQ_THRESHOLD ? best : null;
}

/** Answer language: follow the user's script, falling back to the site language. */
export function answerLanguage(text: string, siteLang: FaqLang): FaqLang {
  if (hasJapanese(text)) return "ja";
  if (/[a-z]{3,}/i.test(text)) return "en";
  return siteLang;
}
