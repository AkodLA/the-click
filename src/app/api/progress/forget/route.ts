import { ok } from "@/lib/api";
import { forgetLearnerCookie } from "@/server/learners";

/** POST /api/progress/forget: "Start over on this device". Unlinks this device; other devices keep their progress. */
export async function POST() {
  await forgetLearnerCookie();
  return ok({ forgotten: true });
}
