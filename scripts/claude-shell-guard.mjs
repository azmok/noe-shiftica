#!/usr/bin/env node
// Claude Code の PreToolUse hook。分類 shell-quoting のミス（2回目）を受けて追加（あずま承認 2026-11-25）。
// 引用符やバックスラッシュで壊れやすい書き方を実行前に止め、Edit / Write ツールへ誘導する。
import { readFileSync } from 'node:fs'

let command = ''
try {
  command = JSON.parse(readFileSync(0, 'utf8'))?.tool_input?.command ?? ''
} catch {
  process.exit(0) // 入力を読めないときは作業を止めない
}
if (typeof command !== 'string') process.exit(0)

const text = command.replace(/\\\r?\n/g, ' ') // 行末の継続は対象外
const block = (message) => {
  console.error(`shell-guard: ${message}`)
  process.exit(2)
}

if (/\bsed\b[^\n|&]*?\s(?:-[a-zA-Z]*i|--in-place)[^\n]*\\/.test(text))
  block('sed -i とバックスラッシュの組み合わせは文字列を壊しやすい。Edit ツールを使う。')

if (/<<-?\s*['"]?\w+/.test(text) && /(?:>|\btee\b(?:\s+-a)?)\s*["']?[^\s"'<>|;&]*\.html?\b/.test(text))
  block('heredoc で HTML を作ると引用符で壊れやすい。Write ツールを使う。')
