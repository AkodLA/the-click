import { z } from "zod";
import { fail, ok, parseBody } from "@/lib/api";
import { progressEventSchema } from "@/lib/progress/events";
import { checkTutorConversation } from "@/server/conversation-check";
import { applyEvent, RuleError } from "@/server/progress-rules";
import { encodeProgress } from "@/server/progress-token";
import { withLearnerProgress } from "@/server/learners";
import { clientIp, rateLimit } from "@/server/rate-limit";

const bodySchema = z.object({
  /** The signed progress token the browser has (null for a brand-new learner). */
  token: z.string().max(20_000).nullable(),
  event: progressEventSchema,
});

/**
 * POST /api/progress/event
 * The browser reports what happened; the server applies the rules and returns a new signed token.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`progress:${clientIp(req)}`, 60, 60_000);
  if (!limit.ok) return fail("rate_limited", `Slow down. Retry in ${limit.retryAfterSec}s`, 429);

  const body = await parseBody(req, bodySchema);
  if (!body.success) return body.response;

  const { token } = body.data;
  let { event } = body.data;

  // T13: scenario XP only for a real tutor conversation (checked with ElevenLabs, not trusted from the browser).
  if (event.type === "scenario_completed") {
    const check = await checkTutorConversation(event.conversationId, event.scenarioId);
    if (!check.ok) return fail(check.code, check.message, check.status);
    if (check.verified) event = { ...event, slangFlags: check.slangFlags };
  }

  try {
    const saved = await withLearnerProgress(token, (current) => {
      const { progress, rewards } = applyEvent(current, event);
      return { progress, extra: rewards };
    });
    if (!saved) return fail("invalid_token", "Progress token is invalid or was modified", 400);
    return ok({ token: encodeProgress(saved.progress), progress: saved.progress, rewards: saved.extra });
  } catch (err) {
    if (err instanceof RuleError) return fail(err.code, err.message, err.code === "not_found" ? 404 : 400);
    console.error("progress event failed", err);
    return fail("internal", "Something went wrong", 500);
  }
}
