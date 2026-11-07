/**
 * On-device translation with the browser's built-in Translator API (T19).
 * - Opera: "Web AI" (https://next.opera.com/web-ai/translator/), turn on Settings → Opera AI → «Enable Web AI API».
 * - Chrome: the same `Translator` / `LanguageDetector` API (Opera uses the same shape, so one code path).
 * The model runs on the user's device: no server, no API key, and the text never leaves the device.
 * That's why this lives in the browser and not in an API route.
 *
 *   const r = await translateText("Hei, hvordan går det?", "nb", "en", (p) => setProgress(p));
 *   if (r.ok) r.text; else r.reason   // "unsupported" | "unavailable" | "failed"
 *
 * T22 improvements (checked against Opera's own playground code, which uses exactly this API):
 *  - Norwegian is "no" in Opera/Chrome's language list, so we ask for "no" first (then "nb").
 *  - Our human-checked translations (src/lib/web-ai/memory.ts) are used first for Norwegian ↔ English.
 *  - Glossary notes explain Norwegian terms (NAV, fastlege…) next to the translation.
 *  - Long texts go sentence by sentence; calls can be aborted; translators are freed when the page is left.
 *  - checkTranslation(): translate back and compare, so the learner sees how much to trust it.
 */
import { fromMemory, glossaryNotes, similarity, type GlossaryNote } from "./memory";

// ---- types for the (new) browser API, kept local so nothing else needs them ----
type Availability = "unavailable" | "downloadable" | "downloading" | "available";
interface DownloadMonitor {
  addEventListener(type: "downloadprogress", listener: (e: Event & { loaded: number }) => void): void;
}
interface CreateOptions {
  monitor?: (m: DownloadMonitor) => void;
  signal?: AbortSignal;
}
interface BrowserTranslator {
  translate(text: string, options?: { signal?: AbortSignal }): Promise<string>;
  destroy?(): void;
  /** Optional in the spec: how much input fits (and how much a text uses). */
  inputQuota?: number;
  measureInputUsage?(text: string): Promise<number>;
}
interface TranslatorStatic {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<Availability>;
  create(o: { sourceLanguage: string; targetLanguage: string } & CreateOptions): Promise<BrowserTranslator>;
}
interface BrowserDetector {
  detect(text: string): Promise<{ detectedLanguage: string; confidence: number }[]>;
}
interface DetectorStatic {
  availability(): Promise<Availability>;
  create(o?: CreateOptions): Promise<BrowserDetector>;
}

function api(): { Translator?: TranslatorStatic; LanguageDetector?: DetectorStatic } {
  if (typeof globalThis === "undefined") return {};
  const g = globalThis as unknown as { Translator?: TranslatorStatic; LanguageDetector?: DetectorStatic };
  return { Translator: g.Translator, LanguageDetector: g.LanguageDetector };
}

/** True when this browser has the built-in Translator API at all (it may still need a model download). */
export function translatorSupported(): boolean {
  return typeof api().Translator?.create === "function";
}

/** Our language codes → codes the browser model may use. Opera/Chrome list Norwegian as "no", so try that first. */
const CANDIDATES: Record<string, string[]> = {
  nb: ["no", "nb"],
  fa: ["fa", "prs"],
};
const candidates = (code: string) => CANDIDATES[code] ?? [code];

export type TranslateResult =
  | {
      ok: true;
      text: string;
      /** "memory" = our human-checked translation; "device" = the browser's on-device model. */
      via: "memory" | "device" | "same";
      /** Norwegian terms worth explaining (from the Norwegian side of the pair). */
      notes: GlossaryNote[];
    }
  | { ok: false; reason: "unsupported" | "unavailable" | "failed"; message: string };

export const HOW_TO_ENABLE =
  "Translation runs on your device. Use Opera with Web AI on (Settings → Opera AI → «Enable Web AI API») or a recent Chrome.";

/**
 * Some browsers expose the API but never answer (no model service, e.g. headless or a disabled flag).
 * Every call gets a time limit so the UI can never hang on «Translating…».
 */
class TimeoutError extends Error {}
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError(`timed out after ${ms} ms`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}
const AVAILABILITY_MS = 4000;
const DOWNLOAD_IDLE_MS = 45_000; // a model download may take long, but must keep reporting progress
const TRANSLATE_MS = 20_000;
const DETECT_MS = 3000;

// One translator per language pair, reused (creating one can download a model).
const cache = new Map<string, Promise<BrowserTranslator | null>>();

async function pickPair(from: string, to: string): Promise<{ s: string; t: string; a: Availability } | null> {
  const T = api().Translator;
  if (!T) return null;
  for (const s of candidates(from)) {
    for (const t of candidates(to)) {
      try {
        const a = await withTimeout(T.availability({ sourceLanguage: s, targetLanguage: t }), AVAILABILITY_MS);
        if (a !== "unavailable") return { s, t, a };
      } catch {
        // unknown code for this browser: try the next one
      }
    }
  }
  return null;
}

/** Can this browser translate from → to? "downloadable" means the first use downloads the model. */
export async function translationAvailability(from: string, to: string): Promise<Availability | "unsupported"> {
  if (!translatorSupported()) return "unsupported";
  const pair = await pickPair(from, to);
  return pair?.a ?? "unavailable";
}

