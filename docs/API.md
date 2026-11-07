# Data and API contract

Everyone builds against this. Types: `src/lib/content/types.ts` (source of truth).

## Architecture in one picture
```
Browser ("use client" features)                          Server (src/app/api/** + src/server/**)
 ├─ content: phrases, scenarios, questions (public)        ├─ progress rules: XP, caps, streaks, achievements
 ├─ instant UX checks (empty field, mic allowed?)          ├─ placement ANSWER KEY + scoring
 ├─ shows progress from the signed token        ──event──▶ ├─ signs progress tokens (HMAC, PROGRESS_SECRET)
 │                                              ◀─token─── ├─ ElevenLabs calls (API key lives only here)
 └─ partners/robots/warehouses ──API key──▶ /api/v1/*      └─ partner API auth (hashed keys, scopes, rate limit)
```
**The rule:** the **server decides anything that matters** (points, levels, answers, anything with a key or a cost).
The **browser only does instant UX checks** (is the field empty, is the mic on) and **displays** what the server returned.
Everything in `src/server/` imports `server-only`, so it can never end up in the browser bundle.

## Content (static, `src/lib/content/`)
| Export | Type | Used by |
|---|---|---|
| `phrases`, `getPhrase(id)` | `Phrase[]`: text, meaning, register, level, example, useWhen, avoidWhen, sayInstead | T7 phrasebook, Home, T2 tutor prompt |
| `scenarios`, `getScenario(id)` | `Scenario[]`: title, emoji, level, register, goal, agentRole, openingLine, keyPhraseIds, xpReward | T2 tutor |
| `placementQuestions` | `PlacementQuestion[]` (choice / listen / speak). **No answers**: scoring is server-side (`src/server/placement.ts`) | T4 |
| `achievements` | `Achievement[]` | T6 |
| `leagueWeek`, `leagueMonth` | `LeagueEntry[]` (test data) | T9 |
| `languageEvents` | `LanguageEvent[]` (`isSample: true`) | T11 |
| `tandemPartners`, `tandemDemoChat` | `TandemPartner[]`, `TandemMessage[]` | T10 |
| `REGISTER_STYLE`, `LANGUAGE_NAMES`, `CEFR_LEVELS` | helpers | everyone |

**Register** = `slang | informal | neutral | formal`. Always show it with `<RegisterTag>`.

## Progress (server-authoritative, no database)
The browser reports **what happened**; the server decides **what it's worth** and returns a new **signed token**.
The browser stores the token (localStorage) and can display it, but any edit breaks the signature (`invalid_token`).
```ts
const p = useProgress();   // { nickname, cefr, xp, weekXp, streakDays, unlocked[], learnedPhraseIds[], … }

await progressActions.send({ type: "profile_set", nickname: "FjordFox", nativeLanguage: "es" });
await progressActions.send({ type: "placement_submitted", answers: { q1: 2, q2: 1 } }); // server scores → cefr
await progressActions.send({ type: "phrase_learned", phraseId: "digg" });
await progressActions.send({ type: "scenario_completed", scenarioId: "party", conversationId, slangFlags: 0 });
await progressActions.send({ type: "event_checkin", eventId: "ev-1" });
await progressActions.send({ type: "writing_done", itemId: "ae" });
await progressActions.send({ type: "tandem_message_sent" });
progressActions.reset();   // demo reset
```
- Events: `src/lib/progress/events.ts` (zod schema, shared). Rules and every XP number: `src/server/progress-rules.ts` (`RULES`).
- Toasts come back from the server as `rewards` and are shown automatically.
- Anti-abuse: daily XP cap (600), each scenario's XP once per day, phrases once ever, per-day caps on writing/tandem/pronunciation, rate limit 60 events/min per IP. Day and week use Oslo time **on the server**.
- **`scenario_completed` needs a real tutor conversation** (T13): send the ElevenLabs `conversationId` from `onConnect`. The server checks it with ElevenLabs (our tutor agent, finished, recent, learner spoke, not reused) and counts `flag_register` tool calls itself, so the browser's `slangFlags` is ignored when verified. T2: also pass `scenario_id` as a dynamic variable so the server can match it. Errors: `unverified`, `too_short`, `already_used` (show the message), `verify_unavailable` (retry). See `docs/SECURITY.md`.
- `pronunciation_scored` is **internal only**: `/api/pronunciation` (T5) computes the score and applies it itself; the browser can't send it.
- Player level from XP: `levelProgress(xp)` in `src/lib/progress/levels.ts` (display only).

