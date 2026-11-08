#!/usr/bin/env node
/**
 * Apply db/migrations/*.sql (idempotent SQL) to the database in DATABASE_URL, over HTTPS.
 *   npm run db:migrate
 * Never prints the connection string.
 */
import { readdirSync, readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing in .env.local (Vercel → Storage → your database → .env.local tab).");
  process.exit(1);
}
const sql = neon(url);
const dir = new URL("../db/migrations/", import.meta.url);
try {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    const statements = readFileSync(new URL(file, dir), "utf8")
      .split("\n").filter((l) => !l.trim().startsWith("--")).join("\n")
      .split(";").map((s) => s.trim()).filter(Boolean);
    for (const statement of statements) await sql.query(statement);
    console.log(`✓ ${file} (${statements.length} statements)`);
  }
  const [{ rls }] = await sql`select relrowsecurity as rls from pg_class where oid = 'learners'::regclass`;
  const [{ n }] = await sql`select count(*)::int as n from learners`;
  console.log(`learners table ready · row level security ${rls ? "ON ✅" : "OFF ❌"} · ${n} learner(s)`);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
}
