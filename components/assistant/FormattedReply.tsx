"use client";

import { Fragment } from "react";

/**
 * Renders an assistant answer with chat-style structure:
 * - paragraphs (blank lines or sentence groups)
 * - numbered steps — on their own lines ("1. ...") or written inline
 *   ("1. Choose a category. 2. Pick a template.") — as a badge list
 * - bullet lists ("- item" / "• item")
 * - **bold** for button names, and 「…」 highlighted in Japanese
 *
 * Works for both stored FAQ answers and AI replies.
 */

type Block =
  | { type: "p"; text: string }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] };

const STEP_LINE = /^\s*(\d{1,2})[.)．、]\s+(.*)$/;
const BULLET_LINE = /^\s*[-•・*]\s+(.*)$/;

/**
 * Finds inline numbered steps ("... 1. Foo. 2. Bar.") and splits them out.
 * Only accepts a run of consecutive numbers starting at 1 with at least 2
 * items, so amounts like "5 MB." or "£15." are not mistaken for steps.
 */
function splitInlineSteps(text: string): { before: string; steps: string[]; after: string } | null {
  const marker = /(^|[\s。．:：])(\d{1,2})[.．]\s*(?=\S)/g;
  const hits: { index: number; start: number; n: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = marker.exec(text))) {
    const n = Number(m[2]);
    const expected = hits.length + 1;
    if (n === expected) hits.push({ index: m.index + m[1].length, start: m.index + m[0].length, n });
    else if (n === 1) {
      hits.length = 0;
      hits.push({ index: m.index + m[1].length, start: m.index + m[0].length, n });
    }
  }
  if (hits.length < 2) return null;

  const before = text.slice(0, hits[0].index).trim();
  const steps: string[] = [];
  for (let i = 0; i < hits.length; i++) {
    const end = i + 1 < hits.length ? hits[i + 1].index : text.length;
    steps.push(text.slice(hits[i].start, end).trim());
  }

  // The last step often continues with a closing remark: keep only its first sentence
  let after = "";
  const last = steps[steps.length - 1];
  const sentenceEnd = firstSentenceEnd(last);
  if (sentenceEnd > 0) {
    steps[steps.length - 1] = last.slice(0, sentenceEnd).trim();
    after = last.slice(sentenceEnd).trim();
  }
  return { before, steps, after };
}

/** Index where the 2nd sentence starts, or -1. (No regex lookbehind: old Safari can't parse it.) */
function firstSentenceEnd(text: string): number {
  for (let i = 0; i < text.length - 1; i++) {
    const ch = text[i];
    if ("。！？".includes(ch)) return i + 1;
    if (".!?".includes(ch) && /\s/.test(text[i + 1])) {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      return j < text.length ? j : -1;
    }
  }
  return -1;
}

export function toBlocks(raw: string): Block[] {
  const blocks: Block[] = [];
  const paragraphs = raw.replace(/\r\n/g, "\n").split(/\n{2,}/);

  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // Line-based lists
    if (lines.some((l) => STEP_LINE.test(l) || BULLET_LINE.test(l))) {
      let pending: string[] = [];
      const flushText = () => {
        if (pending.length) blocks.push({ type: "p", text: pending.join(" ") });
        pending = [];
      };
      for (const line of lines) {
        const step = line.match(STEP_LINE);
        const bullet = line.match(BULLET_LINE);
        const prev = blocks[blocks.length - 1];
        if (step) {
          flushText();
          if (prev?.type === "ol" && !pending.length) prev.items.push(step[2]);
          else blocks.push({ type: "ol", items: [step[2]] });
        } else if (bullet) {
          flushText();
          if (prev?.type === "ul") prev.items.push(bullet[1]);
          else blocks.push({ type: "ul", items: [bullet[1]] });
        } else {
          pending.push(line);
        }
      }
      flushText();
      continue;
    }

    // Inline numbered steps inside a single paragraph
    const text = lines.join(" ");
    const inline = splitInlineSteps(text);
    if (inline) {
      if (inline.before) blocks.push({ type: "p", text: inline.before });
      blocks.push({ type: "ol", items: inline.steps });
      if (inline.after) blocks.push({ type: "p", text: inline.after });
    } else {
      blocks.push({ type: "p", text });
    }
  }
  return blocks;
}

/** **bold** and Japanese 「quoted UI labels」. */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|「[^」]+」)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("「") && part.endsWith("」")) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {part}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function FormattedReply({ text }: { text: string }) {
  const blocks = toBlocks(text);
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === "p") {
          return (
            <p key={i} className="leading-relaxed">
              {renderInline(block.text)}
            </p>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={i} className="space-y-2">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#315B4B] text-xs font-bold text-white"
                    aria-hidden="true"
                  >
                    {j + 1}
                  </span>
                  <span className="flex-1 leading-relaxed">
                    <span className="sr-only">{`Step ${j + 1}: `}</span>
                    {renderInline(item.replace(/[.。]$/, ""))}
                  </span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={i} className="space-y-1.5">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2.5">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#315B4B]" aria-hidden="true" />
                <span className="flex-1 leading-relaxed">{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

/** Plain text for read-aloud: strip formatting symbols but keep the words. */
export function toSpeechText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^\s*[-•・*]\s+/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
