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
| `vocabPacks`, `vocabWords`, `everydayPacks` | `VocabPack[]` (kind `field` / `interest` / `season` / `everyday`), `VocabWord[]` with optional `picture` (one emoji, see `pictures.ts`) | T20 My words, T24 picture words |
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
| `POST /api/agent/signed-url` | `{ mode: "tutor" \| "tolk" \| "message", scenarioId? }` | `{ signedUrl }`. `503 not_configured` if the key/agent id is missing. 10/min per IP. Built in T8, T2 reuses it for `mode: "tutor"`. | T2 (tutor) / T8 (tolk) / T23 (message) ✅ |
| `POST /api/pronunciation` | `multipart/form-data`: `audio` (webm/mp4, max 2 MB / 15 s), `target` (must be a known phrase/sentence id or text from our content), `token` | `{ result: PronunciationResult, token, progress, rewards }` | T5 |
| `POST /api/tts` | `{ phraseId, part?: "text" \| "example" }` (only phrases from our content, no free text) | `audio/mpeg` (ElevenLabs TTS). `503 not_configured` without a key: the browser falls back to its own voice. 30/min per IP. | T7 |
| `GET /api/say/config` | – | `{ listen, voice, agent }` booleans: which T23 helpers this server has (never a key or id) | T23 |
| `POST /api/say/transcribe` | `multipart/form-data`: `audio` (max 2 MB / 15 s) | `{ text }` English speech-to-text (ElevenLabs Scribe, audio not stored). 6/min + 40/day per IP. `422 nothing_heard`, `503 not_configured` | T23 |
| `POST /api/say/voice` | `{ text (≤300 chars, plain text, no markup/links), slow?: boolean }` | `audio/mpeg` voice message (ElevenLabs TTS, same voice as T7). 10/min + 40/day per IP. `503 not_configured` → device voice | T23 |
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

### More words and phrases, with pictures (T24)
- **Pictures are emoji**, by design: same style as the rest of Snakk's tiles, crisp in light and dark mode, no image files, no licences, nothing for the CSP to block. `src/lib/content/pictures.ts` maps every existing word id → emoji; everyday words carry their own. A word without an honest picture gets none (better than a misleading one).
- **Everyday picture words** (`src/lib/content/everyday.ts`, kind `everyday`, ids `everyday-*`): 18 packs, 188 words, A0–B1, ordered by what a total beginner needs first (6 shown, «Show all» for the rest). Shown first on `/words` for beginners (A0–A2 or no level yet), lower down for others. Learning one is the normal `word_learned` event (server XP, daily cap), and they flow into translation memory, pronunciation targets and notes automatically.
- **Picture quiz** on every pack with 4+ unique pictures, two modes: 🖼️ *See it* (picture → pick the Norwegian word → hear it) and 👂 *Hear it* (hear the word → pick the picture; no reading needed, good for A0). Practice only, no XP, nothing stored. Review cards show the picture together with the meaning.
- **Same pictures on every device:** picture tiles use the Noto Color Emoji font (self-hosted by `next/font`, split by character, not preloaded), so newer emoji never show as empty boxes on older Android or Windows 10. A pack page loads roughly 60–470 KB of it once; other pages load none.
- **Explain a word** shows the picture too, and punctuation now stays on the same line as its word.
- **Work and interest packs** got 4 more words each (60 words, all with pictures: blodtrykk, stige, skanner, passord, ukeplan, rundkjøring, kompass…). No two words in a pack share a picture.
- **63 new phrases** (A0–B2, all with use when / avoid when / say instead: everyday politeness, invitations, reactions like «Nei, så hyggelig!», slang like «Helt konge!», formal «Jeg viser til…»; B2–C1 idioms like «å ta seg vann over hodet», «midt i smørøyet», «det sitter langt inne»), linked into tutor scenarios as key phrases.
- All new content was drafted with AI help: a native speaker must check it before the demo.

