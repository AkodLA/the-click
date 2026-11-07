import { z } from "zod";
import { fail, parseBody } from "@/lib/api";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { SAY_LIMITS, SayError, speakNorwegian } from "@/server/say";

/**
 * POST /api/say/voice  { text, slow? }  ->  audio/mpeg
 * T23: turn the learner's Norwegian message into a voice message (ElevenLabs text-to-speech).
 * Free text costs credits, so: max 300 characters, letters only (no markup/URLs), per-minute AND daily caps per IP.
 * Not configured -> 503, and the browser reads it with its own voice instead.
 */
const bodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1)
    .max(SAY_LIMITS.maxVoiceChars)
    // Plain sentences only: no SSML/tags, no links (this is not a general TTS proxy).
    .refine((t) => !/[<>{}\[\]\\]|https?:|www\./i.test(t), "Only plain text"),
  slow: z.boolean().default(false),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const minute = rateLimit(`say-voice:${ip}`, SAY_LIMITS.voicePerMinute, 60_000);
  if (!minute.ok) return fail("rate_limited", `Slow down. Retry in ${minute.retryAfterSec}s`, 429);

  const body = await parseBody(req, bodySchema, 2048);
  if (!body.success) return body.response;

  const day = rateLimit(`say-voice-day:${ip}`, SAY_LIMITS.perDay, 86_400_000);
  if (!day.ok) return fail("rate_limited", "That's today's limit for voice messages. Use 🔊 Listen instead.", 429);

  try {
    const audio = await speakNorwegian(body.data.text, body.data.slow);
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof SayError && err.code === "not_configured") return fail("not_configured", "Voice messages aren't set up on this server yet", 503);
    return fail("tts_failed", "Couldn't create the voice message right now", 502);
  }
}