## API routes (server, need keys)
Response format: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`. Use `ok()`, `fail()`, `parseBody()` from `src/lib/api.ts`; in the browser use `apiFetch<T>()` from `src/lib/api-client.ts`.
**Next 16:** a GET route that doesn't read the request must call `await connection()` first, or it's frozen at build time.

| Method + path | Body | Returns | Task |
|---|---|---|---|
| `GET /api/health` | – | `{ status, time }` | T1 ✅ |
| `POST /api/progress/event` | `{ token: string \| null, event: ProgressEvent }` | `{ token, progress, rewards[] }` | T1 ✅ |
| `POST /api/agent/signed-url` | `{ mode: "tutor" \| "tolk", scenarioId? }` | `{ signedUrl }`. `503 not_configured` if the key/agent id is missing. 10/min per IP. Built in T8, T2 reuses it for `mode: "tutor"`. | T2 (tutor) / T8 (tolk) ✅ |
| `POST /api/pronunciation` | `multipart/form-data`: `audio` (webm/mp4, max 2 MB / 15 s), `target` (must be a known phrase/sentence id or text from our content), `token` | `{ result: PronunciationResult, token, progress, rewards }` | T5 |
| `POST /api/tts` | `{ phraseId, part?: "text" \| "example" }` (only phrases from our content, no free text) | `audio/mpeg` (ElevenLabs TTS). `503 not_configured` without a key: the browser falls back to its own voice. 30/min per IP. | T7 |
| `GET /api/v1/*` | partner API, see `docs/PARTNER-API.md` | | ✅ foundation |

### ElevenLabs details (check the current docs, these are from memory)
- **Voice session:** server calls `GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=…` with header `xi-api-key`. The browser starts the session with `@elevenlabs/react` (`useConversation`; v1 needs a `ConversationProvider`).
- **Two agents** in the ElevenLabs dashboard: `ELEVENLABS_TUTOR_AGENT_ID` and `ELEVENLABS_TOLK_AGENT_ID`. Prompts live in `agent/tutor-prompt.md` and `agent/tolk-prompt.md` (source of truth, pasted into the dashboard).
- **Scenario context:** pass the scenario as **dynamic variables** when starting the session (`scenario_title`, `agent_role`, `goal`, `register`, `learner_level`, `opening_line`), so ONE tutor agent handles every scenario.
- **Pronunciation:** server sends the audio to ElevenLabs **Speech-to-Text** (`POST /v1/speech-to-text`, model "scribe", language Norwegian), then compares the transcript to `target` word by word (lowercase, strip punctuation). Score = % of target words heard. We don't store the audio.
- **Client tools** the tutor can call in the browser (optional, T2):

| Tool | Params | Effect |
|---|---|---|
| `flag_register` | `said`, `register`, `better` | Shows a correction card: "«sykt» is slang. In an interview say «veldig»" |
| `scenario_complete` | `slang_flags` | Ends the scenario → `progressActions.send({ type: "scenario_completed", … })`. The agent never decides XP. |

## Pages (who owns what)
| Route | Screen | Task |
|---|---|---|
| `/` | Landing (pitch page) | T15 |
| `/onboarding` | Placement test → level | T4 |
| `/learn` | Home dashboard | T1 ✅ |
| `/speak` | Scenarios + voice tutor + pronunciation | T2, T5 |
| `/phrases` | Phrasebook: search + filters. Deep links: `?register=slang`, `?level=A2`, `?show=learned\|new`, `?q=hei`, `?id=digg` (opens + highlights one phrase) | T7 |
| `/profile` | Level, XP, achievements | T6 |
| `/league` | Weekly / monthly league | T9 |
| `/tandem` | Anonymous tandem chat | T10 |
| `/events` | Språkkafé events + check-in | T11 |
| `/tolk` | Interpreter | T8 |
| `/write` | Letter drawing | T12 |

### Tolk (T8)
- Agent prompt + dashboard settings: `agent/tolk-prompt.md`. Dynamic variables: `lang_a`, `lang_a_name`, `lang_b`, `lang_b_name`, `setting`.
- Client tool `show_translation({ spoken_language: "a" | "b", original, translation })` puts each turn on the right side of the table. If the agent doesn't call it, the app falls back to pairing the user/agent messages.
- No ElevenLabs key? `/tolk` offers an offline demo (sample parent-teacher meeting, browser voice), also usable as the stage backup.
- After a session, the summary links phrases heard in the meeting to `/phrases?id=…` and the matching scenario to `/speak?scenario=…`. Nothing is stored.

### On-device translation (T19): Opera Web AI / Chrome Translator API
- `src/lib/web-ai/translator.ts`: `translateText(text, from, to, onProgress?)` → `{ ok, text }` or `{ ok: false, reason, message }` (never throws), `translationAvailability(from, to)`, `detectLanguage(text, options)`, `translatorSupported()`, `HOW_TO_ENABLE`.
- Uses the browser's **built-in** `Translator` / `LanguageDetector` (Opera: Settings → Opera AI → «Enable Web AI API»; also Chrome). The model runs **on the device**: no API route, no key, nothing sent to our server or ElevenLabs. First use of a language pair may download a model (progress callback), so call it from a click.
- UI: `<TranslateButton text from to />` (`src/features/translate/translate-button.tsx`). Used in Tolk (⌨️ typing mode), Tandem (translate partner messages; "make it Norwegian" for your draft) and the voice tutor transcript.
- Browsers without it get a clear message (`HOW_TO_ENABLE`) and keep every other feature.

### Personal learning (T20): age group, field, interests
- **About you** (`src/lib/personal/prefs.ts`, `usePrefs()` / `savePrefs()`): `ageGroup` (teen / young / adult / senior, never an exact age), `field` (9 fields), up to 3 `interests`. Stored only in the browser (`snakk.prefs.v1`); it never affects XP.
- **Vocabulary** (`src/lib/content/vocab.ts`): `fieldPacks`, `interestPacks`, `vocabWords`, `getVocabWord`, `packFitsAge`. Each word: level, register, example sentence. Packs can be limited to age groups (e.g. «School & student life» for 13–29).
- **Event** `word_learned { wordId }`: the server checks the word exists, gives `RULES.wordXp` once per word (max `wordsPerDay` per day), unlocks `words-25` and `field-ready`.
- **Review** (`src/lib/personal/review.ts`): Leitner boxes 1-3-7-14-30 days, browser only, no XP.
- **Scenarios** can have `fields`; `/speak` puts the learner's field first (`/speak?field=logistics` also works). The tutor gets `age_group`, `field`, `interests` (see `agent/tutor-prompt.md`).
- Pages: `/words`, `/words?pack=<id>`, `/words?review=1`; "About you" on `/profile#about-you`.

### Engagement pack (T21)
- **Why this level?** `placement_submitted` now stores `progress.placement` (right answers per level, from `scorePlacement().byLevel`). Shown on `/profile#why-level`.
- **Weekly summary**: the server counts `stats` (lifetime) and `weekStats` (this Oslo week) for words, phrases, scenarios, writing, tandem, pronunciation, events, slangFlags, tests. `/profile#week`, with the most common mistake from the notebook.
- **Mistake notebook** (`/notebook`, `src/lib/personal/mistakes.ts`): tutor corrections, Tandem fixes and missed pronunciation words, device-only, practice on the 1-3-7-14-30 rhythm. No XP.
- **Explain-a-word** (`<ExplainText text />`, `src/features/explain/`): tap any word in tutor lines, Tandem messages and examples → meaning, register, level, example from our content (simple suffix matching), listen, on-device translation, link to learn it.
- **Daily quests** (`questsForDay(day)` in `src/lib/content/engagement.ts`): 3 per Oslo day, same for everyone. The server checks the daily counters `d:<stat>` after every event, gives the bonus XP once (`quest:<id>`) and unlocks `quest-master` when all 3 are done.
- **Streak freeze**: earned every 7 streak days (max 2), used automatically for exactly one missed day (`touchStreak`). `progress.streakFreezes`.
- **Field level-up test**: event `field_test_submitted { packId, answers: { wordId: meaning } }` → the server checks the answers (≥ 4/5), stores `progress.certificates`, +40 XP once, `certified` badge; max 3 tries a day. Certificate PNG made in the browser.
- **Seasonal challenges** (`seasons`, `seasonPacks`): words of the running season count in `progress.seasons` (server date) → limited badge. Autumn week runs 2–15 Nov 2026.
- **Team league** (`/league` → Teams): join a sample team by code (device setting `prefs.teamCode`); your week XP counts for the team. Real teams need accounts (T17).
- **Tree**: fruits for every 5 words and every conversation; "Share my tree" PNG.
