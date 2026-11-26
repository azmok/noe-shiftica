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
- Make the change, then `git add` → `git commit` → `git push` at the agent's own discretion (approved by Azuma on 2026-11-24). Push to the working branch only.
- Opening pull requests and merging them into main is also at the agent's own discretion (approved by Azuma on 2026-11-25), including the md-assets sync PRs opened by noe-posts' Action. Make sure tsc / unit tests pass before merging. Exception: a change that needs a column-adding/altering migration is merged only after that migration has been run for real (dry-run → Azuma's approval → run). Protected-file edits, running migrations for real, and destructive DB operations still need Azuma's prior approval.
- No need to wait on or report background rollouts / long prod builds (Azuma checks those); tsc/unit verification is enough to report done.
- Packages: JS = pnpm (+ fnm) only / Python = uv only. NEVER use pip or npm.
- After editing source, verify it is clean UTF-8 with no NUL bytes (see Sign "Source files must stay clean UTF-8" in `memory/signs.md`).
- **Build features as Payload plugins** (`src/plugins/<name>/`) — 機能はプラグイン単位で作る:
  1. If a change fits the scope of an existing plugin, modify / extend **that** plugin instead of adding
     code elsewhere (`src/app/api/*`, `src/lib/*`, `src/collections/*`, …).
  2. If it belongs to no existing plugin, create a **new plugin** for it and register it in
     `payload.config.ts` → `plugins` (that file is protected: get approval first).
  Check `ls src/plugins` and each plugin's `index.ts` / README before deciding where a change goes.

## AI 共通の脳（ai-brains）— すべての AI・すべての端末で共通
AI の共通ルール・教訓・ミスの記録・引き継ぎは、非公開リポジトリ `azmok/ai-brains` にまとめてある（2026-11-26 に `noe-shiftica-ais-self-learning` から改名）。
このリポジトリは公開なので、失敗の記録・教訓・引き継ぎは置かない。全体の設計は ai-brains の `README.md`。
- **始めに** `node scripts/ai-learning.mjs sync` を実行する。手元の PC では、無ければプロジェクトの中の `ai-brains/` にクローンする（クラウドはセッションに `azmok/ai-brains` を入れる。`../ai-brains` に置かれる）。
  共通・技術・このプロジェクトの教訓と、引き継ぎの `tasks.md` が表示される。
- 次に ai-brains の `common/rules.md`（共通ルール）を読み、それに従う。引き継ぎ・ミスの記録（`record --scope`）・教訓の置き場所は、そこに書いてある。
- 取得できなければ黙って進めず、あずまに伝える。
- このプロジェクトの引き継ぎは `projects/noe-shiftica/handoff/`、設計マップは `projects/noe-shiftica/design-map/index.html`。
- `handoff/` と `mistakes/` の変更は、Claude Code では Stop フック（`node scripts/ai-learning.mjs push`）が自動で main に反映する。ほかの AI は、終わるときに自分で `push` を実行する。それ以外の変更は、作業ブランチ → プルリクエストで、あずまの承認を待つ。

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
