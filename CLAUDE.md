# CLAUDE.md: read this first, every session

Team **The Click** at Oslo Sprint 2026 (build deadline **Sun 8 Nov 14:00**).
Product: **Snakk** (working name), **learn the Norwegian people actually speak, by speaking it.** Voice tutor, slang with context (when / when not / say instead), formal vs. informal, levels A0–C2, gamified. Full idea: `docs/PLAN.md`.
Most teammates are new to Git. **You (Claude) do the git work for them, explain each step in one simple sentence, and keep them safe.**

## Stack
- **Next.js 16** (App Router, TypeScript, `src/` dir, `cacheComponents` on) + **Tailwind 4**. ⚠️ Next 16 differs from older versions: check `node_modules/next/dist/docs/` before using an API you're unsure of (see AGENTS.md).
- **ElevenLabs Agents** via `@elevenlabs/react` (voice tutor T2, Tolk T8) and **ElevenLabs speech-to-text** (pronunciation T5). Keys only in API routes.
- **zod** validates every API input.
- **No database (yet).** Content is static TypeScript in `src/lib/content/`. Progress is **computed and signed by the server** and stored by the browser as a token (see "Server vs. client").
- Hosting: **Vercel** (every PR gets a preview link: use it to test the mic on a phone).

## Commands
```bash
npm install                  # once after cloning / when package.json changes
cp .env.example .env.local   # once; fill in values you got by DM (never commit). Full guide: docs/SETUP.md
npm run dev                  # http://localhost:3000
npm run lint
npx tsc --noEmit             # type check (run `npm run build` once first if it complains about .next/types)
npm run build                # must pass before opening a PR
```

## Folder structure (one owner per feature folder = few merge conflicts)
```
src/app/
  page.tsx                 landing page (public, T15)
  onboarding/              placement test (T4)
  (app)/layout.tsx         app shell: top bar, bottom nav, reward toasts
  (app)/learn|speak|phrases|profile|league|tandem|events|tolk|write/page.tsx
                           thin pages: they only render a component from src/features/
  api/**/route.ts          server routes, ONLY for things that need a secret key
src/features/<feature>/    the real UI + logic per feature (home, phrases, speak, onboarding, …)
src/components/ui.tsx      UI kit: Button, Card, Badge, RegisterTag, ProgressBar, SectionTitle, ComingSoon
src/components/app-shell.tsx
src/lib/content/           SHARED, public: types.ts (contract) + phrases, scenarios, placement questions, community (test data)
src/lib/progress/          SHARED: events.ts (zod contract), store.ts (browser: useProgress, progressActions.send), levels.ts
src/server/                SERVER ONLY (import "server-only"): env, progress-rules (XP/achievements), progress-token (HMAC),
                           placement (answer key), partners (API keys), rate-limit, time (Oslo day/week)
src/app/api/v1/            Partner API for other services (warehouses, robots, schools), key + scope protected
scripts/                   create-partner-key.mjs
src/lib/api.ts             server: ok() / fail() / parseBody()
src/lib/api-client.ts      browser: apiFetch()
agent/                     ElevenLabs agent prompts (source of truth, pasted into the dashboard)
docs/                      PLAN.md · API.md · TASKS.md · PITCH.md
```

## Server vs. client (security model, follow it in every task)
| The **server** (API routes + `src/server/`) decides | The **browser** does |
|---|---|
| XP, levels, streaks, achievements, daily caps (`src/server/progress-rules.ts`) | Displays progress from the signed token |
| Placement answers and scoring (`src/server/placement.ts`) | Shows questions, collects the chosen options |
| Anything using an API key or costing money (ElevenLabs) | Instant UX checks: empty field, mic permission, length hints |
| Input validation with zod (always, even if the browser checked too) | Optimistic UI and loading states |
| Partner API auth, rate limits, upload size limits | Never trusts itself: it sends *events*, not amounts |

- New thing that gives points? Add an event to `src/lib/progress/events.ts` and a rule to `progress-rules.ts`. **Never** send an XP amount from the browser.
- Secrets only via `env()` in `src/server/env.ts`. Never `process.env.X` in a client file.
- Answers, prompts with secrets, scoring keys → `src/server/`. Public content → `src/lib/content/`.

