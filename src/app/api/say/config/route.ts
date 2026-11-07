import { connection } from "next/server";
import { ok } from "@/lib/api";
import { sayConfig } from "@/server/say";

/**
 * GET /api/say/config  ->  { listen, voice, agent }
 * Which T23 helpers this server has (booleans only), so /say can pick the right path before the learner records.
 */
export async function GET() {
  await connection(); // read env at request time, not at build time
  return ok(sayConfig());
}
