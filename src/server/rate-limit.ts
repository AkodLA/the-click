import "server-only";

/**
 * Simple in-memory rate limiter (fixed window).
 * Good enough for a hackathon. On Vercel each server instance has its own memory,
 * so this is "best effort"; production would use Redis/Upstash.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfterSec: 0 };
  }
  bucket.count += 1;
  return { ok: bucket.count <= limit, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
}

/** Best-effort client IP (Vercel sets x-forwarded-for). Used only as a rate-limit key, never stored. */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
