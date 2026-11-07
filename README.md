# The Click

Voice assistant for new warehouse workers – in their own language. Built at Oslo Sprint 2026 for the Holio challenge (#9 Training, partly #8 Returns) and the ElevenLabs challenge.

- `/` – worker app (phone): pick name + language, talk. The agent guides tasks step by step and drives the screen via client tools.
- `/leder` – manager dashboard (projector): live feed in Norwegian, open questions the agent could not answer, problems on the floor.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in ElevenLabs keys
npm run dev
```

Open http://localhost:3000 (worker) and http://localhost:3000/leder (manager).
The phone needs HTTPS for the microphone → use the Vercel deploy for phone testing.

## Set up the ElevenLabs agent

1. Create an agent in ElevenLabs → Agents.
2. Paste `agent/system-prompt.md` as the system prompt.
3. Upload `agent/kunnskapsbase/lager-rutiner.md` to the knowledge base.
4. Add the client tools in `agent/client-tools.md`, and the settings listed there.
5. Put the agent ID and API key in `.env.local` (and in Vercel env vars).

## Deploy

1. Supabase: run `supabase/schema.sql`, add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
2. Vercel: import the repo, add all env vars from `.env.example`.

## Security and privacy

- The ElevenLabs API key stays on the server; the browser gets a short-lived signed URL.
- API input is validated and length-limited.
- We store no audio. The feed stores short task events only, and no individual performance scores.
- All warehouse data is fictional test data.
