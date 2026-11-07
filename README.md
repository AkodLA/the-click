# Snakk: learn the Norwegian people actually speak

> Built in one weekend at **Oslo Sprint Hackathon 2026** by team **The Click**. ("Snakk" is the working name.)

Textbooks teach written Norwegian. Snakk teaches **how Norway talks**. You speak out loud from day one with an AI voice tutor, learn the slang people really use, and learn **when not to use it** and what to say instead. When you're not ready yet, **Tolk** interprets everyday conversations both ways, so your kids don't have to.

- **Live app:** https://the-click-psi.vercel.app
- **Backup demo video:** [`docs/demo/backup-demo.mp4`](docs/demo/backup-demo.mp4) (no live voice) · pitch script: [`docs/PITCH-SCRIPT.md`](docs/PITCH-SCRIPT.md)

## Features
| | |
|---|---|
| 🧭 Placement test | Estimates your level, A0 to C2, in about 3 minutes (scored on the server) |
| 🎙️ Voice tutor | Real-life scenarios (kiosk, party, dinner, job interview, doctor, plus work scenarios like a warehouse shift or a nursing-home handover) with an ElevenLabs voice agent that corrects slang used in the wrong place |
| 🎯 Pronunciation check | Say a sentence and see which words came through |
| 💬 Phrasebook | 118 phrases (A0 to C1, incl. idioms like «å tråkke i salaten», phrases for parents and work, and dialects you'll hear), each with a picture of the situation tagged slang / informal / neutral / formal, with ✅ use when · 🚫 avoid when · 💡 say instead, audio and a "sounds like" hint |
| 🧠 My words | Vocabulary for **your work, interests, age group and level** (9 fields, 6 interests), with spaced review, level-up tests and Snakk certificates |
| 🖼️ Everyday picture words | 257 beginner words in 24 packs (food, numbers, everyday verbs, question words, help & emergencies, home, colours, town, opposites, bank & papers, housing & renting, kitchen, shop, time, people, weather, body, feelings, work life, travel, fruit & veg, jobs, free time, nature), each with a picture, plus a picture quiz (see it → word, or hear it → picture). 440 of the 444 words have a picture (every work and interest pack too), also when you tap a word anywhere in the app |
| 📓 Mistakes | Every correction from the tutor, Tandem and the pronunciation check, collected automatically, with practice |
| 📒 My notes | Save any word with one tap; it lands in the right notebook (Everyday, Formal, Slang, Corrections, Writing, your own) |
| 👆 Explain a word | Tap any Norwegian word: meaning, register, example, listen, translate |
| 🎓 Exams & resources | Official tests (Norskprøven, citizenship test) and free learning resources |
| 🏆 Gamification | XP, levels, streaks with freezes, daily quests, achievements, seasonal challenges, a growing tree you can share, leagues by level and **team leagues** for classes and workplaces |
| 🧑‍🤝‍🧑 Tolk | Two-way interpreter: voice (ElevenLabs) or typing with **on-device translation** (Opera Web AI / Chrome) |
| 🤝 Tandem | Swap languages with natives. Nicknames and avatars only, gentle corrections, translate any message |
| 🧇 Språkkafé | Language events near you, with check-in rewards and calendar export |
| ✍️ Write | The whole alphabet A–Å with numbered stroke guides, eraser and undo, plus first words |
| 🌗 Light / dark | Theme switch, or follow the device |

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
- Tandem is anonymous: nicknames and avatars, never real names or faces.
- Personal settings (age group, field, interests) stay in your browser; we never ask your exact age.
- Text translation runs on your own device: it never reaches our server.
- We attack our own app: `npm run security-check` (15 attacks) and `npm run secret-scan`. Results: [`docs/SECURITY.md`](docs/SECURITY.md).

## Docs
[`docs/PLAN.md`](docs/PLAN.md) (idea, pitch, scope) · [`docs/API.md`](docs/API.md) (data and API) · [`docs/TASKS.md`](docs/TASKS.md) (who builds what) · [`CLAUDE.md`](CLAUDE.md) (how we work) · [`docs/SETUP.md`](docs/SETUP.md) (keys, ElevenLabs, Vercel) · [`docs/PARTNER-API.md`](docs/PARTNER-API.md) (API keys for other services) · [`docs/SECURITY.md`](docs/SECURITY.md) (security pass) · [`docs/PITCH.md`](docs/PITCH.md) + [`docs/PITCH-SCRIPT.md`](docs/PITCH-SCRIPT.md) (pitch) · [`agent/`](agent/) (ElevenLabs agent prompts) · [`GITHUB-QUICKSTART.md`](GITHUB-QUICKSTART.md) (GitHub for beginners)

## Team
Akram · Anis · Anas · Aden (**The Click**)
