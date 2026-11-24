/**
 * Page-wide English → Japanese UI translation.
 *
 * Most screens were written with English text in JSX. Instead of threading a
 * translation key through every component, this layer translates the rendered
 * UI from one central dictionary (lib/i18n/jaDictionary.ts):
 *
 *  - Text nodes and the placeholder / title / aria-label / alt attributes are
 *    swapped for their Japanese version when the language is "ja".
 *  - A MutationObserver keeps newly rendered or updated UI translated.
 *  - Switching back to "en" restores every original string.
 *  - Anything inside [data-no-translate] / [translate="no"] (user content such
 *    as messages and names), form field values, code and SVG is never touched.
 *
 * React keeps owning the DOM: we only change the *value* of existing text nodes
 * and attributes (never add or remove nodes), so reconciliation is unaffected.
 * When React updates a node we translated, the observer sees the new English
 * value, records it as the new original and translates it again.
 */
import { JA_DICT, JA_PATTERNS } from "./jaDictionary";

type Rec = { orig: string; tr: string };

const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE", "svg", "SVG", "IFRAME"]);

const textRecs = new WeakMap<Text, Rec>();
const touchedText = new Set<Text>();
const attrRecs = new WeakMap<Element, Map<string, Rec>>();
const touchedEls = new Set<Element>();

/* -------------------------------------------------------------------------- */
/* String translation                                                         */
/* -------------------------------------------------------------------------- */

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

const MONTHS: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Sept: 9, Oct: 10, Nov: 11, Dec: 12 };

/** Dates, relative times and other formats produced by the app's helpers. */
function translateFormat(s: string): string | null {
  let m = s.match(/^(\d{1,2}) ([A-Z][a-z]{2,3}) (\d{4})$/); // 24 Nov 2026
  if (m && MONTHS[m[2]]) return `${m[3]}年${MONTHS[m[2]]}月${m[1]}日`;
  m = s.match(/^(\d{1,2}) ([A-Z][a-z]{2,3})$/); // 24 Nov
  if (m && MONTHS[m[2]]) return `${MONTHS[m[2]]}月${m[1]}日`;
  m = s.match(/^(\d{1,2}) ([A-Z][a-z]{2,3}), (\d{1,2}:\d{2})$/); // 24 Nov, 13:04
  if (m && MONTHS[m[2]]) return `${MONTHS[m[2]]}月${m[1]}日 ${m[3]}`;
  m = s.match(/^(\d+)([mhd])$/); // 5m, 2h, 3d (timeAgo)
  if (m) return `${m[1]}${{ m: "分", h: "時間", d: "日" }[m[2] as "m" | "h" | "d"]}`;
  m = s.match(/^(\d+)([mhd]) ago$/);
  if (m) return `${m[1]}${{ m: "分前", h: "時間前", d: "日前" }[m[2] as "m" | "h" | "d"]}`;
  m = s.match(/^(\d{1,2}):(\d{2}) ?(AM|PM|am|pm)$/); // 2:30 PM
  if (m) return `${/p/i.test(m[3]) ? "午後" : "午前"}${m[1]}:${m[2]}`;
  return null;
}

type Compiled = { re: RegExp; ja: string };
let compiled: Compiled[] | null = null;
function patterns(): Compiled[] {
  if (compiled) return compiled;
  compiled = JA_PATTERNS.map(([en, ja]) => {
    // {0} matches any text, {n0} matches a number only
    const src = en
      .split(/(\{n?\d\})/)
      .map((part) =>
        /^\{n\d\}$/.test(part) ? "([\\d,.+]+)" : /^\{\d\}$/.test(part) ? "(.+?)" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      )
      .join("");
    return { re: new RegExp(`^${src}$`), ja };
  });
  return compiled;
}

/** Translates a captured value inside a pattern (e.g. a category name or date). */
function translatePiece(s: string): string {
  const k = norm(s);
  return JA_DICT[k] ?? translateFormat(k) ?? s;
}

/** Returns the Japanese text for an English UI string, or null if unknown. */
export function translateString(text: string): string | null {
  const key = norm(text);
  if (!key || !/[A-Za-z]/.test(key)) return null;
  const direct = JA_DICT[key] ?? translateFormat(key);
  if (direct) return direct;
  for (const { re, ja } of patterns()) {
    const m = key.match(re);
    if (m) return ja.replace(/\{(\d)\}/g, (_, i) => translatePiece(m[Number(i) + 1] ?? ""));
  }
  return null;
}

/** Keeps the original leading/trailing whitespace around a translation. */
function withSpacing(original: string, translated: string) {
  const lead = original.match(/^\s*/)![0];
  const trail = original.match(/\s*$/)![0];
  return (lead ? " " : "") + translated + (trail ? " " : "");
}

/* -------------------------------------------------------------------------- */
/* DOM                                                                        */
/* -------------------------------------------------------------------------- */