async function getTranslator(from: string, to: string, onProgress?: (loaded: number) => void): Promise<BrowserTranslator | null> {
  const key = `${from}>${to}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      const pair = await pickPair(from, to);
      const T = api().Translator;
      if (!pair || !T) return null;
      // Time limit that restarts on every progress event: slow downloads are fine, a silent hang is not.
      return new Promise<BrowserTranslator>((resolve, reject) => {
        let timer = setTimeout(() => reject(new TimeoutError("download stalled")), DOWNLOAD_IDLE_MS);
        const bump = () => {
          clearTimeout(timer);
          timer = setTimeout(() => reject(new TimeoutError("download stalled")), DOWNLOAD_IDLE_MS);
        };
        T.create({
          sourceLanguage: pair.s,
          targetLanguage: pair.t,
          monitor: (m) =>
            m.addEventListener("downloadprogress", (e) => {
              bump();
              onProgress?.(e.loaded);
            }),
        }).then(
          (tr) => { clearTimeout(timer); resolve(tr); },
          (err) => { clearTimeout(timer); reject(err); },
        );
      });
    })();
    cache.set(key, p);
    p.then((t) => { if (!t) cache.delete(key); }, () => cache.delete(key)); // let the learner retry later
  }
  return p;
}

/** Split long text into sentence-sized pieces (keeps the model inside its input quota). */
function pieces(text: string, max = 400): string[] {
  if (text.length <= max) return [text];
  const sentences = text.match(/[^.!?\n]+[.!?]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur);
      cur = "";
    }
    cur += s;
  }
  if (cur) out.push(cur);
  return out;
}

const notesFor = (from: string, to: string, source: string, result: string) =>
  from === "nb" ? glossaryNotes(source) : to === "nb" ? glossaryNotes(result) : [];

/**
 * Translate. Order: our human-checked memory (nb ↔ en) → the browser's on-device model.
 * Call it from a click (the first use may download a model, which needs a user gesture).
 * Never throws: returns a reason the UI can show.
 */
export async function translateText(
  text: string,
  from: string,
  to: string,
  onProgress?: (loaded: number) => void,
  opts: { signal?: AbortSignal; memory?: boolean } = {},
): Promise<TranslateResult> {
  const input = text.trim().slice(0, 2000);
  if (!input) return { ok: true, text: "", via: "same", notes: [] };
  if (from === to) return { ok: true, text: input, via: "same", notes: [] };

  if (opts.memory !== false) {
    const known = fromMemory(input, from, to);
    if (known) return { ok: true, text: known, via: "memory", notes: notesFor(from, to, input, known) };
  }

  if (!translatorSupported()) return { ok: false, reason: "unsupported", message: HOW_TO_ENABLE };
  try {
    const t = await getTranslator(from, to, onProgress);
    if (!t) return { ok: false, reason: "unavailable", message: `This browser can't translate this language pair right now. ${HOW_TO_ENABLE}` };
    // Respect the model's input quota when it tells us; otherwise split long text by sentences.
    let parts = pieces(input);
    if (t.measureInputUsage && typeof t.inputQuota === "number" && Number.isFinite(t.inputQuota)) {
      const usage = await withTimeout(t.measureInputUsage(input), TRANSLATE_MS).catch(() => 0);
      if (usage > t.inputQuota) parts = pieces(input, 200);
    }
    const out: string[] = [];
    for (const part of parts) {
      if (opts.signal?.aborted) return { ok: false, reason: "failed", message: "Stopped." };
      out.push(await withTimeout(t.translate(part, { signal: opts.signal }), TRANSLATE_MS));
    }
    const result = out.join(" ").replace(/\s+/g, " ").trim();
    return { ok: true, text: result, via: "device", notes: notesFor(from, to, input, result) };
  } catch (err) {
    if (err instanceof TimeoutError) {
      return { ok: false, reason: "unavailable", message: `On-device translation isn't ready in this browser. ${HOW_TO_ENABLE}` };
    }
    console.error("on-device translation failed", err instanceof Error ? err.message : err);
    return { ok: false, reason: "failed", message: "Translation didn't work this time. Try again." };
  }
}

export type Confidence = "high" | "medium" | "low";

/**
 * Round-trip check (like Opera's playground «Round trip» mode): translate the result back and compare
 * it with the original. High similarity = the meaning probably survived.
 */
export async function checkTranslation(original: string, translated: string, from: string, to: string) {
  const back = await translateText(translated, to, from, undefined, { memory: false });
  if (!back.ok) return null;
  const score = similarity(original, back.text);
  const confidence: Confidence = score >= 0.6 ? "high" : score >= 0.35 ? "medium" : "low";
  return { back: back.text, score, confidence };
}

// Free the on-device models when the learner leaves the page (they can be large).
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    cache.forEach((p) => p.then((t) => t?.destroy?.()).catch(() => undefined));
    cache.clear();
  });
}

/** Which of `options` is this text written in? Uses the browser's LanguageDetector if there is one. */
export async function detectLanguage(text: string, options: string[]): Promise<string | null> {
  const D = api().LanguageDetector;
  if (!D || text.trim().length < 4) return null;
  try {
    const detector = await withTimeout(D.create(), DETECT_MS);
    const results = await withTimeout(detector.detect(text), DETECT_MS);
    for (const r of results) {
      const hit = options.find((o) => candidates(o).includes(r.detectedLanguage));
      if (hit && r.confidence > 0.4) return hit;
    }
  } catch {
    // no detector: the caller decides
  }
  return null;
}
