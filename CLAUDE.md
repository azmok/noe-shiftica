# CLAUDE.md — Noe Shiftica (project rules for Claude Code / Kura-yan)

> Agent identity and the universal workflow (Startup Protocol / HARD STOP /
> Coder–Tester loop / Self-Check) live in global config (`~/.claude/CLAUDE.md`,
> `~/.gemini/AGENTS.md`) and project `AGENTS.md`. This file holds only Azuma's
> standing shortcuts that override those defaults.

## Standing instructions (Azuma)
- バックグラウンドコマンド（App Hosting のロールアウト、長時間ビルド等）の**出力ファイルは確認しなくてよい**。完了通知 / exit code 0 だけで十分とみなす。
- 作業の区切りは「**エディット → コミット → プッシュ**」まで。デプロイ後の本番反映確認・ロールアウトの追跡は待たなくてよい（Azuma が確認する）。
