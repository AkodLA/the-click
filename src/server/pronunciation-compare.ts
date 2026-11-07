import "server-only";
import type { PronunciationResult } from "@/lib/content/types";

/**
 * Pure scoring logic for the pronunciation check (T5). No network, no secrets: easy to test.
 *
 * How it works:
 *  1. Normalise both texts (lowercase, strip punctuation and apostrophes, split on spaces).
 *  2. Align target words with heard words in order (longest common subsequence), allowing
 *     a small spelling difference so "skjera" still matches "skjer'a".
 *  3. Score = % of target words that were heard. Missed words are red, the rest green.
 *
 * Honest limit (say it if a juror asks): speech-to-text measures how *understandable* you are,
 * not phonetics. A strong accent that is still understood scores well. That matches our goal:
 * "Norwegians understand you".
 */

/** Lowercase, remove punctuation (incl. « » ' ’ ...), keep Norwegian letters. */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function splitWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Short words must match exactly ("er" vs "en" is a real mistake); longer words allow 1–2 typos. */
function sameWord(target: string, heard: string): boolean {
  if (target === heard) return true;
  const allowed = target.length >= 8 ? 2 : target.length >= 5 ? 1 : 0;
  return allowed > 0 && editDistance(target, heard) <= allowed;
}

/** For each target word: was it heard (in order)? */
function align(target: string[], heard: string[]): boolean[] {
  const n = target.length;
  const m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = sameWord(target[i], heard[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ok = new Array<boolean>(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (sameWord(target[i], heard[j]) && dp[i][j] === dp[i + 1][j + 1] + 1) {
      ok[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return ok;
}

/** Sound tips for the first missed word. Ordered: most specific first. Learner-facing text is English. */
const SOUND_TIPS: { test: RegExp; tip: (w: string) => string }[] = [
  { test: /skj|sj|kj|tj/, tip: (w) => `«${w}»: «skj/sj» is a soft "sh", and «kj» is like a whispered "h" + "y". Try it slowly.` },
  { test: /^det$/, tip: () => `«det»: the t is silent. Say "deh".` },
  { test: /^hv|^hj/, tip: (w) => `«${w}»: the h is silent. Start straight on the next sound.` },
  { test: /rs/, tip: (w) => `«${w}»: in eastern Norwegian «rs» melts into "sh".` },
  { test: /ø/, tip: (w) => `«${w}»: «ø» is like the "u" in "fur", with rounded lips.` },
  { test: /å/, tip: (w) => `«${w}»: «å» is like the "aw" in "law".` },
  { test: /æ/, tip: (w) => `«${w}»: «æ» is like the "a" in "bad".` },
  { test: /y/, tip: (w) => `«${w}»: «y» is "ee" with rounded lips, like whistling.` },
  { test: /u/, tip: (w) => `«${w}»: Norwegian «u» is very rounded, close to French "u".` },
  { test: /(^|[^aeiouyæøå])g(i|y|ei)/, tip: (w) => `«${w}»: «g» before i/y often sounds like a "y".` },
  { test: /d$/, tip: (w) => `«${w}»: a final «d» is often silent, e.g. «god» = "goo".` },
];

function makeTip(targetWords: string[], ok: boolean[], heardText: string): string {
  if (!heardText.trim()) return "We didn't hear any words. Hold the phone closer and speak a little louder.";
  const missed = targetWords.filter((_, i) => !ok[i]);
  if (missed.length === 0) return "Perfekt! Now try it a bit faster, like in a real conversation.";
  if (missed.length > targetWords.length / 2) return "Slow down and say each word clearly. Speed comes later.";
  const first = missed[0];
  const sound = SOUND_TIPS.find((s) => s.test.test(first));
  return sound ? sound.tip(first) : `Listen for «${first}» and try that word on its own first.`;
}

/** Compare what speech-to-text heard with the target sentence. */
export function comparePronunciation(target: string, heard: string): PronunciationResult {
  // Keep the original spelling for display, but compare normalised words.
  const display = target.split(/\s+/).filter((w) => normalizeWord(w));
  const targetWords = display.map(normalizeWord);
  const ok = align(targetWords, splitWords(heard));
  const hits = ok.filter(Boolean).length;
  const score = targetWords.length ? Math.round((hits / targetWords.length) * 100) : 0;
  return {
    target,
    heard: heard.trim(),
    words: display.map((word, i) => ({ word, ok: ok[i] })),
    score,
    tip: makeTip(targetWords, ok, heard),
  };
}
