import { connection } from "next/server";
import { fail, ok } from "@/lib/api";
import { currentProgress, databaseEnabled } from "@/server/learners";
import { encodeProgress } from "@/server/progress-token";
import { clientIp, rateLimit } from "@/server/rate-limit";

/**
 * GET /api/progress: this device's latest progress from the database (e.g. after another device changed it).
 * { enabled: false } in guest mode; { progress: null } when this device has no learner yet.
 */
export async function GET(req: Request) {
  await connection();
  const limit = rateLimit(`progress-get:${clientIp(req)}`, 60, 60_000);
  if (!limit.ok) return fail("rate_limited", `Slow down. Retry in ${limit.retryAfterSec}s`, 429);
  if (!databaseEnabled()) return ok({ enabled: false, progress: null, token: null });
  const progress = await currentProgress();
  return ok({ enabled: true, progress, token: progress ? encodeProgress(progress) : null });
}
