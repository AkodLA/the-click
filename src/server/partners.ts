import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { fail } from "@/lib/api";
import { env } from "./env";
import { rateLimit } from "./rate-limit";

/**
 * Partner API keys: lets other services (warehouse systems, robots, schools…) connect to Snakk
 * through /api/v1/*. We never store the key itself, only its SHA-256 hash.
 *
 * PARTNER_KEYS env format (comma-separated entries):
 *   <partnerId>:<scope>|<scope>:<sha256hex>
 *   e.g. demo-warehouse:content:read:3f2a…   (scopes may contain ":" so the hash is always the LAST part)
 * Create a key:  npm run partner:key -- <partnerId> <scope> [<scope>...]
 * Docs: docs/PARTNER-API.md
 */

export const PARTNER_SCOPES = ["content:read", "translate"] as const;
export type PartnerScope = (typeof PARTNER_SCOPES)[number];

export interface Partner {
  id: string;
  scopes: PartnerScope[];
}

interface Entry extends Partner {
  hash: Buffer;
}

function entries(): Entry[] {
  const raw = env().PARTNER_KEYS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const parts = entry.split(":");
      if (parts.length < 3) return [];
      const id = parts[0];
      const hashHex = parts[parts.length - 1];
      const scopes = parts
        .slice(1, -1)
        .join(":")
        .split("|")
        .filter((s): s is PartnerScope => (PARTNER_SCOPES as readonly string[]).includes(s));
      if (!/^[a-f0-9]{64}$/.test(hashHex)) return [];
      return [{ id, scopes, hash: Buffer.from(hashHex, "hex") }];
    });
}

function findPartner(key: string): Partner | null {
  if (!/^snk_[A-Za-z0-9_-]{20,100}$/.test(key)) return null;
  const hash = createHash("sha256").update(key).digest();
  for (const e of entries()) {
    if (e.hash.length === hash.length && timingSafeEqual(e.hash, hash)) return { id: e.id, scopes: e.scopes };
  }
  return null;
}

/**
 * Use at the top of every /api/v1 route:
 *   const auth = authenticatePartner(req, "content:read");
 *   if (!auth.ok) return auth.response;
 */
export function authenticatePartner(
  req: Request,
  scope: PartnerScope,
): { ok: true; partner: Partner } | { ok: false; response: Response } {
  const header = req.headers.get("authorization") ?? "";
  const key = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const partner = key ? findPartner(key) : null;
  if (!partner) return { ok: false, response: fail("unauthorized", "Missing or invalid API key", 401) };
  if (!partner.scopes.includes(scope)) {
    return { ok: false, response: fail("forbidden", `This key lacks the "${scope}" scope`, 403) };
  }
  const limit = rateLimit(`partner:${partner.id}`, 120, 60_000);
  if (!limit.ok) {
    return { ok: false, response: fail("rate_limited", `Too many requests. Retry in ${limit.retryAfterSec}s`, 429) };
  }
  return { ok: true, partner };
}
