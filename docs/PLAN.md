# PLAN: Snakk (working name)

> **Learn the Norwegian people actually speak, by speaking it.**
> Tasks: `docs/TASKS.md` · API & data: `docs/API.md` · How we work: `CLAUDE.md`

## The problem
- Textbooks and apps teach **written, textbook Norwegian**. Newcomers learn «Hvordan har De det?», and then nobody in Norway talks like that.
- The hard part of a new language is **speaking**, and knowing **which words fit which room**: slang with friends, neutral at work, formal at the doctor or with NAV.
- Until they're fluent, many families rely on **their kids to interpret** at school meetings and doctor visits. That's a burden on the children, and the adults miss things.

> Every number in the pitch needs a source (T3/T14). **No source = we don't say it.**

## Who it's for
- **Learner:** an adult newcomer in Norway (A0–B2) who has to use Norwegian daily: at work, at school meetings, socially.
- **Also:** anyone learning a language through the tandem exchange (a Norwegian learning Spanish ↔ a Spanish speaker learning Norwegian).
- **Buyers:** learners (freemium) and organisations (schools, municipalities, employers, warehouses) paying for **Tolk** interpreter seats and staff training.

## What makes it different
1. **Speaking first.** You talk to an AI voice tutor (ElevenLabs) in real-life scenarios from day one.
2. **Register is a first-class feature.** Every phrase shows ✅ when to use it · 🚫 when not to · 💡 what to say instead. The tutor catches slang in a job interview.
3. **Real spoken Norwegian**, checked by native speakers, not machine translation.
4. **Real-life bridge:** språkkafé events + check-in rewards, an anonymous tandem with natives, and Tolk for the moments you can't practise.

## 2-minute pitch (learner-first story; the demo is in English)
| Time | Beat |
|---|---|
| 0:00–0:15 | Hook: «Textbooks taught me "Hvordan har De det?" Nobody in Norway says that.» The problem in one sentence + one sourced number. |
| 0:15–1:25 | **Live demo** on a phone, mirrored on the projector: ① placement test in 3 taps → *A2* ② the **party** scenario: the learner talks to the tutor, says «Halla!», the tutor answers naturally ③ switch to the **job interview** scenario: the learner says «Det var sykt bra, ass» and the tutor flags slang in a formal room and suggests «Det var veldig bra» ④ **pronunciation check** on one sentence → 2 words highlighted ⑤ XP toast + achievement unlocked → league rank moves up. |
| 1:25–1:45 | «And when you're not ready yet»: **Tolk** interprets a parent-teacher meeting both ways. No more kids as interpreters. |
| 1:45–2:00 | Business: freemium learners + B2B Tolk seats (schools, municipalities, employers). Roadmap. The ask. |

## Scope (agreed: "focused core")
**Real (must work live):**
- Placement test A0–C2 (`/onboarding`)
- Voice tutor with scenarios via ElevenLabs Agents, correcting register and slang (`/speak`)
- Pronunciation check: say a sentence → ElevenLabs speech-to-text → word-by-word result (`/speak`)
- Phrasebook with register tags and use / avoid / instead (`/phrases`)
- Gamification: XP, player levels, streak, achievements, reward toasts (`/profile`, top bar)
- **Tolk** interpreter mode, two-way (`/tolk`)

**UI with test data (looks real, clearly marked as demo data in code):**
- Anonymous tandem: nickname + avatar matching and chat with a scripted partner (`/tandem`)
- Weekly / monthly league by level (`/league`)
- Språkkafé events + check-in for XP (`/events`)
- Letter drawing for æ ø å (`/write`)

**Partner API (foundation built, not a focus):** other services (warehouse systems, Wybe-style robots, schools) connect with an **API key** to `/api/v1/*`. Hashed keys, scopes, rate limits. Today: phrases with context. Next: Tolk as an API. See `docs/PARTNER-API.md`.

**Roadmap slide only (not built):** avatar audio/video calls · daily AI agent that finds new language events · more languages (Spanish, English…) · native-speaker review marketplace.

## What's real vs. faked
- **Real:** voice conversations, register and slang corrections, speech-to-text pronunciation check, interpreter, placement scoring (server), XP / achievements (server rules, signed progress), partner API keys, the deployed app.
- **Faked:** other learners in the league and tandem (test nicknames), events (sample data), tandem partner replies (scripted).

## Privacy and security by design (for the legal and security jurors)
- **No accounts, no personal data on our servers.** The server computes and *signs* progress; the learner's browser keeps it. Nobody can fake points. Tandem is nicknames and avatars only.
- Security headers, input validation on every route, rate limits, daily XP caps, hashed partner API keys with scopes.
- API keys stay server-side. The browser gets a short-lived signed URL for voice sessions.
- Audio for the pronunciation check is processed and **not stored** by us.
- Tolk: we state clearly that it's a communication aid, not a certified interpreter (legal note for the pitch).

## Business model
- **Learners:** free (daily limit) → premium monthly subscription (unlimited tutor minutes, all scenarios).
- **Organisations:** Tolk seats + staff language training (schools, municipalities, employers with multilingual staff, warehouses).
- Channels: introduction programmes for newcomers, employers, libraries and språkkafé organisers.

## Risks
| Risk | Plan |
|---|---|
| Wi-Fi or voice fails on stage | Phone hotspot + backup demo video recorded before Sun 13:00 |
| Tutor says something wrong in Norwegian | A native speaker on the team tests every demo line (T11) |
| Scope creep | Freeze core at Sat 18:00. After that, only polish and pitch. |
| ElevenLabs credits run out | Credit limit on the key; test with short sessions |

## Name ideas (vote)
**Snakk** (working name) · Prat · Snakkis · Si det · Kompis
