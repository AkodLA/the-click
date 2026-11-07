import { z } from "zod";
import { fail, parseBody } from "@/lib/api";
import { getPhrase } from "@/lib/content";
import { env } from "@/server/env";
import { clientIp, rateLimit } from "@/server/rate-limit";

/**
 * POST /api/tts  { phraseId, part: "text" | "example" }  ->  audio/mpeg
 * Reads a phrase (or its example sentence) aloud with ElevenLabs text-to-speech. Owner: T7.
 * Only text from OUR phrasebook can be spoken (no free text), so this can't be abused as a free TTS proxy.
 * Not configured -> 503 "not_configured", and the browser falls back to the built-in voice.
 */

// A premade multilingual ElevenLabs voice. Not a secret; swap it for the team's chosen Norwegian voice.
const VOICE_ID = "EXAVITQu4vr4xnJGR5aE";
const MODEL_ID = "eleven_multilingual_v2";

const bodySchema = z.object({
  phraseId: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/i),
  part: z.enum(["text", "example"]).default("text"),
});

/** Same phrase -> same audio, so keep it in memory and spend ElevenLabs credits only once per instance. */
const cache = new Map<string, ArrayBuffer>();
const MAX_CACHE = 200;

/** What we actually say: drop hints like "(+ adjective)" from the phrase text. */
function spokenText(raw: string): string {
  return raw.replace(/\s*\([^)]*\)/g, "").trim();
}

export async function POST(req: Request) {
  const limit = rateLimit(`tts:${clientIp(req)}`, 30, 60_000);
  if (!limit.ok) return fail("rate_limited", `Slow down. Retry in ${limit.retryAfterSec}s`, 429);

  const body = await parseBody(req, bodySchema, 1024);
  if (!body.success) return body.response;

  const phrase = getPhrase(body.data.phraseId);
  if (!phrase) return fail("not_found", "Unknown phrase", 404);
  const text = spokenText(body.data.part === "example" ? phrase.example.no : phrase.text);

  const { ELEVENLABS_API_KEY } = env();
  if (!ELEVENLABS_API_KEY) return fail("not_configured", "Text-to-speech is not set up", 503);

  const key = `${phrase.id}:${body.data.part}`;
  let audio = cache.get(key);
  if (!audio) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: MODEL_ID }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        console.error("tts failed", res.status);
        return fail("tts_failed", "Couldn't create audio right now", 502);
      }
      audio = await res.arrayBuffer();
    } catch (err) {
      console.error("tts error", err);
      return fail("tts_failed", "Couldn't create audio right now", 502);
    }
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value as string);
    cache.set(key, audio);
  }

  return new Response(audio, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
  });
}
