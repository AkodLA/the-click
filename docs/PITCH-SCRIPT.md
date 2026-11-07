# PITCH SCRIPT (T14)

The 2-minute pitch, the demo clicks, the slides and the Q&A. **Facts and sources live in `docs/PITCH.md` (T3).**
Rule: *no source = we don't say it.* Every number below is from `docs/PITCH.md`.

---

## 0. Before going on stage (checklist)
- [ ] Phone on the **phone hotspot**, not venue Wi-Fi. Screen mirrored to the projector. Volume up, Do Not Disturb on.
- [ ] Open the production link, **Me → «Start over on this device»** (bottom of the profile), so the demo starts at 0 XP.
- [ ] Microphone allowed once in the browser (do it backstage, not on stage).
- [ ] Tutor tested once today with the party and job-interview scenarios (ElevenLabs credits OK).
- [ ] Backup video open in a second tab (`docs/demo/`), ready to play if voice fails.
- [ ] Slides: 1 title · 2 problem · 3 demo (live) · 4 Tolk · 5 business · 6 roadmap + ask.

---

## 1. The 2-minute script (demo in English, Norwegian lines in «quotes»)

| Time | Who / screen | Say |
|---|---|---|
| **0:00–0:15** | Slide 2 | «Almost one million people in Norway are immigrants: more than 1 in 6. Most of them learned Norwegian from a textbook: *«Hvordan har De det?»*. Then they meet real Norwegians, and nobody talks like that. **Snakk teaches the Norwegian people actually speak, by speaking it.**» |
| **0:15–0:30** | Phone: `/onboarding` | «First, a 3-minute test estimates your level.» *(Nickname, tap through 2–3 questions or «I'm a total beginner».)* «A2. Now we talk.» |
| **0:30–0:50** | `/speak` → 🎉 **Small talk at a party** | «A party in Oslo.» *Say:* «**Halla! Skjer'a?**» *The tutor answers like a 24-year-old from Oslo would.* «Slang is perfect here.» |
| **0:50–1:10** | `/speak` → 💼 **Job interview** | «Same slang, wrong room.» *Say:* «**Det var sykt bra, ass.**» *The ✏️ card appears:* «sykt» is slang → «**veldig bra**». «The tutor catches it. Every phrase in the app tells you when to use it, when not to, and what to say instead.» |
| **1:10–1:25** | Phrase card → 🎙️ **Say the example** | «And it checks your pronunciation, word by word.» *Green and red words appear.* *XP toast + achievement* → «Streaks, levels, and a weekly league with learners at your level.» *(Tap 🏆 League: rank moved up.)* |
| **1:25–1:45** | Slide 4 → `/tolk` (demo) | «And when you're not ready yet? Since 2022 the law says public services may not use children as interpreters, but kids still end up doing it, and 1 in 4 public interpreting jobs isn't done by a qualified interpreter. **Tolk** is the parent's own aid for everyday moments: the phone lies on the table, each person reads it in their own language.» *(Play 2 turns of the pickup chat.)* «For the formal meeting, the school books a real interpreter. We're the help in between.» |
| **1:45–2:00** | Slides 5–6 | «Learners start free, premium is 99 kr a month. Organisations, like employers, municipalities and schools, buy seats for their people. Next: real accounts, QR check-in at språkkafés, more languages. **We're Snakk. Let's talk.**» |

**Timing tip:** if the tutor is slow, skip the party scenario and go straight to the job interview (the strongest moment).

---

## 2. If something breaks on stage
| Problem | Do this (no apologising, keep talking) |
|---|---|
| Voice doesn't connect / no sound | «Let me show you the recording.» Play the backup video from 0:30. |
| Tutor misses the slang | Say it again, slower: «Det var **sykt** bra.» If it still misses: open `/phrases?id=sykt` and show the card. |
| Wi-Fi dies | Phone hotspot. If the hotspot dies too: backup video. Tolk works offline in **demo mode**. |
| Pronunciation check fails | Skip it; the XP toast also appears when you tap «I've got it» on a phrase. |

---

## 3. Slides (one idea each, big text)
1. **Snakk.** Learn the Norwegian people actually speak, by speaking it. *(Team The Click)*
2. **The problem.** Textbook Norwegian ≠ spoken Norwegian. «Hvordan har De det?» vs «Halla, skjer'a?». ~1 in 6 people in Norway are immigrants (SSB 2026).
3. **Live demo** (phone mirrored).
4. **Tolk.** Kids still end up interpreting (IMDi 2025). Tolk = the parent's aid for everyday moments; the school books the qualified interpreter (tolkeloven § 4).
5. **Business model.**
   - Learners: **Free** (daily tutor limit) → **Premium 99 kr/month** (unlimited tutor, all scenarios, pronunciation everywhere, Tolk).
   - Organisations: **seats** for staff / students + Tolk + a progress overview with no personal data. Buyers: employers and warehouses, municipalities and introduction programmes, schools, libraries.
   - Channels: introduction programmes, employers, libraries and språkkafé organisers. Partner API for warehouse screens and robots.
6. **Roadmap + ask.**
   - Now: tutor, register corrections, pronunciation, phrasebook, Tolk, gamification, security by design.
   - Next 3 months: real accounts + progress in a database (stops token replay), QR check-in at språkkafés, real tandem chat, native-speaker review of every phrase.
   - Later: avatar calls in tandem, a daily agent that finds real language events, Tolk as an API for organisations, more target languages.
   - **The ask:** 2 pilot partners (an introduction programme and an employer) and ElevenLabs credits to run them.

---

## 4. Q&A prep, per juror
**Ethical hacker**
- *«Can I give myself XP?»* No. The browser only reports *what happened*; the server decides the XP and signs the result (HMAC). Editing the token breaks the signature. We ran 15 attacks against our own app: all blocked (`docs/SECURITY.md`, `npm run security-check`).
- *«Can I fake finishing a scenario?»* No: the server asks ElevenLabs whether the conversation happened with our tutor agent, recently, with the learner speaking, and only once. The slang count comes from the tutor's own tool calls.
- *«API keys?»* Server only. The browser gets a short-lived signed URL. Strict CSP, rate limits on every paid route, secret scan over the full git history.
- *«Weak spots?»* We list them ourselves: in-memory rate limits, `'unsafe-inline'` scripts because of Next's static pages, no presence proof for check-ins yet. Fixes are in `docs/SECURITY.md`.

**Lawyer**
- *«Isn't Tolk breaking tolkeloven?»* The duty is on **public bodies**: when they need an interpreter, they book a qualified one. Tolk is the **parent's own** communication aid for everyday moments and says so on screen; it never claims to be a certified interpreter. In our demo the teacher even says the school will book an interpreter for the formal meeting.
- *«Privacy / GDPR?»* No accounts, no names, no emails on our servers. Progress lives in the learner's browser as a signed token. Audio goes to ElevenLabs for speech-to-text and is **not stored by us**. Tolk transcripts live in the browser tab only. Tandem is nicknames only and blocks phone numbers, emails and links.
- *«Children?»* No personal data collected; tandem is moderated by design (report button, no contact details). Age limits come with accounts (roadmap).

**Business / investor**
- *«Why would anyone pay?»* Speaking practice is the expensive part of learning (teachers, tutors). An always-available voice tutor that knows the register is worth a monthly fee; organisations pay because staff who speak Norwegian work safer and stay longer.
- *«Competition?»* Most apps teach textbook sentences; we teach *when to say what*, out loud. (Don't name competitors' weaknesses without a source: see `docs/PITCH.md`.)
- *«Unit cost?»* Voice minutes are the main cost; the free tier has a daily limit, and every paid route has a credit limit and rate limit.

**Education / language expert**
- *«Is your Norwegian correct?»* Every phrase card is checked by a native speaker on the team; phrases are Bokmål as spoken in Eastern Norway, with the region shown when it matters.
- *«How do you place learners?»* The test **estimates** the level (A0–C2) from scored questions, server-side, so answers aren't in the browser. Don't say it «gives your CEFR level».

---

## 5. Words to avoid
- ❌ «certified interpreter», «replaces interpreters» → ✅ «communication aid for everyday moments».
- ❌ numbers without a source (see `docs/PITCH.md` «Do NOT say»).
- ❌ «AI understands your accent» → ✅ «checks which words came through».

## 6. Backup demo video
`docs/demo/backup-demo.mp4`: a recorded walkthrough of the real app (landing → placement test → Home → tutor briefing → phrase card → Tolk demo → profile and league), made from the integration build with Playwright.
⚠️ It has **no live voice** (no ElevenLabs key in the recording environment). Before the Sunday 13:00 code freeze, record a **real** run on a phone with the voice tutor and save it next to it (`docs/demo/backup-demo-voice.mp4`).
