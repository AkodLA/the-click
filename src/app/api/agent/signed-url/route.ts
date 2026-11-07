import { z } from "zod";
import { fail, ok, parseBody } from "@/lib/api";
import { getScenario } from "@/lib/content";
import { env } from "@/server/env";
import { clientIp, rateLimit } from "@/server/rate-limit";

/**
 * POST /api/agent/signed-url  { mode: "tutor" | "tolk" | "message", scenarioId? }  ->  { signedUrl }
 * Gives the browser a short-lived signed URL to start an ElevenLabs voice session.
 * The API key never leaves the server. Shared by T2 (tutor), T8 (Tolk) and T23 (message, text only).
 * Voice sessions cost money, so this is rate-limited per IP.
 */
const bodySchema = z.object({
  mode: z.enum(["tutor", "tolk", "message"]),
  scenarioId: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/i).optional(),
});

export async function POST(req: Request) {
  const limit = rateLimit(`agent:${clientIp(req)}`, 10, 60_000);
  if (!limit.ok) return fail("rate_limited", `Too many sessions. Retry in ${limit.retryAfterSec}s`, 429);

  const body = await parseBody(req, bodySchema, 1024);
  if (!body.success) return body.response;
  const { mode, scenarioId } = body.data;

  if (mode === "tutor" && scenarioId && !getScenario(scenarioId)) return fail("not_found", "Unknown scenario", 404);

  const { ELEVENLABS_API_KEY, ELEVENLABS_TUTOR_AGENT_ID, ELEVENLABS_TOLK_AGENT_ID, ELEVENLABS_MESSAGE_AGENT_ID } = env();
  const agentId = { tutor: ELEVENLABS_TUTOR_AGENT_ID, tolk: ELEVENLABS_TOLK_AGENT_ID, message: ELEVENLABS_MESSAGE_AGENT_ID }[mode];
  if (!ELEVENLABS_API_KEY || !agentId) return fail("not_configured", "Voice is not set up yet", 503);

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": ELEVENLABS_API_KEY }, signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) {
      console.error("signed-url failed", res.status);
      return fail("voice_unavailable", "Couldn't start a voice session right now", 502);
    }
    const data = (await res.json()) as { signed_url?: string };
    if (!data.signed_url) return fail("voice_unavailable", "Couldn't start a voice session right now", 502);
    return ok({ signedUrl: data.signed_url });
  } catch (err) {
    console.error("signed-url error", err);
    return fail("voice_unavailable", "Couldn't start a voice session right now", 502);
  }
}
