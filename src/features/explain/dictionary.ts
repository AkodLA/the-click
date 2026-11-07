/**
 * T21 explain-a-word: a tiny dictionary built from OUR content (phrases + vocabulary packs).
 * Finds inflected forms with a simple suffix strip («pallen» → «pall», «hyllene» → «hylle»).
 * Unknown words fall back to on-device translation in the UI.
 */
import { phrases, vocabPacks } from "@/lib/content";
import type { CefrLevel, Register } from "@/lib/content/types";

export interface DictEntry {
  /** As written in our content, e.g. "en pall". */
  headword: string;
  en: string;
  register: Register;
  level: CefrLevel;
  example?: { no: string; en: string };
  /** Where to learn more. */
  href: string;
}

export const normWord = (s: string) => s.toLowerCase().replace(/[^a-zæøå0-9-]/g, "");

const index = new Map<string, DictEntry>();
function add(key: string, e: DictEntry) {
  const k = normWord(key);
  if (k.length >= 2 && !index.has(k)) index.set(k, e);
}

for (const pack of vocabPacks) {
  for (const w of pack.words) {
    const entry: DictEntry = { headword: w.no, en: w.en, register: w.register, level: w.level, example: w.example, href: `/words?pack=${pack.id}` };
    // "en vakt" → "vakt"; "å bore" → "bore"; multi-word entries also by their last word
    const bare = w.no.replace(/^(en|ei|et|å)\s+/i, "");
    add(bare, entry);
    if (bare.includes(" ")) add(bare.split(" ").pop() ?? bare, entry);
  }
}
for (const p of phrases) {
  const entry: DictEntry = { headword: p.text, en: p.meaning, register: p.register, level: p.level, example: p.example, href: `/phrases?id=${p.id}` };
  for (const variant of p.text.replace(/\([^)]*\)/g, "").replace(/…/g, "").split("/")) {
    const v = variant.trim().replace(/-$/, "");
    if (!v.includes(" ")) add(v, entry);
  }
}

const SUFFIXES = ["ene", "ane", "en", "et", "er", "ar", "a", "e", "r", "s"];

export function lookup(word: string): DictEntry | undefined {
  const w = normWord(word);
  if (index.has(w)) return index.get(w);
  for (const suf of SUFFIXES) {
    if (w.length > suf.length + 2 && w.endsWith(suf)) {
      const stem = w.slice(0, -suf.length);
      if (index.has(stem)) return index.get(stem);
      if (index.has(`${stem}e`)) return index.get(`${stem}e`);
    }
  }
  return undefined;
}

export const dictionarySize = () => index.size;
