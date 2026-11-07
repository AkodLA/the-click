#!/usr/bin/env node
/**
 * "Try to cheat our own XP" (T13). Attacks a running Snakk server and checks every attack fails.
 *   npm run build && npm start            (in one terminal)
 *   npm run security-check                (in another; default http://localhost:3000)
 *   BASE_URL=https://the-click-xyz.vercel.app npm run security-check
 * Exit code 1 if any attack worked. Results are documented in docs/SECURITY.md.
 */
const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const results = [];
let token = null;

async function call(path, body, init = {}) {
  const res = await fetch(BASE + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // not JSON
  }
  return { status: res.status, json, headers: res.headers };
}
const event = (ev, t = token) => call("/api/progress/event", { token: t, event: ev });
const check = (name, pass, detail = "") => results.push({ name, pass, detail });
const xpOf = (r) => r.json?.data?.progress?.xp;

// Start a learner.
let r = await event({ type: "profile_set", nickname: "Tester", nativeLanguage: "en" }, null);
if (!r.json?.ok) {
  console.error(`Server not reachable or not working at ${BASE} (status ${r.status}). Start it first.`);
  process.exit(2);
}
token = r.json.data.token;

// 1. Edit the token to give yourself XP.
{
  const [data, sig] = token.split(".");
  const payload = JSON.parse(Buffer.from(data, "base64url").toString());
  payload.p.xp = 99999;
  const forged = `${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${sig}`;
  const f = await event({ type: "writing_done", itemId: "ae" }, forged);
  check("Edited token (xp: 99999) is rejected", f.json?.error?.code === "invalid_token", `got ${f.status} ${f.json?.error?.code}`);
}

// 2. Send an XP amount from the browser.
{
  const f = await call("/api/progress/event", { token, event: { type: "phrase_learned", phraseId: "digg", xp: 9999 } });
  check("XP amount sent by the browser is ignored", f.json?.ok && xpOf(f) === 5, `xp after = ${xpOf(f)}`);
  token = f.json?.data?.token ?? token;
}

// 3. Learn the same phrase again.
{
  const f = await event({ type: "phrase_learned", phraseId: "digg" });
  check("Same phrase twice gives no extra XP", f.json?.ok && xpOf(f) === 5, `xp after = ${xpOf(f)}`);
}

// 4. Server-only event from the browser.
{
  const f = await event({ type: "pronunciation_scored", score: 100 });
  check("Browser can't send pronunciation_scored", f.status === 400 && f.json?.error?.code === "invalid_input", `got ${f.status}`);
}

// 5. Made-up ids.
{
  const f = await event({ type: "event_checkin", eventId: "fake-event" });
  check("Unknown event id is rejected", f.status === 404, `got ${f.status}`);
}

// 6. Scenario XP without a real tutor conversation.
{
  const f = await event({ type: "scenario_completed", scenarioId: "kiosk", conversationId: "fake-conversation-id", slangFlags: 0 });
  const verifying = f.status !== 200;
  check(
    "Scenario XP needs a real ElevenLabs conversation",
    verifying,
    verifying ? `rejected: ${f.json?.error?.code}` : "accepted (OK only in local dev without ElevenLabs keys)",
  );
}

// 7. Daily caps.
{
  let last;
  for (let i = 0; i < 12; i++) {
    last = await event({ type: "writing_done", itemId: "ae" });
    token = last.json?.data?.token ?? token;
  }
  const writingXp = last.json?.data?.progress?.daily?.counts?.writing;
  check("Writing XP stops at 10 per day", writingXp === 10, `writing count = ${writingXp}`);
}

// 8. Huge body and broken JSON.
{
  const big = await call("/api/progress/event", JSON.stringify({ token, event: { type: "writing_done", itemId: "x".repeat(40_000) } }));
  check("Oversized body is rejected (413)", big.status === 413, `got ${big.status}`);
  const bad = await call("/api/progress/event", "{not json");
  check("Broken JSON is rejected (400)", bad.status === 400, `got ${bad.status}`);
}

// 9. Partner API without a key.
{
  const f = await call("/api/v1/phrases");
  check("Partner API without a key is refused", f.status === 401, `got ${f.status}`);
}

// 10. Paid routes reject bad input (route may not be deployed yet).
{
  const f = await call("/api/agent/signed-url", { mode: "admin" });
  check("Voice route rejects unknown mode", f.status === 400 || f.status === 404, `got ${f.status}`);
}

// 11. Security headers.
{
  const res = await fetch(`${BASE}/learn`);
  const csp = res.headers.get("content-security-policy") ?? "";
  check("CSP blocks framing, plugins and foreign hosts", /frame-ancestors 'none'/.test(csp) && /object-src 'none'/.test(csp) && /default-src 'self'/.test(csp));
  check("X-Frame-Options + nosniff set", res.headers.get("x-frame-options") === "DENY" && res.headers.get("x-content-type-options") === "nosniff");
  check("No X-Powered-By header", !res.headers.get("x-powered-by"));
}

// 12. Rate limit (last: it blocks this IP for a minute).
{
  const statuses = await Promise.all(Array.from({ length: 70 }, () => event({ type: "tandem_message_sent" }).then((x) => x.status)));
  check("Rate limit kicks in (429) after 60 events/min", statuses.includes(429), `${statuses.filter((s) => s === 429).length}× 429`);
}

const width = Math.max(...results.map((x) => x.name.length));
for (const x of results) console.log(`${x.pass ? "✓ PASS" : "✖ FAIL"}  ${x.name.padEnd(width)}  ${x.detail}`);
const failed = results.filter((x) => !x.pass).length;
console.log(`\n${results.length - failed}/${results.length} attacks blocked at ${BASE}`);
process.exit(failed ? 1 : 0);
