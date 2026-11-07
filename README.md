# Prat

**Norsk som det faktisk snakkes. Tolk i dag, egen stemme i morgen.**

Prat teaches everyday spoken Norwegian by talking with an ElevenLabs voice agent – including slang, and when *not* to use it. When a learner can't manage a real conversation yet (a parent–teacher meeting, the doctor, day one at the warehouse), Prat interprets so no child has to. Afterwards, the sentences they needed help with become their next speaking lessons.

Built at Oslo Sprint 2026.

## What's in the app

| Route | What it does | Status |
|---|---|---|
| `/start` | Nickname, home language, A0–C2 placement test (listening via browser voice) | Working |
| `/` | Home: today's conversation, phrases from your last interpreted meeting, XP and streak | Working |
| `/snakk` | Voice tutor: role-play scenarios, live corrections with register colour, pronunciation tips, target phrases | Working (needs tutor agent) |
| `/slang` | Slang check: pick who you're talking to, see if a phrase fits and what to say instead | Working |
| `/tolk` | Table interpreter: top half faces the other person; ends with summary + phrases saved as lessons | Working (needs tolk agent) · **Demo** button works offline |
| `/skriv` | Trace æ, ø, å and words with your finger, scored | Working |
| `/tandem` | Anonymous language exchange: nicknames, avatars, blocks phone numbers/usernames, 15-min language switch, avatar call | Prototype (sample partners) |
| `/kafe` | Språkkafé meetups with check-in rewards | Prototype (sample data) |
| `/konkurranse` | Weekly league by level | Prototype (sample league) |
| `/meg` | Badges, saved phrases, privacy + delete progress | Working |
| `/bedrift` | Business page: schools, warehouses, robots/API | Pitch page |
| `/lager`, `/leder` | Warehouse assistant + manager screen (Holio challenge), same voice engine | Working (needs lager agent) |

Progress is stored in the browser (localStorage) for the demo. No account, no audio stored.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in keys
npm run dev
```

Phone testing needs HTTPS for the microphone → use the Vercel deploy.

## Set up the ElevenLabs agents

Create one agent per folder in `agent/`:

| Agent | Prompt + tools | Env var |
|---|---|---|
| Tutor | `agent/tutor/` | `ELEVENLABS_TUTOR_AGENT_ID` |
| Interpreter | `agent/tolk/` | `ELEVENLABS_TOLK_AGENT_ID` |
| Warehouse | `agent/lager/` | `ELEVENLABS_AGENT_ID` |

For each: paste `system-prompt.md`, add the client tools from `client-tools.md`, turn on Authentication, and put the agent ID in `.env.local` and Vercel.

## Security and privacy

- The ElevenLabs API key stays on the server; the browser only gets a short-lived signed URL.
- No audio is stored. Tandem chat blocks phone numbers and social usernames so both sides stay anonymous.
- The interpreter tells users to book a qualified interpreter for serious cases (child welfare, diagnoses, legal).
- Learner data lives on the device and can be deleted from `/meg`.
