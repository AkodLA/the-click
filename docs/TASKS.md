# Tasks

Vertical slices: each task goes from screen to logic to data. 1–3 h each. **Claim before you start** (put your name in Owner).
Status: ⬜ todo · 🟡 in progress · 🔵 PR open · ✅ merged. ★ = start now, in parallel.
Build every screen with the UI kit (`src/components/ui.tsx`) and copy the patterns from Home (`src/features/home/home-dashboard.tsx`).

| ID | Task | Depends on | ~h | Suggested | Owner | Status |
|---|---|---|---|---|---|---|
| ★T1 | Bootstrap: docs, design system, app shell, content, **server-side progress rules + signed tokens**, partner API foundation, security headers, Home, Vercel, protect main | – | 2 | Akram | Akram | 🟡 |
| ★T2 | **Voice tutor** `/speak`: scenario list, create the tutor agent in ElevenLabs (`agent/tutor-prompt.md`), `POST /api/agent/signed-url`, talk screen with live transcript, mic state, end button, on finish send `scenario_completed` (server gives the XP). The tutor must catch slang in formal scenarios. | T1 | 3 | Anis | | ⬜ |
| ★T3 | **Content**: more phrases (aim for 30, real spoken Norwegian, every card checked by a native speaker), scenario goals, placement questions; **pitch facts with sources** in `docs/PITCH.md` | T1 | 2–3 | Anas | | ⬜ |
| ★T4 | **Placement test** `/onboarding`: nickname + native language → 9 questions (tap / listen / speak) → send `placement_submitted` (the **server** scores it) → animated level reveal (A0–C2) → go to `/learn`. Smooth, one question per screen, progress bar. | T1 | 2–3 | Aden | | ⬜ |
| T5 | **Pronunciation check**: record a sentence in the browser → `POST /api/pronunciation` (ElevenLabs speech-to-text) → words highlighted green/red + score + tip. The route applies `pronunciation_scored` itself (server-only event). Limit audio size/length. Used inside `/speak` and phrase cards. | T2 | 2–3 | | | ⬜ |
| T6 | **Gamification** `/profile`: level ring, XP, streak, achievement grid (locked/unlocked), weekly XP; tune `RULES` in `src/server/progress-rules.ts` | T1 | 2 | | | ⬜ |
| T7 | **Phrasebook** `/phrases`: register filter chips (slang / informal / neutral / formal), level filter, search, `PhraseCard` list, "play audio" (ElevenLabs TTS, optional) | T1 | 2 | | | ⬜ |
| T8 | **Tolk** `/tolk`: pick the two languages → big two-sided "table" layout (phone lies between two people) → interpreter agent (`agent/tolk-prompt.md`) translates both ways; transcript in both languages | T2 | 2–3 | | | 🟡 |
| T9 | **League** `/league`: week/month toggle, grouped by your CEFR level, you inserted with your `weekXp`, podium for the top 3, "promotion zone" | T6 | 1–2 | | | ⬜ |
| T10 | **Tandem** `/tandem`: "I speak X, I want Y" → matching cards (nickname + avatar only) → chat screen with the scripted partner + correction bubbles; privacy note. Avatar calls = "coming soon" button. | T1 | 2–3 | | | ⬜ |
| T11 | **Events** `/events`: språkkafé list (sample data badge), filter by level, check-in button → `event_checkin` → badge + XP | T1 | 1–2 | | | ⬜ |
| T12 | **Write** `/write`: canvas with a faint letter (æ ø å, then short words) to trace with finger or mouse, "done" → XP | T1 | 1–2 | | | ⬜ |
| T13 | **Security pass**: strict Content-Security-Policy (allow ElevenLabs), rate limit on `/api/agent/signed-url`, verify `conversationId` with ElevenLabs before giving scenario XP, secret scan, try to cheat our own XP | T2 T5 | 1–2 | | | ⬜ |
| T14 | **Pitch**: 2-min script (see PLAN.md), Q&A prep per juror, business model slide, roadmap slide, legal note for Tolk, **backup demo video** (Sun before 13:00) | T2 | 3 | Anas | | ⬜ |
| T15 | **Landing page** `/` polish: pricing section, "for organisations" (Tolk) section, screenshots | T1 | 1–2 | | | ⬜ |
| T16 | **UX polish + demo path**: loading / empty / error states, mobile check on a real phone, `progressActions.reset()` button for demo, run the exact demo 5× | T2 T4 T5 | 2 | | | ⬜ |
| T17 | (Optional) Supabase: real accounts + real tandem chat (Realtime) + progress in a DB (stops token replay). Only if everything above is done. | – | 3+ | | | ⬜ |
| T18 | (Optional) Partner API: add `translate` scope (Tolk as an API for warehouses / robots / schools), API docs page | T8 | 2 | | | 🟡 |

## Checkpoints
| When | Must be true |
|---|---|
| Sat 12:30 | Skeleton live on Vercel, everyone has pulled main |
| Sat 15:00 | Core works: placement → talk with tutor → XP toast |
| Sat 18:00 | Core feature freeze (T2, T4, T5, T7, T6). After this: test-data features, polish, pitch. |
| Sun 13:00 | Code freeze + backup demo video recorded |
| Sun 13:30 | Tag `v1.0-submission`, submit with `/lever` |
| Sun 14:00 | Hard deadline: repos lock |
