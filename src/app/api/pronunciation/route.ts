import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { DEFAULT_PROGRESS } from "@/lib/progress/defaults";
import { applyEvent } from "@/server/progress-rules";
import { decodeProgress, encodeProgress } from "@/server/progress-token";
import { comparePronunciation } from "@/server/pronunciation-compare";
import { PRONUNCIATION_LIMITS, resolveTarget, SttError, transcribe } from "@/server/pronunciation";
import { clientIp, rateLimit } from "@/server/rate-limit";

const fieldsSchema = z.object({
  target: z.string().trim().min(1).max(300),
  token: z.string().max(20_000).nullable(),
});

/**
 * POST /api/pronunciation  (multipart/form-data: audio, target, token)
 * Audio → ElevenLabs speech-to-text → compare with the target → score.
 * The server applies the internal `pronunciation_scored` event itself, so the browser can't fake a score.
 * The audio is passed straight through and never stored.
 */
export async function POST(req: Request) {
  // This route costs money per call: tighter limit than the progress route.
  const limit = rateLimit(`pron:${clientIp(req)}`, 12, 60_000);
  if (!limit.ok) return fail("rate_limited", `Slow down. Retry in ${limit.retryAfterSec}s`, 429);

  // Reject big uploads before reading them (+16 KB for the other form fields).
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > PRONUNCIATION_LIMITS.maxBytes + 16_384) return fail("too_large", "Recording is too long (max 15 s)", 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("invalid_input", "Expected multipart/form-data");
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) return fail("invalid_input", "Missing audio");
  if (audio.size > PRONUNCIATION_LIMITS.maxBytes) return fail("too_large", "Recording is too long (max 15 s)", 413);
  const mime = audio.type.split(";")[0].trim().toLowerCase();
  if (!(PRONUNCIATION_LIMITS.allowedTypes as readonly string[]).includes(mime)) {
    return fail("invalid_input", "Unsupported audio format");
  }

  const fields = fieldsSchema.safeParse({ target: form.get("target"), token: form.get("token") || null });
  if (!fields.success) return fail("invalid_input", z.prettifyError(fields.error));

  const target = resolveTarget(fields.data.target);
  if (!target) return fail("unknown_target", "You can only practise sentences from Snakk", 400);

  const current = fields.data.token ? decodeProgress(fields.data.token) : DEFAULT_PROGRESS;
  if (!current) return fail("invalid_token", "Progress token is invalid or was modified", 400);

  let heard: string;
  try {
    heard = await transcribe(audio);
  } catch (err) {
    if (err instanceof SttError && err.code === "not_configured") {
      return fail("not_configured", "Pronunciation check isn't set up on this server yet", 503);
    }
    console.error("pronunciation stt failed", err instanceof Error ? err.message : err);
    return fail("stt_failed", "Couldn't check that recording. Try again.", 502);
  }

  const result = comparePronunciation(target, heard);
  try {
    const { progress, rewards } = applyEvent(current, { type: "pronunciation_scored", score: result.score });
    return ok({ result, token: encodeProgress(progress), progress, rewards });
  } catch (err) {
    console.error("pronunciation progress failed", err);
    return fail("internal", "Something went wrong", 500);
  }
}
