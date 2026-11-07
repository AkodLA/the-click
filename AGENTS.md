<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Team rules for any AI agent (Codex, Cursor, Copilot, Claude…)

**Read `CLAUDE.md` in this folder before doing anything.** It has the stack, folder structure, commands, coding conventions, git workflow and secrets rules for this repo. They apply to every agent, not just Claude.

Short version: never commit to `main`, never force-push, never commit `.env*` files or keys, one task = one branch = one PR, tasks are in `docs/TASKS.md`, the API contract is in `docs/API.md`.
