import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { CEFR_LEVELS, phrases } from "@/lib/content";
import { authenticatePartner } from "@/server/partners";

const querySchema = z.object({
  register: z.enum(["slang", "informal", "neutral", "formal"]).optional(),
  level: z.enum(CEFR_LEVELS).optional(),
  tag: z.string().max(32).optional(),
});

/**
 * GET /api/v1/phrases?register=formal&level=B1&tag=greeting
 * Partner API: everyday Norwegian with context, e.g. for a warehouse training screen or a robot's speech.
 */
export async function GET(req: NextRequest) {
  const auth = authenticatePartner(req, "content:read");
  if (!auth.ok) return auth.response;

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return fail("invalid_input", z.prettifyError(parsed.error));
  const { register, level, tag } = parsed.data;

  const result = phrases.filter(
    (p) => (!register || p.register === register) && (!level || p.level === level) && (!tag || p.tags?.includes(tag)),
  );
  return ok(result);
}
