import { connection } from "next/server";
import { ok } from "@/lib/api";

/** GET /api/health: quick check that the server is up. */
export async function GET() {
  await connection(); // Next 16: without this, GET routes are frozen at build time
  return ok({ status: "up", time: new Date().toISOString() });
}