function skipped(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName)) return true;
    if (e.hasAttribute("data-no-translate") || e.getAttribute("translate") === "no" || (e as HTMLElement).isContentEditable) return true;
    if (e.id === "__next" || e === document.body) return false;
  }
  return false;
}

/** The English value a text node should have right now. */
function originalOf(node: Text): string {
  const value = node.nodeValue ?? "";
  const rec = textRecs.get(node);
  if (!rec) return value;
  if (value === rec.tr) return rec.orig;
  return value; // React changed it since we translated: that's the new original
}

function setText(node: Text, orig: string, tr: string) {
  textRecs.set(node, { orig, tr });
  touchedText.add(node);
  if (node.nodeValue !== tr) node.nodeValue = tr;
}

/**
 * Translates the direct text children of an element. When an element's
 * children are all text (React splits `Showing {a} of {b} posts` into several
 * text nodes) the joined sentence is translated as a whole first.
 */
function translateChildren(el: Element) {
  if (skipped(el)) return;
  const texts: Text[] = [];
  let onlyText = true;
  el.childNodes.forEach((c) => {
    if (c.nodeType === Node.TEXT_NODE) texts.push(c as Text);
    else if (c.nodeType === Node.ELEMENT_NODE) onlyText = false;
  });
  if (texts.length === 0) return;

  if (onlyText && texts.length > 1) {
    const origs = texts.map(originalOf);
    const joined = origs.join("");
    const tr = translateString(joined);
    if (tr) {
      texts.forEach((t, i) => setText(t, origs[i], i === 0 ? withSpacing(joined, tr) : ""));
      return;
    }
  }
  for (const t of texts) {
    const orig = originalOf(t);
    const tr = translateString(orig);
    if (tr) setText(t, orig, withSpacing(orig, tr));
    else if (textRecs.has(t)) textRecs.delete(t); // React replaced it with untranslatable text
  }
}

function translateAttrs(el: Element) {
  // A textarea's own placeholder / label is UI text even though its content isn't
  if (el.tagName === "TEXTAREA" ? skipped(el.parentElement) : skipped(el)) return;
  for (const name of ATTRS) {
    const value = el.getAttribute(name);
    if (value === null) continue;
    let map = attrRecs.get(el);
    const rec = map?.get(name);
    const orig = rec && value === rec.tr ? rec.orig : value;
    const tr = translateString(orig);
    if (!tr) continue;
    if (!map) attrRecs.set(el, (map = new Map()));
    map.set(name, { orig, tr });
    touchedEls.add(el);
    if (value !== tr) el.setAttribute(name, tr);
  }
}

function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (root.parentElement) translateChildren(root.parentElement);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (skipped(el)) return;
  translateChildren(el);
  translateAttrs(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => {
      const e = n as Element;
      if (SKIP_TAGS.has(e.tagName) || e.hasAttribute("data-no-translate") || e.getAttribute("translate") === "no") return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    translateChildren(n as Element);
    translateAttrs(n as Element);
  }
  // Textareas are rejected by the walker (their content is user text), but their
  // placeholder and aria-label still need translating
  el.querySelectorAll("textarea").forEach(translateAttrs);
}

function restoreAll() {
  touchedText.forEach((t) => {
    const rec = textRecs.get(t);
    if (rec && t.nodeValue === rec.tr) t.nodeValue = rec.orig;
    textRecs.delete(t);
  });
  touchedText.clear();
  touchedEls.forEach((el) => {
    attrRecs.get(el)?.forEach((rec, name) => {
      if (el.getAttribute(name) === rec.tr) el.setAttribute(name, rec.orig);
    });
    attrRecs.delete(el);
  });
  touchedEls.clear();
}

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                  */
/* -------------------------------------------------------------------------- */

let observer: MutationObserver | null = null;
let originalTitle: string | null = null;

function translateTitle() {
  const current = document.title;
  if (originalTitle !== null && current === translateString(originalTitle)) return;
  const tr = translateString(current);
  if (tr) {
    originalTitle = current;
    document.title = tr;
  }
}

export function startJapaneseTranslation() {
  if (typeof document === "undefined") return;
  translateTree(document.body);
  translateTitle();
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    const parents = new Set<Element>();
    for (const m of mutations) {
      if (m.type === "childList") m.addedNodes.forEach((n) => translateTree(n));
      else if (m.type === "characterData" && m.target.parentElement) parents.add(m.target.parentElement);
      else if (m.type === "attributes") translateAttrs(m.target as Element);
    }
    parents.forEach(translateChildren);
    translateTitle();
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  });
}

export function stopJapaneseTranslation() {
  observer?.disconnect();
  observer = null;
  restoreAll();
  if (originalTitle !== null) {
    if (document.title === translateString(originalTitle)) document.title = originalTitle;
    originalTitle = null;
  }
}