### Engagement pack (T21)
- **Why this level?** `placement_submitted` now stores `progress.placement` (right answers per level, from `scorePlacement().byLevel`). Shown on `/profile#why-level`.
- **Weekly summary**: the server counts `stats` (lifetime) and `weekStats` (this Oslo week) for words, phrases, scenarios, writing, tandem, pronunciation, events, slangFlags, tests. `/profile#week`, with the most common mistake from the notebook.
- **Mistakes** (`/mistakes`, `src/lib/personal/mistakes.ts`): tutor corrections, Tandem fixes and missed pronunciation words, collected automatically, device-only, practice on the 1-3-7-14-30 rhythm. No XP. Each one can be 📒 saved to **My notes** (`/notes`, T16: words saved on purpose, sorted into notebooks).
- **Certificates vs official tests**: field-test certificates are Snakk practice certificates and say so; official exams are on `/resources` (T16).
- **Explain-a-word** (`<ExplainText text />`, `src/features/explain/`): tap any word in tutor lines, Tandem messages and examples → meaning, register, level, example from our content (simple suffix matching), listen, on-device translation, link to learn it.
- **Daily quests** (`questsForDay(day)` in `src/lib/content/engagement.ts`): 3 per Oslo day, same for everyone. The server checks the daily counters `d:<stat>` after every event, gives the bonus XP once (`quest:<id>`) and unlocks `quest-master` when all 3 are done.
- **Streak freeze**: earned every 7 streak days (max 2), used automatically for exactly one missed day (`touchStreak`). `progress.streakFreezes`.
- **Field level-up test**: event `field_test_submitted { packId, answers: { wordId: meaning } }` → the server checks the answers (≥ 4/5), stores `progress.certificates`, +40 XP once, `certified` badge; max 3 tries a day. Certificate PNG made in the browser.
- **Seasonal challenges** (`seasons`, `seasonPacks`): words of the running season count in `progress.seasons` (server date) → limited badge. Autumn week runs 2–15 Nov 2026.
- **Team league** (`/league` → Teams): join a sample team by code (device setting `prefs.teamCode`); your week XP counts for the team. Real teams need accounts (T17).
- **Tree**: fruits for every 5 words and every conversation; "Share my tree" PNG.

