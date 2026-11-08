import "server-only";
import { neon } from "@neondatabase/serverless";
import { env } from "./env";

/**
 * Server-only Postgres (Neon via Vercel), queried over HTTPS with Neon's serverless driver:
 * no long-lived connections, works on Vercel's serverless functions and on any network.
 * The browser never talks to the database. Returns null when DATABASE_URL isn't set (guest mode).
 * Queries are tagged templates, so every value is sent as a parameter (no SQL injection).
 */
type Sql = ReturnType<typeof neon>;
const g = globalThis as unknown as { __snakkSql?: Sql | null };

export function db(): Sql | null {
  if (g.__snakkSql !== undefined) return g.__snakkSql;
  const url = env().DATABASE_URL;
  g.__snakkSql = url ? neon(url) : null;
  return g.__snakkSql;
}
