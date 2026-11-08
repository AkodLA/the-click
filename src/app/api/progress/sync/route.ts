import { fail, ok } from "@/lib/api";
import { createSyncCode, databaseEnabled } from "@/server/learners";
import { clientIp, rateLimit } from "@/server/rate-limit";

/** POST /api/progress/sync: create a sync code for this device's learner (shown once, only its hash is stored). */
export async function POST(req: Request) {
  const limit = rateLimit(`sync-create:${clientIp(req)}`, 5, 60_000);
  if (!limit.ok) return fail("rate_limited", `Slow down. Retry in ${limit.retryAfterSec}s`, 429);
  if (!databaseEnabled()) return fail("not_configured", "Sync isn't available on this server", 503);
  const code = await createSyncCode();
  if (!code) return fail("no_progress", "Practise something first, then you can sync it", 409);
  return ok({ code });
}
