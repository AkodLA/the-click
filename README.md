# Snakk: learn the Norwegian people actually speak

> Built in one weekend at **Oslo Sprint Hackathon 2026** by team **The Click**. ("Snakk" is the working name.)

Textbooks teach written Norwegian. Snakk teaches **how Norway talks**. You speak out loud from day one with an AI voice tutor, learn the slang people really use, and learn **when not to use it** and what to say instead. When you're not ready yet, **Tolk** interprets your parent-teacher meeting, so your kids don't have to.

- **Live app:** _coming (Vercel link)_
- **Demo video:** _coming_

## Features
| | |
|---|---|
| 🧭 Placement test | Find your level, A0 to C2, in about 3 minutes |
| 🎙️ Voice tutor | Real-life scenarios (kiosk, party, job interview, doctor) with an ElevenLabs voice agent that corrects slang used in the wrong place |
| 🎯 Pronunciation check | Say a sentence and see which words came through |
| 💬 Phrasebook | Every phrase tagged slang / informal / neutral / formal, with ✅ use when · 🚫 avoid when · 💡 say instead |
| 🏆 Gamification | XP, levels, streaks, achievements, weekly and monthly leagues by level |
| 🧑‍🤝‍🧑 Tolk | Two-way interpreter for real meetings |
| 🤝 Tandem | Swap languages with natives. Nicknames and avatars only. |
| 🧇 Språkkafé | Language events near you, with check-in rewards |

## How it works
```
Phone / browser (Next.js)
 ├─ lesson content: static data in the repo (src/lib/content)
 ├─ your progress: computed + signed by our server, kept in your browser (no account)
 └─ voice: our API route creates a short-lived signed URL → ElevenLabs Agents
           pronunciation: our API route → ElevenLabs speech-to-text
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
- Tandem is anonymous: nicknames and avatars, never real names or faces.

## Docs
[`docs/PLAN.md`](docs/PLAN.md) (idea, pitch, scope) · [`docs/API.md`](docs/API.md) (data and API) · [`docs/TASKS.md`](docs/TASKS.md) (who builds what) · [`CLAUDE.md`](CLAUDE.md) (how we work) · [`docs/SETUP.md`](docs/SETUP.md) (keys, ElevenLabs, Vercel) · [`docs/PARTNER-API.md`](docs/PARTNER-API.md) (API keys for other services) · [`GITHUB-QUICKSTART.md`](GITHUB-QUICKSTART.md) (GitHub for beginners)

## Team
Akram · Anis · Anas · Aden (**The Click**)
