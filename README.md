# Snakk: speak like a local, from day one

> Built in one weekend at **Oslo Sprint Hackathon 2026** by team **The Click**. ("Snakk" is the working name.)

Textbooks teach written language. Snakk teaches **the language as it's really spoken**: you talk out loud from day one with an AI voice tutor in real situations, and learn which words fit where. When you can't speak it yet, **Tolk** speaks the local language for you, at school pickup, at work, or travelling where English doesn't help. Norwegian first.

- **Live app:** https://the-click-psi.vercel.app
- **Backup demo video:** [`docs/demo/backup-demo.mp4`](docs/demo/backup-demo.mp4) (no live voice) · pitch script: [`docs/PITCH-SCRIPT.md`](docs/PITCH-SCRIPT.md)

## Features (5 tabs: Home · Speak · Tolk · Phrases · Me)
| | |
|---|---|
| 🧭 **Level test** | Estimates your level, A0 to C2, in about 3 minutes (scored on the server). Start as a guest: no email, no password. |
| 🎙️ **Speak** | A voice tutor (ElevenLabs) plays the other person in real situations: kiosk, party, job interview, doctor, work. It tells you which words fit which situation, and corrects you when they don't. |
| 🧑‍🤝‍🧑 **Tolk** | Be understood now: you speak your language, the other person hears theirs. Norwegian, English, Arabic, Ukrainian, Polish, Somali, Tigrinya, Spanish, French, Urdu, Dari, Turkish, **Japanese, Chinese, Russian**. |
| 💬 **Phrases** | Everyday phrases as they're really used, each with ✅ use when · 🚫 avoid when · 💡 say instead, audio, a pronunciation check and a "sounds like" hint. Plus word packs for your job and interests. |
| 🙂 **Me** | XP, levels, streaks, badges, a weekly league, your saved words and the corrections you got. Progress syncs to your other devices with a sync code. |

## How it works
```
Phone / browser (Next.js)
 ├─ lesson content: static data in the repo (src/lib/content)
 ├─ your progress: computed + signed by our server, kept in your browser (no account)
 ├─ voice: our API route creates a short-lived signed URL → ElevenLabs Agents
 │         pronunciation: our API route → ElevenLabs speech-to-text
 └─ text translation: the browser's built-in translator (Opera Web AI / Chrome), on the device
```
| Part | Tech |
|---|---|
| App + API | Next.js 16 (App Router, TypeScript), Tailwind 4 |
| Voice | ElevenLabs Agents (`@elevenlabs/react`), ElevenLabs speech-to-text |
| Validation | zod |
| Hosting | Vercel |

## Run it locally
Requires Node.js 20+.
```bash
git clone https://github.com/AkodLA/the-click.git
cd the-click
npm install
cp .env.example .env.local   # add keys (ask the team; never commit them)
npm run dev                  # http://localhost:3000
```

## Privacy and security
- No accounts and no personal data on our servers. Progress is **computed and signed by the server** (HMAC) and kept in your browser, so it can't be faked.
- The server owns every rule: XP, daily caps, achievements, placement answers (never sent to the browser).
- Partner API (`/api/v1`) for other services: hashed API keys, scopes, rate limits. See [`docs/PARTNER-API.md`](docs/PARTNER-API.md).
- Security headers (no framing, mic only on our own pages), size limits and rate limits on routes.
- API keys are only used server-side. The browser gets a short-lived signed URL for voice sessions.
- Audio for pronunciation checks is not stored by us.
- All API input is validated (zod). No secrets in the repo (`.env*` is git-ignored, GitHub push protection is on).
- Personal settings (age group, field, interests) stay in your browser; we never ask your exact age.
- Text translation runs on your own device: it never reaches our server.
- We attack our own app: `npm run security-check` (15 attacks) and `npm run secret-scan`. Results: [`docs/SECURITY.md`](docs/SECURITY.md).

## Docs
[`docs/PLAN.md`](docs/PLAN.md) (idea, pitch, scope) · [`docs/API.md`](docs/API.md) (data and API) · [`docs/TASKS.md`](docs/TASKS.md) (who builds what) · [`CLAUDE.md`](CLAUDE.md) (how we work) · [`docs/SETUP.md`](docs/SETUP.md) (keys, ElevenLabs, Vercel) · [`docs/PARTNER-API.md`](docs/PARTNER-API.md) (API keys for other services) · [`docs/SECURITY.md`](docs/SECURITY.md) (security pass) · [`docs/PITCH.md`](docs/PITCH.md) + [`docs/PITCH-SCRIPT.md`](docs/PITCH-SCRIPT.md) (pitch) · [`agent/`](agent/) (ElevenLabs agent prompts) · [`GITHUB-QUICKSTART.md`](GITHUB-QUICKSTART.md) (GitHub for beginners)

## Team
Akram · Anis · Anas · Aden (**The Click**)
