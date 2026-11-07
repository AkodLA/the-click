# GitHub quickstart (for beginners)

You don't need to know Git. **Claude does the Git work.** You tell it what you want in plain English.

## Words you'll hear
- **Repo:** our project folder on GitHub: https://github.com/AkodLA/the-click
- **Clone:** download the repo to your computer (once).
- **Branch:** your own copy to work in, so you don't break things for others.
- **Commit:** a saved checkpoint of your work.
- **Push:** upload your commits to GitHub.
- **Pull request (PR):** "please add my work to the main version."
- **main:** the shared version. It must always work, and it's protected: nobody can push to it directly.

## 1. Get access
1. Have a GitHub account (github.com/signup).
2. Send your **GitHub username** to Akram. He adds you as a collaborator.
3. **Accept the invite** (email, or github.com/notifications). Reading the repo works without an invite, **pushing doesn't**.

## 2. Set up Claude: pick ONE way

### A) Claude desktop app (recommended, works on your own laptop)
1. Install from https://claude.com/download and log in with **your own** Claude account.
2. Code tab → start a session → paste the setup prompt from your personal handout (installs Git, GitHub CLI and Node.js, logs you in with `gh auth login --git-protocol https --web`, and clones the repo into `the-click`).
3. Start a new Code session **inside the `the-click` folder**. Work from there.

### B) Claude Code on the web (claude.ai/code, runs in the cloud)
1. **Akram, once:** install the Claude GitHub App on the repo: https://github.com/apps/claude/installations/select_target → AkodLA → *Only select repositories* → `the-click`.
2. You: connect GitHub in claude.ai (if pushing fails, reconnect: https://claude.ai/customize/connectors?auth_start=github&auth_start_force=1).
3. Start a session on `AkodLA/the-click`.
4. ⚠️ The cloud computer is temporary: **push often**, or your work can disappear.

> ⚠️ If Claude ever says it's using an **API key** instead of your Claude account, stop and tell Akram, or you'll be billed per token.

## 3. How you work: just tell Claude

| You want to… | Say this to Claude |
|---|---|
| Start a task | "Start task **T4** from docs/TASKS.md. Get the latest main and make a branch for me." |
| Save and share your work | "Commit my work, push it, and open a pull request." |
| Get everyone else's latest work | "Bring the latest changes from main into my branch." |
| A merge conflict appears | "There's a merge conflict. Explain both sides simply, keep both people's work if possible, and ask me before deleting anything." |
| Fix an error | Paste the error, then say "Fix this." |
| Check nothing is broken | "Run lint, type check and build, then run the app and check it still works." |
| See what changed | "Summarize what you changed and why." |

**Branch names** (Claude makes them): `feat/T4-shift-screen` · `fix/T4-button-size` · `docs/T14-pitch` · `chore/...`. Always with the task id.

## The 5 rules
1. **Never work on `main`.** Always a branch.
2. **One task = one branch = one pull request.** Small tasks (1–3 h).
3. **Claim a task before you start:** your name in `docs/TASKS.md` or in the team chat.
4. **Never share or commit keys or passwords.** They go in `.env.local` (never uploaded). Keys are shared by **Discord DM only**.
5. **Stuck for 15 minutes? Tell the team.**

## How we split the work
No fixed "frontend" or "backend" roles. **Everyone builds a whole feature**, from screen to data. Tasks are in `docs/TASKS.md`. **Akram merges PRs** and keeps `main` working. Every 2 hours: a 5-minute stand-up (done / next / blocked).
