import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Progress } from "@/lib/content/types";
import { DEFAULT_PROGRESS } from "@/lib/progress/defaults";
import { db } from "./db";
import { env, progressSecret } from "./env";
import { decodeProgress } from "./progress-token";

/**
 * Learners in Postgres: a random id + progress. No email, no name, no IP.
 * The browser holds only a signed, httpOnly cookie with the learner id (it can't read or forge it).
 * Without DATABASE_URL every function here reports "no database" and the app stays in guest mode.
 */

const COOKIE = env().NODE_ENV === "production" ? "__Host-snakk_sid" : "snakk_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

function sign(id: string) {
  return createHmac("sha256", progressSecret()).update(`learner:${id}`).digest("base64url");
}

async function learnerIdFromCookie(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

async function setLearnerCookie(id: string) {
  (await cookies()).set(COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

export async function forgetLearnerCookie() {
  (await cookies()).delete(COOKIE);
}

/**
 * Load the learner's progress, let `change` compute the new progress, and save it.
 * - With a database: the database is the source of truth (the browser's token is ignored, so old tokens
 *   can't be replayed). A first-time learner's guest progress (valid signed token) is imported once.
 *   Concurrent saves from two devices are safe: the update only applies if nobody saved in between, else retry.
 * - Without a database: the signed token is the source of truth (guest mode).
 * Returns null progress when the token is invalid in guest mode.
 */
export async function withLearnerProgress<T>(
  token: string | null,
  change: (current: Progress) => { progress: Progress; extra: T },
): Promise<{ progress: Progress; extra: T } | null> {
  const sql = db();
  if (!sql) {
    const current = token ? decodeProgress(token) : DEFAULT_PROGRESS;
    return current ? change(current) : null;
  }

  const id = await learnerIdFromCookie();
  for (let attempt = 0; attempt < 3; attempt++) {
    const rows = id ? ((await sql`select progress, version from learners where id = ${id}`) as { progress: Progress; version: number }[]) : [];
    if (rows.length === 0) {
      // New learner on this device: start from their guest progress if it's genuinely ours (signed).
      const start = (token && decodeProgress(token)) || DEFAULT_PROGRESS;
      const result = change(start);
      const [row] = (await sql`insert into learners (progress) values (${JSON.stringify(result.progress)}::jsonb) returning id`) as { id: string }[];
      await setLearnerCookie(row.id);
      return result;
    }
    const current = { ...DEFAULT_PROGRESS, ...rows[0].progress };
    const result = change(current);
    const updated = (await sql`update learners set progress = ${JSON.stringify(result.progress)}::jsonb, version = version + 1, updated_at = now()
      where id = ${id} and version = ${rows[0].version} returning id`) as { id: string }[];
    if (updated.length === 1) return result;
    // Another device saved in between: try again on the fresh progress.
  }
  throw new Error("progress_conflict");
}

/** Current progress for this device (database mode), or null when there's no learner/database yet. */
export async function currentProgress(): Promise<Progress | null> {
  const sql = db();
  const id = await learnerIdFromCookie();
  if (!sql || !id) return null;
  const rows = (await sql`select progress from learners where id = ${id}`) as { progress: Progress }[];
  return rows.length ? { ...DEFAULT_PROGRESS, ...rows[0].progress } : null;
}

// ---------- sync codes: move your progress to another device ----------
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L: easy to read aloud and type
const CODE_LENGTH = 12; // 31^12 ≈ 7.9e17 combinations; guessing is also rate-limited

export function normaliseCode(input: string): string {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

function hashCode(code: string) {
  return createHash("sha256").update(`snakk-sync:${code}`).digest("hex");
}

/** Create (or replace) the sync code of this device's learner. Shown once; only its hash is stored. */
export async function createSyncCode(): Promise<string | null> {
  const sql = db();
  const id = await learnerIdFromCookie();
  if (!sql || !id) return null;
  const bytes = randomBytes(CODE_LENGTH);
  const code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  await sql`update learners set sync_code_hash = ${hashCode(code)} where id = ${id}`;
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

/** Link this device to the learner who owns the code. Returns their progress, or null if the code is unknown. */
export async function restoreFromCode(input: string): Promise<Progress | null> {
  const sql = db();
  const code = normaliseCode(input);
  if (!sql || code.length !== CODE_LENGTH) return null;
  const rows = (await sql`select id, progress from learners where sync_code_hash = ${hashCode(code)}`) as { id: string; progress: Progress }[];
  if (!rows.length) return null;
  await setLearnerCookie(rows[0].id);
  return { ...DEFAULT_PROGRESS, ...rows[0].progress };
}

export const databaseEnabled = () => db() !== null;
