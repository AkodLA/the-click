import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Progress } from "@/lib/content/types";
import { DEFAULT_PROGRESS } from "@/lib/progress/defaults";
import { progressSecret } from "./env";

/**
 * Progress tokens: `base64url(JSON payload).base64url(HMAC-SHA256 signature)`.
 * The browser can READ the payload (to show XP etc.) but can't change it: any edit breaks the signature.
 * No database needed. (Limit: an old token could be replayed. That's acceptable for the MVP; T17 moves progress to a DB.)
 */
const VERSION = 1;

interface Payload {
  v: number;
  iat: number;
  p: Progress;
}

function sign(data: string): string {
  return createHmac("sha256", progressSecret()).update(data).digest("base64url");
}

export function encodeProgress(progress: Progress): string {
  const payload: Payload = { v: VERSION, iat: Date.now(), p: progress };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

/** Returns the verified progress, or null if the token is missing, tampered with, or from an old version. */
export function decodeProgress(token: string | null | undefined): Progress | null {
  if (!token || token.length > 20_000) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Payload;
    if (payload.v !== VERSION) return null;
    return { ...DEFAULT_PROGRESS, ...payload.p };
  } catch {
    return null;
  }
}
