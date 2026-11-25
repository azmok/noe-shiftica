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

## AIのミスから学ぶループ（ローカル・クラウド共通）
記録は非公開リポジトリ `azmok/noe-shiftica-ais-self-learning` に置く。このリポジトリは公開なので、失敗の記録や教訓を置かない。
- 作業を始める前に `node scripts/ai-learning.mjs sync` を実行し、表示された lessons に従う。失敗したら黙って進めず、あずまに伝える。
- ミスをしたら1件記録する。先に `node scripts/ai-learning.mjs classes` を見て、同じ種類なら同じ分類名を使う。
  `node scripts/ai-learning.mjs record --class <分類> --what "何が起きたか" --cause "原因" --fix "対策"`
- 秘密情報、個人情報、生のログは書かない。
- 同じ種類のミスが2回目なら、作業を一度止めてあずまに報告し、防ぐ仕組みを提案する。
  優先順位：①テストか lint ②hook ③スキル ④`lessons.md` への1行追記（機械で判定できない場合だけ）
- あずまが承認するまで、提案した仕組みは実装しない。①〜③を実装したら、学習リポジトリの `automated.md` に追記する。
- 資料の置き場所：公開してよいものは `docs/`、AI運用・バックアップ・弱点・引き継ぎなど公開しないものは学習リポジトリの `docs/`。
- 学習リポジトリで自動 commit / push してよいのは、クラウドでの `mistakes/` の追加だけ（作業ブランチ限定。あずま承認済み 2026-11-25）。
  `lessons.md` と `automated.md` の変更、main への取り込みは、あずまの承認が要る。

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
