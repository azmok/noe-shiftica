# AGENTS.md (Noe Shiftica — project-specific)
# Read by ALL agents (Codex / Claude Code / Gemini / etc.).
# Codex loads this file automatically; Claude/Gemini honor it alongside CLAUDE.md / GEMINI.md.

## Universal rules (single source of truth)
The universal workflow (Startup Protocol / HARD STOP / Learning Loop / Coder–Tester
loop / Post-Edit Self-Check) lives in global `~/.gemini/AGENTS.md`. **Read it at startup.**

## Files to ALWAYS read at startup (before touching anything)
- `.antigravity/GUARDRAILS.md`  ← pre-task Signs (known-mistake prevention). MUST read FIRST.
- `.antigravity/rules.md`        ← project master constraints.
- `.antigravity/notouch.md` / `.antigravity/potential-risks.md` / `.antigravity/bug-history.md` / `.antigravity/sessions.md`

**Two-strike rule**: if you hit the *same* error twice, STOP trial-and-error and
re-read `.antigravity/GUARDRAILS.md` + the original instruction before retrying
(the original instruction + GUARDRAILS win over your latest failure log).

## Standing instructions (Azuma) — apply to EVERY agent
- Make the change and run `git add`; treat staging as the work boundary.
- **NEVER run `git commit` or `git push` until Azuma explicitly says so.** "Done" / "verified" is NOT permission.
- No need to wait on or report background rollouts / long prod builds (Azuma checks those); tsc/unit verification is enough to report done.
- Packages: JS = pnpm (+ fnm) only / Python = uv only. NEVER use pip or npm.
- After editing source, verify it is clean UTF-8 with no NUL bytes (see GUARDRAILS Sign 01).

## Protected files (editing requires explicit approval — HARD STOP)
- src/collections/*
- src/payload.config.ts
- src/access/*
- src/lib/db.ts
- components/Footer.tsx
(Also mechanically enforced at commit time by the pre-commit `protect-files` hook.)

## DB / Storage Sanctuary
Destructive operations on the production DB / Storage are forbidden.
Strictly follow the pre-deploy backup-branch workflow.