### Better on-device translation (T22)
Checked against Opera's own Translator playground (next.opera.com/web-ai/translator), which uses exactly the `Translator` API we use.
- **Norwegian is `no`** in Opera/Chrome's language list, so `translateText` asks for `no` first (then `nb`).
- **Translation memory** (`src/lib/web-ai/memory.ts`): our human-checked Norwegian ↔ English pairs (phrases, examples, vocabulary, seasonal words: ~420 nb→en, ~376 en→nb) are used before the model: perfect, instant, and they work without Web AI. Result field `via: "memory" | "device" | "same"`.
- **Glossary notes**: Norwegian terms like NAV, fastlege, barnehage, BankID, dugnad come back as `notes` with a short explanation (whole-word matching for short terms, so «navnet» isn't NAV).
- **Quality check**: `checkTranslation()` translates back and compares (`high` / `medium` / `low`), like Opera's «round trip» mode. "Check it" link under device translations.
- **Robustness**: long text is translated sentence by sentence (respects `inputQuota` when the browser reports it), calls can be aborted, translators are destroyed on `pagehide`, every call has a time limit.
- **`/translator`**: browser status per language pair, a self-test (Norwegian → your language → back, with timing) and a free translation box. Linked from Tolk and from translation errors.
- The model itself can't be retrained (it's the browser's); the memory and glossary are how Snakk "teaches" it.

### Say it in Norwegian (T23)
`/say`: the learner says or types something in **English** and gets the natural **Norwegian**, as text or as a **voice message** (play, download mp3, send via the phone's share sheet). Then: "say it yourself, twice".
- **Who is it for?** Friend / neighbour (friendly) or work / school / office like NAV (polite). Sets the tone and gives the agent context.
- **Input:** 🎙️ speak (server Scribe via `/api/say/transcribe`; without a key, the browser's own speech recognition with a privacy note; otherwise typing) or ⌨️ type.
- **Translation order:** (1) Snakk's checked translations (T22 memory, badge "✅ Checked by Snakk", with the phrase's register) → (2) the **Snakk Message agent** (`agent/message-prompt.md`, ElevenLabs, **text-only** session via signed URL `mode: "message"`, client tool `show_message {norwegian, register, literal?, tip?}`, 15 s limit) → (3) the on-device translator (T19/T22). Every result: tap-a-word explanations (`ExplainText`), glossary notes (NAV, fastlege…), register tag, copy, save to notes.
- **Voice message:** `/api/say/voice` (ElevenLabs TTS, optional 🐢 slower version) or the device's own voice (🔊 Listen) when not configured.
- Code: `src/features/say/` (`say-view.tsx`, `message-agent.ts`, `recorder.ts`), `src/server/say.ts`. Linked from Home, `/translator` and Tolk. Nothing is stored on a server.

### Verbs, phrase pictures, parents (T25)
- **3 new picture packs:** Everyday verbs (18: å være, å ha, å gå, å spise…), Question words (9: hva, hvor, når, hvem…), Opposites (12: stor/liten, åpen/stengt, full 🔋 / tom 🪫…). Beginners now see Food, Numbers, Verbs, Question words, Help & emergencies and Home first.
- **Every phrase has a picture of the situation** (`Phrase.picture`, `PHRASE_PICTURES` in `pictures.ts`), shown as the same tile as word pictures on the phrase card. Grammar and filler phrases («ass», «typ», «du not De») have none on purpose.
- **12 phrases for parents** (kindergarten and school): «… er syk i dag», «Kan jeg hente henne litt tidligere?», «Hvem henter i dag?», «Takk for at dere passer så godt på ham», «Kan jeg få en tolk?», «Står det på ukeplanen?»… Linked into the parent-meeting and doctor scenarios.
- **Phrase card UX:** when a phrase is fine everywhere, the «Avoid it when» box is replaced by a neutral «👍 Safe everywhere» (it used to be a red warning box saying «Never wrong»).
- AI-drafted: needs the same native-speaker check.

### Newcomer life, work and dialects (T26)
- **3 picture packs for newcomer life:** 🏦 Bank & papers (konto, BankID, skjema, skattekort, regning…), 🔑 Housing & renting (husleie, depositum, utleier, strøm, vaskekjeller, postkasse…), 🍽️ Kitchen (tallerken, skje, oppvaskmaskin, komfyr, ostehøvel…). Microwave and coffee maker have no honest emoji, so no picture.
- **8 workplace phrases** (A1–B1): «Har du et øyeblikk?», «Kan du vise meg hvordan…?», «Jeg er ferdig med…», «Jeg må melde meg syk», «Kan jeg få fri på fredag?», «Jeg er ikke sikker», «Det skal jeg finne ut av», «Jeg tar det!». Linked into the 5 work scenarios.
- **4 dialect phrases to RECOGNISE** (with region): «Ka du sei?», «Æ e…», «Kor e du?», «ikkje / eg». Each card tells learners to understand them but speak standard Bokmål themselves.

### Culture and small talk (T27)
- **2 picture packs:** 🇳🇴 Norwegian culture (dugnad, friluftsliv, fredagstaco, pålegg, brunost, janteloven, hyttetur, påskekrim, julebord, lørdagsgodt, allemannsretten…), 📚 School subjects (matte, norsk, gym, naturfag, samfunnsfag, kunst og håndverk, mat og helse…).
- **12 small-talk and social phrases:** weather («For et vær!», «Nydelig vær i dag!», «Det er meldt regn», «Det blåser!»), weekend («Hva skjer i helga?», «Hva gjorde du i helga?»), evenings out («Takk for en fin kveld!», «Kom deg hjem trygt!», «Kos dere!»), «Jeg er glad i deg» vs «Jeg elsker deg», texting «hehe / haha», and «Ut på tur, aldri sur!». Linked into party, dinner, work lunch and kiosk scenarios.
- **Round 2 (same PR):** 🐄 Animals (ku, sau, rev, ulv, bjørn, reinsdyr, hval…) and 👕 Clothes (bukse, genser, skjerf, støvler, regntøy, briller…) picture packs; 12 phrases for phone calls («Hvem snakker jeg med?», «Kan jeg legge igjen en beskjed?», «Jeg har dårlig dekning»), restaurants («Kan vi få regningen?», «Kan vi dele regningen?», «Jeg er allergisk mot…», «Jeg spanderer!»), booking («Jeg vil gjerne bestille time») and apologising («Det var ikke meningen», «Jeg beklager», «Ingen fare!»). Linked into café, dinner, doctor, work lunch and site-safety scenarios.

### Doctor, celebrations, phone; shops, neighbours, wishes (T28)
- **3 picture packs:** 🩺 At the doctor (fastlege, venterom, resept, vaksine, blodprøve, svimmel, helsestasjon, sykemelding…), 🎉 Celebrations (bryllup, konfirmasjon, påske, nyttårsaften, eid, ramadan, gave, kake, invitasjon…), 📱 Phone & internet (lader, wifi, melding, app, e-post, logge inn, lenke…).
- **12 phrases:** shops («Kan jeg bytte den?», «Den er ødelagt»), neighbours and housing («Kan du skru ned musikken litt?», «Det lekker fra…»), compliments («Så flink du er!», «Godt jobbet!», «Så fin du er!»), wishes («God jul!», «Godt nyttår! Takk for det gamle!», «God eid!»), «Kondolerer» and «Si ifra hvis…». Linked into doctor, party, IT stand-up, parent-meeting and kiosk scenarios.

### Places, seasons, sports; learning and getting around (T29)
- **3 picture packs:** 🗺️ Places in town (skole, park, stasjon, kirke, moské, museum, svømmehall, legekontor, kjøpesenter, servicetorg), 🍂 Seasons & light (vår, sommer, høst, vinter, midnattssol, mørketida, snøstorm, glatt, brodder, refleks), 🏅 Sports (langrenn, håndball, sykling, skøyter, klatring, yoga, tennis, basketball, idrettslag, trener).
- **12 phrases:** learning («Jeg lærer norsk», «Snakk norsk med meg!», «Si ifra hvis jeg sier noe feil», «Hvordan uttaler man…?»), transport («Går denne bussen til…?», «Må jeg bytte?», «Neste stopp», «Jeg skal av her»), and getting to know people («Hvor kommer du fra?» with a note on when it can feel excluding, «Hvor lenge har du bodd i Norge?», «Jeg savner hjemme», «Jeg er stolt av deg!»). Linked into party, warehouse, work lunch and kiosk scenarios.
