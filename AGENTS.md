# AGENTS.md (Noe Shiftica — project-specific)
# Read by ALL agents (Codex / Claude Code / Gemini / etc.).
# Codex loads this file automatically; Claude/Gemini honor it alongside CLAUDE.md / GEMINI.md.

## Universal rules (single source of truth)
The universal workflow (Startup Protocol / HARD STOP / Learning Loop / Coder–Tester
loop / Post-Edit Self-Check) lives in global `~/.gemini/AGENTS.md`. **Read it at startup.**

## Files to ALWAYS read at startup (before touching anything)
- `.antigravity/rules.md`          ← project master constraints. MUST read FIRST.
- `.antigravity/memory-schema.md`  ← unified memory-layer contract (how recall/write works).
- `.antigravity/notouch.md` / `.antigravity/sessions.md`
- **Pre-task Signs, bugs, knowledge and risks** now live in `.antigravity/memory.db`
  (readable mirror under `.antigravity/memory/`). Recall the relevant Signs before
  a task: `uv run .antigravity/db/query.py "<what you're about to do>" --type sign`.

**Two-strike rule**: if you hit the *same* error twice, STOP trial-and-error and
re-read the relevant Signs (`query.py --type sign`) + the original instruction
before retrying (the original instruction + Signs win over your latest failure log).

## Standing instructions (Azuma) — apply to EVERY agent
- Make the change and run `git add`; treat staging as the work boundary.
- **NEVER run `git commit` or `git push` until Azuma explicitly says so.** "Done" / "verified" is NOT permission.
- No need to wait on or report background rollouts / long prod builds (Azuma checks those); tsc/unit verification is enough to report done.
- Packages: JS = pnpm (+ fnm) only / Python = uv only. NEVER use pip or npm.
- After editing source, verify it is clean UTF-8 with no NUL bytes (see Sign "Source files must stay clean UTF-8" in `memory/signs.md`).
- **Build features as Payload plugins** (`src/plugins/<name>/`) — 機能はプラグイン単位で作る:
  1. If a change fits the scope of an existing plugin, modify / extend **that** plugin instead of adding
     code elsewhere (`src/app/api/*`, `src/lib/*`, `src/collections/*`, …).
  2. If it belongs to no existing plugin, create a **new plugin** for it and register it in
     `payload.config.ts` → `plugins` (that file is protected: get approval first).
  Check `ls src/plugins` and each plugin's `index.ts` / README before deciding where a change goes.

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
