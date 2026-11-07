# Security (T13)

Short version for the jury: **the browser is never trusted.** It reports what happened; the server decides what it's worth,
signs the result, and checks anything that costs money or gives points. No accounts, no personal data on our servers.

## How to check it yourself
```bash
npm run build && npm start         # terminal 1
npm run security-check             # terminal 2: tries to cheat our XP, must say 15/15 blocked
npm run secret-scan                # before every PR: no keys in tracked files
npm run secret-scan -- --history   # every commit on every branch
BASE_URL=https://<our-app>.vercel.app npm run security-check   # same attacks against production
```

## "Try to cheat our own XP": results (local production build, 7 Nov)
| Attack | Result |
|---|---|
| Edit the progress token in localStorage (`xp: 99999`) | ✅ Blocked: HMAC signature fails → `invalid_token` |
| Send an XP amount from the browser (`{ phraseId, xp: 9999 }`) | ✅ Ignored: events never carry amounts, zod strips unknown fields |
| Learn the same phrase again | ✅ No extra XP (once per phrase, ever) |
| Send the server-only `pronunciation_scored` event | ✅ Rejected by the schema (only `/api/pronunciation` can apply it) |
| Made-up event / scenario / phrase ids | ✅ `404 not_found` |
| `scenario_completed` without a real tutor conversation | ✅ Rejected: the server asks ElevenLabs (see below) |
| Reuse one conversation for XP twice | ✅ `409 already_used` |
| Spam writing / tandem / pronunciation | ✅ Per-day caps (10 / 20 / 15) + 600 XP/day overall |
| 40 KB body, broken JSON | ✅ `413` / `400` |
| 70 events in a burst | ✅ `429` after 60/min per IP |
| Partner API without a key | ✅ `401` |
| Frame the app (clickjacking), inject `<object>`, call foreign hosts | ✅ CSP + `X-Frame-Options: DENY` |

## What the server checks
- **Progress tokens** (`src/server/progress-token.ts`): HMAC-SHA256 with `PROGRESS_SECRET`, constant-time compare. Required in production.
- **Rules** (`src/server/progress-rules.ts`): every XP number, cap, streak and achievement. Day and week use Oslo time on the server.
- **Tutor conversations** (`src/server/conversation-check.ts`, used by `POST /api/progress/event`): before scenario XP, the server
  fetches the conversation from ElevenLabs and requires: it exists, belongs to **our tutor agent**, didn't fail, started in the
  last 3 hours, the learner spoke at least twice, it wasn't used before, and (if the app sent `scenario_id`) it's the same scenario.
  The **slang count** for the "Right word, right room" badge is counted from the tutor's own `flag_register` tool calls, not
  taken from the browser. Local dev without ElevenLabs keys skips the check; production without keys refuses scenario XP.
- **Money routes**: `/api/agent/signed-url` (10/min), `/api/pronunciation` (12/min, 2 MB, our sentences only), `/api/tts`
  (30/min, our phrases only), `/api/say/transcribe` (6/min + 40/day, 2 MB, audio not stored), `/api/say/voice` (10/min + 40/day,
  ≤300 chars, plain text only: no markup or links, so it isn't a free TTS proxy). Keys only on the server (`env()`), never `NEXT_PUBLIC_*`.
- **Input**: zod on every route, body size limits (`parseBody`, 32 KB default).

## Headers (`next.config.ts`)
`Content-Security-Policy`: `default-src 'self'`; scripts from us (+ `blob:` and `cdn.jsdelivr.net` for the ElevenLabs audio
worklets); `connect-src` only us + `api.elevenlabs.io` / `livekit.rtc.elevenlabs.io`; `media-src 'self' blob:`;
`object-src`, `frame-src`, `frame-ancestors` `'none'`; `upgrade-insecure-requests` in production.
Plus `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (mic only for us; no camera, location,
payment, USB), `Cross-Origin-Opener-Policy`, HSTS, and no `X-Powered-By`.

## Privacy
- No accounts, no names, no emails. Progress lives in the learner's browser as a signed token.
- Audio is streamed to ElevenLabs for speech-to-text / voice and **never stored by us**. Tolk transcripts live in the tab only.
- Tandem: nicknames and emoji avatars only; the chat blocks phone numbers, emails, links and social handles.
- All community data (league, tandem partners, events) is **test data** and labelled as such.
- Translation (T19) runs **on the device** with the browser's built-in Translator (Opera Web AI / Chrome): the text never reaches our server or any AI provider.

## Known limits (honest list, with the fix)
| Limit | Why it's OK for the MVP | Fix (roadmap) |
|---|---|---|
| `script-src 'unsafe-inline'` | Next streams page data in inline scripts; nonces would make every page dynamic. We use no `dangerouslySetInnerHTML`/`eval`, React escapes text. | Nonce CSP via `proxy.ts` when we drop static pages, or Next's SRI when stable |
| An old token can be replayed (roll back) | It can't add XP: you only go back to a lower score | Progress in a database (T17) |
| Rate limits and "conversation already used" are in memory per server instance | Best effort on Vercel | Redis / Upstash or the T17 database |
| Språkkafé check-in has no presence proof | Clearly labelled sample events; once per event | QR code shown at the café, verified server-side |
| Writing trace is scored in the browser | Max 30 XP/day from writing | Score strokes on the server |
| Field-test answers are public content (the vocabulary is in the app) | It checks learning, not secrets; +40 XP once per pack, 3 tries a day | Server-held question bank with variants |
| Team league uses sample teams and a device team code | Clearly labelled sample data; no team data stored | Team accounts in the database (T17) |
| `/api/pronunciation` checks `Content-Length` before reading; a chunked upload without it is read first, then size-checked | Vercel caps request bodies at 4.5 MB anyway | Stream the body with a byte limit |

## If a key leaks
Stop, tell Akram, **rotate the key** in ElevenLabs / Vercel (deleting the commit is not enough), then run
`npm run secret-scan -- --history`.
