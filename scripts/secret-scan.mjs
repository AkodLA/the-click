#!/usr/bin/env node
/**
 * Secret scan (T13). Looks for API keys, private keys and filled-in .env values.
 *   npm run secret-scan              tracked files (run before every PR)
 *   npm run secret-scan -- --history every commit ever pushed (a deleted key is still leaked!)
 * Exit code 1 if anything is found. Prints WHERE, never the secret itself.
 * Found one? Don't just delete it: tell Akram and ROTATE the key (see CLAUDE.md).
 */
import { execFileSync } from "node:child_process";

const PATTERNS = [
  { name: "ElevenLabs API key", re: /\bsk_[a-f0-9]{40,}\b/ },
  { name: "xi-api-key with a literal value", re: /xi-api-key["']?\s*[:=]\s*["'][A-Za-z0-9_]{20,}["']/i },
  { name: "Private key", re: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { name: "GitHub token", re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b/ },
  { name: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "OpenAI / Anthropic key", re: /\bsk-(proj-|ant-)?[A-Za-z0-9_-]{32,}\b/ },
  { name: "Slack token", re: /\bxox[abpors]-[A-Za-z0-9-]{10,}\b/ },
  { name: "Vercel token", re: /\bvercel_[A-Za-z0-9]{24,}\b/i },
  { name: "Supabase service key (JWT)", re: /\beyJhbGciOi[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
  {
    name: "Filled-in secret env var",
    re: /^\s*(PROGRESS_SECRET|ELEVENLABS_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*=\s*\S{8,}/m,
    skipFile: (f) => f.endsWith(".env.example"),
  },
];

/** Files we never scan (generated or binary). */
const SKIP = [/^package-lock\.json$/, /\.(png|jpe?g|gif|webp|ico|woff2?|mp3|wav|mp4)$/i, /^scripts\/secret-scan\.mjs$/];

const git = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
const findings = [];

function scanText(where, file, text) {
  if (SKIP.some((r) => r.test(file))) return;
  for (const p of PATTERNS) {
    if (p.skipFile?.(file)) continue;
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (p.re.test(line)) findings.push(`${where}${file}:${i + 1}  ${p.name}`);
    });
  }
}

// 1. .env files must never be tracked.
for (const f of git(["ls-files"]).split("\n").filter(Boolean)) {
  if (/(^|\/)\.env(\..+)?$/.test(f) && !f.endsWith(".env.example")) findings.push(`${f}  .env file is committed`);
}

if (process.argv.includes("--history")) {
  // 2a. Every added line in every commit.
  const log = git(["log", "--all", "-p", "--no-color", "--unified=0", "--format=__COMMIT__ %h"]);
  let commit = "";
  let file = "";
  for (const line of log.split("\n")) {
    if (line.startsWith("__COMMIT__ ")) commit = line.slice(11);
    else if (line.startsWith("+++ b/")) file = line.slice(6);
    else if (line.startsWith("+") && !line.startsWith("+++")) scanText(`[${commit}] `, file, line.slice(1));
  }
} else {
  // 2b. Current tracked files.
  for (const f of git(["ls-files"]).split("\n").filter(Boolean)) {
    if (SKIP.some((r) => r.test(f))) continue;
    try {
      scanText("", f, git(["show", `:${f}`]));
    } catch {
      // deleted in the working tree
    }
  }
}

const unique = [...new Set(findings)];
if (unique.length) {
  console.error(`✖ ${unique.length} possible secret(s):\n  ${unique.join("\n  ")}`);
  console.error("\nIf a real key was ever committed: tell Akram and ROTATE it. Deleting the commit is not enough.");
  process.exit(1);
}
console.log(`✓ No secrets found (${process.argv.includes("--history") ? "full git history" : "tracked files"}).`);