## UI and UX rules (UX is how we win)
- **Use the UI kit** (`src/components/ui.tsx`) and the color tokens (`bg-surface`, `text-muted`, `bg-brand`, `bg-accent`…). **No raw hex colors**, no new component libraries.
- Copy patterns from Home (`src/features/home/home-dashboard.tsx`): rounded-3xl cards, bold headings, generous spacing, one clear main action per screen.
- **Mobile-first.** Test at 375 px wide. Tap targets ≥ 44 px. The bottom nav covers the last 7 rem, and the shell already pads for it.
- Every phrase shows its register with `<RegisterTag>`. Every reward goes through `progressActions` so the toast appears.
- Learner-facing text is **English, with Norwegian examples in «quotes»**. Code and comments are English.
- Accessibility: real `<button>`/`<Link>`, `aria-label` on icon-only buttons, never color alone (add text or an emoji), respect reduced motion.
- Every screen needs loading, empty and error states. A beginner must never get stuck.

## Coding conventions
- TypeScript strict. No `any` unless commented why.
- Pages in `src/app` stay thin. Put components in `src/features/<feature>/`. Use `"use client"` only where needed (state, mic, localStorage).
- **API routes** (only when a secret is needed): validate with `parseBody(req, zodSchema)`, answer with `ok(data)` / `fail(code, message, status)`. **Next 16:** a GET route that doesn't read the request must `await connection()` first, or it's frozen at build time.
- **Shared files** (`src/lib/content/types.ts`, `src/lib/progress/*`, `src/server/*`, `src/components/ui.tsx`, `src/lib/api*.ts`): change them in a **small separate PR** and tell the team. Adding content (phrases, scenarios) is fine in any PR. A placement question change also needs the answer key in `src/server/placement.ts`.
- Partner API: see `docs/PARTNER-API.md`. Every `/api/v1` route starts with `authenticatePartner(req, scope)`.
- Keep it simple: hackathon MVP, no premature abstractions, no new dependency without a reason in the PR.

## Git workflow (you run it for the user)
1. Always start from fresh main: `git checkout main && git pull`, then create a branch.
2. **Branch names:** `feat/T4-placement-test` · `fix/T2-mic-permission` · `docs/T14-pitch` · `chore/T13-security`. Always include the task id.
3. **Commits:** small and often, conventional style: `feat(onboarding): add level reveal`.
4. Before pushing: `npm run lint && npx tsc --noEmit && npm run build`.
5. Push the branch and open a PR with `gh pr create` (template fills in). Title: `T4: Placement test`. Akram reviews and squash-merges.
6. To get teammates' work: `git fetch origin && git merge origin/main` (merge, **not** rebase).
7. **Merge conflicts:** explain both sides in plain words, keep both people's work when possible, **ask before deleting anyone's code**.
8. **Never:** commit to `main`, force-push, `git reset --hard` on shared branches, rewrite pushed history. `main` is protected.

## Secrets, privacy, security (an ethical hacker and a lawyer are on the jury)
- Keys live only in `.env.local` (git-ignored) and in Vercel's settings. `.env.example` lists the names.
- **Never** put a secret in code, commits, PR text, screenshots, chat, or a `NEXT_PUBLIC_*` variable. Calls with keys only happen in API routes.
- Validate every input with zod. Limit upload size (audio) and rate-limit routes that cost money.
- If a key is ever committed: stop, tell Akram, **rotate the key** (deleting the commit is not enough).
- No personal data on the server. Tandem is nicknames and avatars only. Don't store audio.
- Test data only. Mark sample data clearly (`isSample: true`).

## How to pick up a task
1. Open `docs/TASKS.md`. Pick a ★ task or the top task whose dependencies are done and that has no owner.
2. Claim it (name in Owner, or say it in Discord) **before** starting.
3. Read the task's row in `docs/TASKS.md`, the related section in `docs/API.md`, and the placeholder page it replaces.
4. Branch → build the slice end to end → test in the browser (and on a phone via the PR's Vercel preview) → PR.
5. Done = PR merged + status ✅ in TASKS.md. Push early and often: if you get stuck, someone else can continue from your branch.
6. Stuck 15 min → tell the team.

## Checkpoints
Sat 12:30 skeleton live · Sat 15:00 placement → tutor → XP works · Sat 18:00 core feature freeze · Sun 13:00 code freeze + demo video · Sun 13:30 tag `v1.0-submission` · Sun 14:00 deadline.
