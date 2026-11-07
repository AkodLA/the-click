import "server-only";
import { phrases, placementQuestions, scenarios } from "@/lib/content";
import { env } from "./env";
import { normalizeWord } from "./pronunciation-compare";

/**
 * Pronunciation check (T5), server side:
 *  - resolveTarget(): only sentences from OUR content can be checked (stops people using our
 *    ElevenLabs credits as a free transcription service, and keeps scoring meaningful).
 *  - transcribe(): sends the audio to ElevenLabs Speech-to-Text. The audio is never stored.
 */

export const PRONUNCIATION_LIMITS = {
  /** Max upload size. ~15 s of opus/aac audio is well under this. */
  maxBytes: 2 * 1024 * 1024,
  /** The browser stops recording at this length. (The server enforces size, not duration.) */
  maxSeconds: 15,
  allowedTypes: ["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg", "audio/wav", "audio/x-m4a", "audio/aac"],
} as const;

function key(text: string): string {
  return text.split(/\s+/).map(normalizeWord).filter(Boolean).join(" ");
}

/** Every sentence a learner may practise: phrases, their examples, placement "speak" lines, scenario openers. */
const TARGETS = new Map<string, string>();
function add(text: string | undefined) {
  if (text && key(text)) TARGETS.set(key(text), text);
}
for (const p of phrases) {
  add(p.text);
  add(p.example.no);
  p.sayInstead.forEach(add);
}
for (const q of placementQuestions) if (q.type === "speak") add(q.norwegian);
for (const s of scenarios) add(s.openingLine);

/**
 * `target` may be a phrase id ("digg" → its example sentence), "phrase:<id>" (the phrase itself),
 * or the exact text of a known sentence (punctuation/case don't matter).
 */
export function resolveTarget(target: string): string | null {
  const t = target.trim();
  if (t.startsWith("phrase:")) return phrases.find((p) => p.id === t.slice(7))?.text ?? null;
  const byId = phrases.find((p) => p.id === t);
  if (byId) return byId.example.no;
  return TARGETS.get(key(t)) ?? null;
}

export class SttError extends Error {
  constructor(public code: "not_configured" | "stt_failed", message: string) {
    super(message);
  }
}

/** Speech-to-text with ElevenLabs Scribe, Norwegian. Returns the transcript text. */
export async function transcribe(audio: Blob): Promise<string> {
  const apiKey = env().ELEVENLABS_API_KEY;
  if (!apiKey) throw new SttError("not_configured", "ELEVENLABS_API_KEY is not set on the server");

  const form = new FormData();
  form.append("model_id", "scribe_v2");
  form.append("language_code", "nor");
  form.append("tag_audio_events", "false");
  // No "keyterms" on purpose: hinting the target would make the model "hear" it even when it wasn't said.
  form.append("file", audio, "speech");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    // Log status only. Never log the key or the audio.
    console.error("ElevenLabs STT failed", res.status, (await res.text()).slice(0, 300));
    throw new SttError("stt_failed", "Speech-to-text failed");
  }
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}
