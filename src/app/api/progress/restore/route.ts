import { z } from "zod";
import { fail, ok, parseBody } from "@/lib/api";
import { databaseEnabled, restoreFromCode } from "@/server/learners";
import { encodeProgress } from "@/server/progress-token";
import { clientIp, rateLimit } from "@/server/rate-limit";

const bodySchema = z.object({ code: z.string().min(12).max(20) });

/** POST /api/progress/restore { code }: link this device to the learner who owns the sync code. */
export async function POST(req: Request) {
  // Strict: 5 tries per 10 minutes per IP, so codes can't be guessed.
  const limit = rateLimit(`sync-restore:${clientIp(req)}`, 5, 10 * 60_000);
  if (!limit.ok) return fail("rate_limited", `Too many tries. Retry in ${limit.retryAfterSec}s`, 429);
  if (!databaseEnabled()) return fail("not_configured", "Sync isn't available on this server", 503);
  const body = await parseBody(req, bodySchema, 256);
  if (!body.success) return body.response;
  const progress = await restoreFromCode(body.data.code);
  if (!progress) return fail("not_found", "That code doesn't match any progress. Check it and try again.", 404);
  return ok({ progress, token: encodeProgress(progress) });
}
