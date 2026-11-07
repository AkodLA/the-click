import { z } from "zod";
import { fail, ok, parseBody } from "@/lib/api";
import { progressEventSchema } from "@/lib/progress/events";
import { DEFAULT_PROGRESS } from "@/lib/progress/defaults";
import { applyEvent, RuleError } from "@/server/progress-rules";
import { decodeProgress, encodeProgress } from "@/server/progress-token";
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

  const { token, event } = body.data;
  const current = token ? decodeProgress(token) : DEFAULT_PROGRESS;
  if (!current) return fail("invalid_token", "Progress token is invalid or was modified", 400);

  try {
    const { progress, rewards } = applyEvent(current, event);
    return ok({ token: encodeProgress(progress), progress, rewards });
  } catch (err) {
    if (err instanceof RuleError) return fail(err.code, err.message, err.code === "not_found" ? 404 : 400);
    console.error("progress event failed", err);
    return fail("internal", "Something went wrong", 500);
  }
}
