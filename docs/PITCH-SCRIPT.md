# PITCH SCRIPT: Snakk (final, Sunday)

**Speaker: Anas.** Akram drives the phone (demo) and answers technical questions. Anis answers product questions.
**2 minutes + 1 minute of questions.** Facts and sources: `docs/PITCH.md`. Rule: **no source = we don't say it.**
Live app: **https://the-click-psi.vercel.app**

---

## 0. Before going on stage (5 min backstage)
- [ ] Phone on the **phone hotspot** (not venue Wi-Fi), screen mirrored, volume up, Do Not Disturb on.
- [ ] **Earbuds / headset** on the demo phone (the venue is loud; voice is far more reliable with a headset mic).
- [ ] Open the live app → **Me → Start over on this device** so the demo starts at 0 XP.
- [ ] Allow the microphone once (backstage, not on stage).
- [ ] Test the job interview scenario once (credits OK, voice connects).
- [ ] Tolk set to **Norwegian ↔ Japanese** (or Chinese), ready on screen.

---

## 1. The 2-minute script

| Time | Screen (Akram) | Anas says |
|---|---|---|
| **0:00–0:15** | Landing page | «Almost one million people in Norway are immigrants: more than 1 in 6. They learn Norwegian from textbooks, then they meet real Norwegians, and nobody talks like the book. And when you travel, it's the same: in Japan, China or Russia, English often doesn't help you. **Snakk: speak like a local, from day one.**» |
| **0:15–0:30** | `/onboarding` | «You start as a guest: no sign-up. A short test estimates your level…» *(tap 2–3 answers)* «…A2. Now we talk.» |
| **0:30–1:00** | `/speak` → 💼 **Job interview** | «You don't learn a language by reading. You learn it by speaking, in real situations: the doctor, a job interview, a party.» *Akram says:* «**Det var sykt bra, ass.**» *The ✏️ card appears.* «It understood, and it told me: *that's how you talk with friends, not in an interview*. Say «veldig bra». **The language as it's really used, and which words fit which situation.**» |
| **1:00–1:15** | Phrase card → 🎙️ pronunciation, then XP toast | «It checks your pronunciation word by word, and every step gives XP, levels and streaks, so you come back tomorrow. Your progress follows you to your phone with a sync code: no email, no password.» |
| **1:15–1:35** | `/tolk` Norwegian ↔ Japanese | «And when you can't speak it yet? **Tolk.** You speak your language, the other person hears theirs. A parent at school pickup, a worker on day one, a traveller in Tokyo.» *(2 turns.)* |
| **1:35–1:50** | Landing → Pricing | «Learners start free and upgrade for unlimited voice practice. **Workplaces** pay per seat: warehouses, schools, clinics with multilingual teams use Tolk and training in their people's own language.» |
| **1:50–2:00** | – | «Built this weekend: voice AI by ElevenLabs, a server that decides everything that matters, so nobody can fake progress or reach our keys. Next: more languages and our first pilot workplace. **We're Snakk. Let's talk.**» |

**If short on time:** skip the pronunciation beat (1:00–1:15). The job interview and Tolk are the two moments that matter.

---

## 2. If something breaks on stage
| Problem | Do this (don't apologise, keep talking) |
|---|---|
| Voice doesn't connect | «Here's what the learner sees» → open `/phrases`, show a phrase card (use when / avoid / say instead). Keep going. |
| Tutor misses the slang | Say it again, slower: «Det var **sykt** bra». Still missing: show the phrase card for «sykt». |
| Wi-Fi dies | Phone hotspot. Tolk also has a **demo mode** that works offline. |
| Tolk mishears | «In a quiet room with a headset it's much better.» Move on to business. |

---

## 3. The technical part (say it simply)
- **Voice:** ElevenLabs voice agents (the tutor and Tolk) + ElevenLabs speech-to-text for pronunciation.
- **Security by design:** the browser only says *what happened*; our server decides XP, levels and test scores. API keys never leave the server. Checked against the **OWASP Top 10**: strict security headers, input validation on every route, rate limits on everything that costs money, 0 known vulnerabilities in our dependencies.
- **Privacy:** no email, no password, no real name. A learner is a random ID with a nickname. Audio isn't stored by us.
- **Scalable:** stateless app on Vercel (scales automatically) + Postgres (Supabase) reached **only from our server**. Agents are configured from code (`npm run agents:sync`), so a new language or scenario is a text change, not a rebuild.
- **Open for partners:** a versioned partner API with keys (`/api/v1`), so workplace systems can plug in later.

---

## 4. Market, USP, business (for slides and questions)
**The market (say it without invented numbers):**
- In Norway: almost 1 million immigrants (SSB 2026). Public services ordered 1.4 million interpreting jobs in 2025, and about 1 in 4 wasn't done by a qualified interpreter (IMDi). The need to **speak** and to **be understood** is real and daily.
- Worldwide: travellers and workers in countries where English isn't common.

**Who we compete with, and our edge (USP):**
| Alternative | What it lacks | Snakk |
|---|---|---|
| Language apps (text-first) | You tap and read; you rarely **speak** in real situations | Speaking-first, real situations, tells you **which words fit which situation** |
| Translator apps | Translate, but you never **learn**; awkward in a conversation | Tolk **and** a tutor in one app: be understood today, speak yourself tomorrow |
| Human tutors / courses | Expensive, fixed times | Always available, at your level, for the price of a subscription |

**One-sentence USP:** *Snakk is the only app that both teaches you to speak the local language as it's really used, and speaks it for you until you can.*

**Business model:**
- **Learners:** free to start (daily voice limit) → **Plus** monthly subscription for unlimited voice practice and Tolk.
- **Workplaces (B2B):** seats for multilingual teams (warehouses, schools, clinics, municipalities): training in their people's own language + Tolk for everyday moments.
- **Costs:** voice minutes are the main cost, so the free tier is limited and every paid route is rate-limited.

**Roadmap:** more target languages (beyond Norwegian) · pilot with one workplace · native-speaker review of all content · optional accounts on top of the sync code.

---

## 5. Q&A prep (1 minute, short answers)
- **«Can I fake my XP?»** (ethical hacker) «No. The server decides XP and stores it in Postgres; the browser can't change it. Keys never reach the browser. We checked every route against OWASP's Top 10.»
- **«What data do you store?»** (lawyer) «A random ID, a nickname you choose, and your progress. No email, no name, no audio.»
- **«Isn't Tolk a replacement for interpreters?»** (lawyer) «No. Public services must book a qualified interpreter; Tolk is a personal aid for everyday moments, and it says so on screen.»
- **«Why would people pay?»** (investor) «Speaking practice is the expensive part of learning a language. An always-available tutor and a pocket interpreter are worth a monthly fee, and workplaces pay because staff who understand each other work safer.»
- **«Why Norwegian first?»** «We're in Norway, we have native speakers on the team to check the content, and the need is proven here. The engine works for any language.»
- **«What's next?»** «A pilot workplace, more languages, and optional accounts.»

## 6. Words to avoid
- ❌ «certified interpreter», «replaces interpreters» → ✅ «a personal aid for everyday moments».
- ❌ numbers without a source (see `docs/PITCH.md`).
- ❌ «gives your CEFR level» → ✅ «estimates your level».
- ❌ «it understands every accent» → ✅ «it checks which words came through».
