"use client";
/**
 * Free, instant Norwegian audio from the browser's own voice (no API key, no cost).
 * Quality depends on the device; most phones have a Norwegian voice. Used by T4 (listen questions) and T5.
 */

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Say Norwegian text out loud. `slow` is for beginners. Returns false if the browser can't speak. */
export function speakNorwegian(text: string, { slow = false }: { slow?: boolean } = {}): boolean {
  if (!canSpeak()) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "nb-NO";
  u.rate = slow ? 0.65 : 0.9;
  const voice = window.speechSynthesis.getVoices().find((v) => /^(nb|no|nn)/i.test(v.lang));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}
