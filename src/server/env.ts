import "server-only";
import { z } from "zod";

/**
 * Validated server environment. Read secrets ONLY through this file.
 * Missing optional keys -> the feature returns a clear "not configured" error instead of crashing.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Signs learner progress tokens. Required in production. Generate: openssl rand -base64 32 */
  PROGRESS_SECRET: z.string().min(32).optional(),
  ELEVENLABS_API_KEY: z.string().min(10).optional(),
  ELEVENLABS_TUTOR_AGENT_ID: z.string().min(3).optional(),
  ELEVENLABS_TOLK_AGENT_ID: z.string().min(3).optional(),
  /** Partner API keys (hashed). Format: see src/server/partners.ts and docs/PARTNER-API.md */
  PARTNER_KEYS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (!cached) {
    // An empty line like `ELEVENLABS_TUTOR_AGENT_ID=` in .env.local means "not set yet", not "invalid".
    const raw = Object.fromEntries(Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]));
    const result = schema.safeParse(raw);
    if (!result.success) {
      // Name the broken variables, never their values (they may be secrets).
      const names = [...new Set(result.error.issues.map((i) => String(i.path[0])))].join(", ");
      throw new Error(`Invalid environment variable(s): ${names}. Check .env.local or Vercel settings (see docs/SETUP.md).`);
    }
    cached = result.data;
  }
  return cached;
}

const DEV_ONLY_PROGRESS_SECRET = "dev-only-secret-do-not-use-in-production-0123456789";

export function progressSecret(): string {
  const { PROGRESS_SECRET, NODE_ENV } = env();
  if (PROGRESS_SECRET) return PROGRESS_SECRET;
  if (NODE_ENV === "production") {
    throw new Error("PROGRESS_SECRET is not set. Add it in Vercel → Settings → Environment Variables.");
  }
  return DEV_ONLY_PROGRESS_SECRET;
}
