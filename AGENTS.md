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

## Architecture rule — Payload CMS changes ship as plugins (Azuma, standing)
Every feature added to or changed in anything Payload CMS–related (admin UI, collections'
behaviour, hooks, endpoints, Lexical editor features, rich-text rendering on the frontend, …)
MUST be built as a self-contained module under `src/plugins/<pluginName>/`.
- **One plugin = one directory**: the entry point (`index.ts` exporting the Payload `Plugin`,
  or `feature.server.ts` / `feature.client.tsx` for a Lexical feature, or exported JSX
  converters), a `README.md` (what it does, why, how it is registered), and
  `__tests__/unit.test.ts` whenever it contains logic.
- **Outside the plugin directory, only wire it up**: one import + one registration line
  (`payload.config.ts` `plugins` / editor `features`, or the consuming component). Do not
  spread the plugin's logic across core files.
- **Extend, don't edit core**: add fields / hooks / endpoints from the plugin instead of
  editing `src/collections/*` or `src/payload.config.ts` directly. Those are protected files,
  so even the single registration line there needs Azuma's approval first (HARD STOP).
- Helpers shared between plugins go in `src/plugins/shared/`.
- Examples to follow: `markdownImport/`, `ogImageAutoFill/`, `searchReplace/`, `articleImages/`.
- If a change genuinely cannot be a plugin, STOP and ask Azuma before implementing it in core.

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
