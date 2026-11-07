import { fail, ok } from "@/lib/api";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { SAY_LIMITS, SayError, transcribeEnglish } from "@/server/say";

/**
 * POST /api/say/transcribe  (multipart/form-data: audio)  ->  { text }
 * T23: what the learner said in English, as text. ElevenLabs speech-to-text; the audio is never stored.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const minute = rateLimit(`say-listen:${ip}`, SAY_LIMITS.listenPerMinute, 60_000);
  if (!minute.ok) return fail("rate_limited", `Slow down. Retry in ${minute.retryAfterSec}s`, 429);
  const day = rateLimit(`say-listen-day:${ip}`, SAY_LIMITS.perDay, 86_400_000);
  if (!day.ok) return fail("rate_limited", "That's today's limit for recordings. Type your message instead.", 429);

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > SAY_LIMITS.maxAudioBytes + 16_384) return fail("too_large", "Recording is too long (max 15 s)", 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("invalid_input", "Expected multipart/form-data");
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) return fail("invalid_input", "Missing audio");
  if (audio.size > SAY_LIMITS.maxAudioBytes) return fail("too_large", "Recording is too long (max 15 s)", 413);
  const mime = audio.type.split(";")[0].trim().toLowerCase();
  if (!(SAY_LIMITS.allowedTypes as readonly string[]).includes(mime)) return fail("invalid_input", "Unsupported audio format");

  try {
    const text = (await transcribeEnglish(audio)).slice(0, 500);
    if (!text) return fail("nothing_heard", "We didn't catch that. Try again a bit closer to the mic.", 422);
    return ok({ text });
  } catch (err) {
    if (err instanceof SayError && err.code === "not_configured") return fail("not_configured", "Listening isn't set up on this server yet", 503);
    return fail("stt_failed", "Couldn't understand the recording right now", 502);
  }
}
