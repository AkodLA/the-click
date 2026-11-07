import "server-only";
import { env } from "./env";

/**
 * T23 "Say it in Norwegian", server side. Two paid ElevenLabs calls, both capped hard:
 *  - transcribeEnglish(): what the learner said in English → text (Scribe). Audio is passed through, never stored.
 *  - speakNorwegian(): the Norwegian message → an mp3 "voice message" (text-to-speech).
 * Free text costs credits, so the routes limit length, rate per minute AND a daily total per IP.
 */
export const SAY_LIMITS = {
  maxAudioBytes: 2 * 1024 * 1024,
  maxSeconds: 15,
  allowedTypes: ["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg", "audio/wav", "audio/x-m4a", "audio/aac"],
  /** Longest message that can become a voice message (about two short sentences). */
  maxVoiceChars: 300,
  listenPerMinute: 6,
  voicePerMinute: 10,
  /** Per IP per day, each. */
  perDay: 40,
} as const;

// Same premade multilingual voice and model as the phrasebook audio (src/app/api/tts/route.ts).
const VOICE_ID = "EXAVITQu4vr4xnJGR5aE";
const MODEL_ID = "eleven_multilingual_v2";

export class SayError extends Error {
  constructor(public code: "not_configured" | "failed", message: string) {
    super(message);
  }
}

/** What this server can do for /say. Booleans only, never a key or an id. */
export function sayConfig() {
  const e = env();
  return {
    listen: Boolean(e.ELEVENLABS_API_KEY),
    voice: Boolean(e.ELEVENLABS_API_KEY),
    agent: Boolean(e.ELEVENLABS_API_KEY && e.ELEVENLABS_MESSAGE_AGENT_ID),
  };
}

function apiKey(): string {
  const key = env().ELEVENLABS_API_KEY;
  if (!key) throw new SayError("not_configured", "ELEVENLABS_API_KEY is not set on the server");
  return key;
}

/** English speech → text (ElevenLabs Scribe). */
export async function transcribeEnglish(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append("model_id", "scribe_v2");
  form.append("language_code", "eng");
  form.append("tag_audio_events", "false");
  form.append("file", audio, "speech");
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey() },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    console.error("say: STT failed", res.status); // status only: never the key or the audio
    throw new SayError("failed", "Speech-to-text failed");
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/** The same message twice costs credits once (per server instance). */
const voiceCache = new Map<string, ArrayBuffer>();
const MAX_CACHE = 100;

/** Norwegian text → mp3. `slow` makes a slower version for beginners. */
export async function speakNorwegian(text: string, slow: boolean): Promise<ArrayBuffer> {
  const key = `${slow ? "slow" : "normal"}:${text}`;
  const hit = voiceCache.get(key);
  if (hit) return hit;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": apiKey(), "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { speed: slow ? 0.8 : 1 },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    console.error("say: TTS failed", res.status);
    throw new SayError("failed", "Text-to-speech failed");
  }
  const audio = await res.arrayBuffer();
  if (voiceCache.size >= MAX_CACHE) voiceCache.delete(voiceCache.keys().next().value as string);
  voiceCache.set(key, audio);
  return audio;
}
