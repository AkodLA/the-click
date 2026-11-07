#!/usr/bin/env node
/**
 * Create a partner API key.
 *   npm run partner:key -- demo-warehouse content:read
 * Prints the key ONCE (give it to the partner privately) and the line to add to PARTNER_KEYS
 * (in .env.local and in Vercel). We only store the hash, never the key.
 */
import { createHash, randomBytes } from "node:crypto";

const VALID = ["content:read", "translate"];
const [partnerId, ...scopes] = process.argv.slice(2);

if (!partnerId || !/^[a-z0-9-]{3,40}$/.test(partnerId) || scopes.length === 0 || scopes.some((s) => !VALID.includes(s))) {
  console.error("Usage: npm run partner:key -- <partner-id> <scope> [scope...]");
  console.error(`Partner id: lowercase letters, digits, dashes. Scopes: ${VALID.join(", ")}`);
  process.exit(1);
}

const key = `snk_live_${randomBytes(24).toString("base64url")}`;
const hash = createHash("sha256").update(key).digest("hex");

console.log("\nAPI key (show it to the partner ONCE, by a private channel, never commit it):\n");
console.log(`  ${key}\n`);
console.log("Add this entry to PARTNER_KEYS (comma-separate multiple partners):\n");
console.log(`  ${partnerId}:${scopes.join("|")}:${hash}\n`);
