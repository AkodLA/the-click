/**
 * T22: what we "teach" the on-device translator.
 *
 * 1. Translation memory: every Norwegian sentence in Snakk that a human already translated (phrases, examples,
 *    vocabulary, seasonal words, the Tolk demo) is used FIRST for Norwegian ↔ English. Perfect, instant,
 *    and it works even in browsers without Web AI.
 * 2. Glossary: Norwegian terms that machine translation gets wrong or leaves unexplained (NAV, fastlege, dugnad…).
 *    When they appear, the translation shows a short explanation next to it.
 *
 * The browser model itself can't be retrained; this is how Snakk makes it better for our learners.
 */
import { phrases, vocabWords } from "@/lib/content";

/** Lowercase, drop quotes and end punctuation, collapse spaces (æ ø å kept). */
export function normSentence(s: string): string {
  return s
    .toLowerCase()
    .replace(/[«»"“”'’]/g, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[.!?…,:;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const nbToEn = new Map<string, string>();
const enToNb = new Map<string, string>();

function pair(no: string, en: string) {
  const n = normSentence(no);
  const e = normSentence(en);
  if (n && !nbToEn.has(n)) nbToEn.set(n, en);
  if (e && !enToNb.has(e) && !en.includes("/")) enToNb.set(e, no);
}

for (const p of phrases) {
  pair(p.example.no, p.example.en);
  pair(p.text, p.meaning);
}
for (const w of vocabWords) {
  pair(w.example.no, w.example.en);
  pair(w.no, w.en);
  pair(w.no.replace(/^(en|ei|et|å)\s+/i, ""), w.en.replace(/^(a|an|to|the)\s+/i, ""));
}

/** A human-checked translation from our content, if we have one for this exact sentence or word. */
export function fromMemory(text: string, from: string, to: string): string | undefined {
  const key = normSentence(text);
  if (from === "nb" && to === "en") return nbToEn.get(key);
  if (from === "en" && to === "nb") return enToNb.get(key);
  return undefined;
}

export const memorySize = () => ({ nbToEn: nbToEn.size, enToNb: enToNb.size });

// ---------- glossary ----------

export interface GlossaryNote {
  term: string;
  explain: string;
}

/**
 * Norwegian terms worth explaining, not just translating. Keys are lowercase stems (matched at word start,
 * so «fastlegen», «NAV-kontoret» and «barnehagen» match too).
 */
/** `exact`: whole word only (short words that are also the start of other words: «nav» vs «navn», «russ» vs «russisk»). */
const GLOSSARY: { stem: string; term: string; explain: string; exact?: boolean }[] = [
  { exact: true, stem: "nav", term: "NAV", explain: "the Norwegian Labour and Welfare Administration (jobs, benefits, sick pay)" },
  { stem: "fastlege", term: "fastlege", explain: "your regular GP: every resident has one" },
  { stem: "legevakt", term: "legevakt", explain: "the out-of-hours emergency clinic (call 116 117)" },
  { stem: "helsenorge", term: "Helsenorge", explain: "the public health website and app" },
  { stem: "barnehage", term: "barnehage", explain: "kindergarten / daycare (ages 1–5)" },
  { exact: true, stem: "sfo", term: "SFO", explain: "after-school care at primary school" },
  { stem: "foreldremøte", term: "foreldremøte", explain: "a meeting for all parents of a class" },
  { stem: "utviklingssamtale", term: "utviklingssamtale", explain: "a one-to-one parent-teacher talk about your child's progress" },
  { stem: "kommune", term: "kommune", explain: "the municipality (local council)" },
  { stem: "skatteetaten", term: "Skatteetaten", explain: "the Norwegian Tax Administration" },
  { stem: "bankid", term: "BankID", explain: "the digital ID used to log in to banks and public services" },
  { stem: "vipps", term: "Vipps", explain: "the mobile payment app most Norwegians use" },
  { stem: "fødselsnummer", term: "fødselsnummer", explain: "the 11-digit national ID number" },
  { stem: "d-nummer", term: "D-nummer", explain: "a temporary ID number for people without a fødselsnummer" },
  { exact: true, stem: "udi", term: "UDI", explain: "the Directorate of Immigration (residence permits)" },
  { stem: "introduksjonsprogram", term: "introduksjonsprogrammet", explain: "the municipality's programme for new refugees (language + work)" },
  { stem: "norskprøve", term: "Norskprøven", explain: "the official Norwegian language test" },
  { stem: "lånekassen", term: "Lånekassen", explain: "the State Educational Loan Fund" },
  { stem: "dugnad", term: "dugnad", explain: "voluntary group work, e.g. cleaning the neighbourhood together" },
  { exact: true, stem: "russ", term: "russ", explain: "final-year school students celebrating in spring" },
  { stem: "matpakke", term: "matpakke", explain: "a packed lunch, usually open sandwiches" },
  { stem: "hytt", term: "hytte", explain: "a holiday cabin in the mountains or by the sea" },
  { exact: true, stem: "ruter", term: "Ruter", explain: "public transport in Oslo and Akershus" },
  { stem: "bunad", term: "bunad", explain: "traditional regional costume, worn on 17 May" },
  { stem: "koselig", term: "koselig", explain: "cosy, warm and nice; a very Norwegian feeling" },
  { stem: "takk for sist", term: "takk for sist", explain: "«thanks for last time»: said when you meet someone again" },
];

/** Glossary terms found in a Norwegian text (each once). */
export function glossaryNotes(norwegian: string): GlossaryNote[] {
  const text = ` ${norwegian.toLowerCase().replace(/[«»"“”.,!?:;()]/g, " ")} `;
  const found: GlossaryNote[] = [];
  for (const g of GLOSSARY) {
    // Stems are plain letters, spaces and hyphens (a hyphen outside [] needs no escape; "\\-" is invalid with the u flag).
    const stem = g.stem;
    // Exact terms may be followed by a hyphen («NAV-kontoret») but not by more letters («navn»).
    const re = g.exact ? new RegExp(`[\\s-]${stem}(?=[\\s-])`, "u") : new RegExp(`[\\s-]${stem}`, "u");
    if (re.test(text) && !found.some((f) => f.term === g.term)) found.push({ term: g.term, explain: g.explain });
  }
  return found;
}

/** How close two texts are (0–1), by shared words. Used for the round-trip check. */
export function similarity(a: string, b: string): number {
  const wa = new Set(normSentence(a).split(" ").filter(Boolean));
  const wb = new Set(normSentence(b).split(" ").filter(Boolean));
  if (!wa.size || !wb.size) return 0;
  let shared = 0;
  wa.forEach((w) => wb.has(w) && shared++);
  return shared / Math.max(wa.size, wb.size);
}
