# Cline rules — Noe Shiftica

The project rules shared by every agent (Cline / Claude Code / Codex / Gemini) live in
**`AGENTS.md` at the repository root. Read it before starting any task and follow it.**
AGENTS.md is the single source of truth; if anything here disagrees with it, AGENTS.md wins.
Add new shared rules to AGENTS.md, not to this folder.

The rules most often missed, repeated here so they apply even before AGENTS.md is opened:

- **Payload CMS changes ship as plugins.** Any feature added to or changed in anything
  Payload CMS–related goes into a self-contained `src/plugins/<pluginName>/` module
  (entry point + `README.md` + `__tests__/unit.test.ts` when it has logic). Outside that
  directory, only add the import + registration line. Ask Azuma before touching core instead.
- **Protected files** (`src/collections/*`, `src/payload.config.ts`, `src/access/*`,
  `src/lib/db.ts`, `components/Footer.tsx`) need Azuma's explicit approval before editing.
- **Stop at `git add`.** Never `git commit` / `git push` until Azuma explicitly says so.
- Packages: pnpm only (JS), uv only (Python). Never npm / pip.
