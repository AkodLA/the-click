# Setup: keys, ElevenLabs, Vercel

**Golden rule:** keys go in exactly two places: your own `.env.local` (git-ignored, never pushed) and **Vercel → Settings → Environment Variables**. Never in code, commits, PRs, screenshots, Discord channels, or the chat with Claude. Share keys **by Discord DM only**.

---

## A. Your laptop: `.env.local` (everyone, 2 min)
1. In the `the-click` folder, ask Claude: *"Create my .env.local from .env.example and generate a PROGRESS_SECRET for me. Don't show me the secret."*
   Or do it yourself:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` in your editor and paste the ElevenLabs values you got **by DM** after the `=` signs. No quotes, no spaces.
3. Check it's ignored. This must print `.env.local`:
   ```bash
   git check-ignore .env.local
   ```
4. Restart `npm run dev` after any change to `.env.local`.

`PROGRESS_SECRET`: locally you can leave it empty (a dev-only fallback is used). On Vercel it's **required**.

---

## B. ElevenLabs (the agent owner only, ~15 min)
We use **ElevenAgents** (voice agents) and **Speech-to-Text**. ElevenCreative is the same account; we don't need it for the product.
The owner's account holds the agents and the key. Everyone else uses the owner's key in their `.env.local`.

### B1. API key
1. elevenlabs.io → bottom-left **Developers** → **API Keys** → **Create API key**.
2. Name it `snakk-hackathon`. **Restrict** it to what we use: ElevenAgents / Conversational AI and Speech to Text (Text to Speech too if T7 plays audio).
3. Set a **credit limit** on the key (e.g. 20 000 credits), so a bug or abuse can't drain the plan.
4. Copy the key **once**, then DM it to Akram (for Vercel) and to teammates who test voice locally.

### B2. Fastest way: sync both agents from the repo (recommended)
`agent/tutor-prompt.md`, `agent/tolk-prompt.md` and `agent/message-prompt.md` are the **source of truth**. One command sets up all three agents exactly as the app expects (prompt, first message, Norwegian + extra languages, client tools with the right names, dynamic-variable placeholders, authentication ON, allowlist `localhost` + our Vercel domain):
```bash
npm run agents:sync      # create/update both agents (needs ELEVENLABS_API_KEY with ElevenAgents: Write)
npm run agents:check     # read-only: ✅/❌ per field, live agent vs. repo
```
If `ELEVENLABS_TOLK_AGENT_ID` or `ELEVENLABS_MESSAGE_AGENT_ID` is empty, that agent is **created** and its id printed: add it to `.env.local` and Vercel.
**Changed a prompt in `agent/*.md`?** Run `npm run agents:sync` after the PR is merged, or the live agent keeps the old prompt. The voice and LLM chosen in the dashboard are left alone.

**Allowlist:** only `localhost`, `the-click-grind6.vercel.app` and the live app `the-click-psi.vercel.app` may start voice sessions. To test voice on a PR preview, add its host for that run: `AGENT_ALLOWLIST_EXTRA=the-click-git-….vercel.app npm run agents:sync`.

### B2b. Tutor agent by hand (only if the script can't be used)
1. **ElevenAgents → Agents → Create agent → Blank agent.** Name it `Snakk Tutor`.
2. **Language:** Norwegian as default. Add English as an additional language (learners can fall back).
3. **Voice:** pick a natural Norwegian-capable voice. Test it in the dashboard.
4. **System prompt:** paste from `agent/tutor-prompt.md` (T2 writes it; Aden's first draft is in git history at `3694677:agent/tutor/system-prompt.md`).
5. **Dynamic variables:** the app sends `scenario_id`, `scenario_title`, `agent_role`, `goal`, `register`, `learner_level`, `opening_line`, `nickname`, `native_language`, `key_phrases`, and (T20) `age_group`, `field`, `interests`. Add them all in the dashboard; the prompt in `agent/tutor-prompt.md` already uses them. Also add the two **client tools** listed there (`flag_register`, `scenario_complete`).
6. **Security tab:** turn **authentication ON** (only signed URLs can start a session) and add our Vercel domain + `localhost` to the allowlist.
7. Copy the **Agent ID** (not secret) → `ELEVENLABS_TUTOR_AGENT_ID`.

### B3. Tolk agent (T8)
Same steps, name it `Snakk Tolk`, prompt from `agent/tolk-prompt.md` (incl. the `show_translation` client tool and its dynamic variables) → `ELEVENLABS_TOLK_AGENT_ID`.

### B4. Message agent (T23, "Say it in Norwegian")
`npm run agents:sync -- message` creates the **text-only** `Snakk Message` agent from `agent/message-prompt.md` (client tool `show_message`) → `ELEVENLABS_MESSAGE_AGENT_ID`. Optional: without it, `/say` still works with Snakk's checked translations and the on-device translator. The key also needs **Speech to Text** and **Text to Speech** for spoken input and voice messages.

### ElevenLabs MCP?
ElevenLabs also has an MCP server that lets Claude call ElevenLabs while you code. **We don't need it.** The product talks to ElevenLabs through our API routes with the key above. Skip it to save credits and avoid putting the key into more places.

---

## C. Vercel (Akram only, free Hobby plan, ~10 min)
Do this **after PR #2 is merged**, so the first deploy is the new setup.

1. **vercel.com/signup → Continue with GitHub** (Hobby plan).
2. **Add New… → Project → Import Git Repository.** If `the-click` isn't listed: **Adjust GitHub App Permissions** → AkodLA → *Only select repositories* → `the-click` → Save.
3. **Import `the-click`.** Framework preset: **Next.js** (auto). Leave the build settings as they are.
4. **Environment Variables** (before clicking Deploy). Add each one and tick **Production and Preview**:
   | Name | Value |
   |---|---|
   | `PROGRESS_SECRET` | generate it on your laptop: `openssl rand -base64 32` (paste the output; don't share it) |
   | `ELEVENLABS_API_KEY` | from the agent owner (DM) |
   | `ELEVENLABS_TUTOR_AGENT_ID` | from the agent owner |
   | `ELEVENLABS_TOLK_AGENT_ID` | from the agent owner (can be added later) |
   | `ELEVENLABS_MESSAGE_AGENT_ID` | T23 message agent, optional (can be added later) |
5. **Deploy.** You get the live URL `https://the-click-….vercel.app`. Post it in the team Discord and add it to the README.
6. **Let teammates open previews:** Project → **Settings → Deployment Protection → Vercel Authentication → off**. (On the free plan teammates can't be added to Vercel, so protected previews would ask them to log in. Previews contain no secrets.)
7. **Check:** Project → Settings → Git → Production Branch = `main`.

### How previews work for the team (automatic)
- Every push to **any branch** builds a **preview**. On every PR, Vercel's bot comments with the preview link. Nobody else needs a Vercel account.
- Merging into `main` updates the **production** link.
- Use the preview link on your **phone** to test the microphone (phones block the mic on `http://`).
- Changed an env var in Vercel? **Redeploy** (Deployments → ⋯ → Redeploy) for it to take effect.
- If a teammate's preview says *"blocked"* or *"needs authorization"*, tell Akram: he approves it once in Vercel.

---

## D. Checks
| Check | Expected |
|---|---|
| `curl https://<your-app>.vercel.app/api/health` | `{"ok":true,"data":{"status":"up",…}}` |
| Open `/learn` and click "I've got it (+5 XP)" on the phrase card | XP toast appears, XP in the top bar goes up |
| GitHub repo → Code search for `sk_` or your key's first characters | nothing found |
