#!/usr/bin/env node
// AI のミスの学習ループ（Windows / クラウド共通、依存なし）。
// 記録は非公開リポジトリ azmok/noe-shiftica-ais-self-learning に置く。このリポジトリは公開なので記録を置かない。
//   node scripts/ai-learning.mjs sync
//   node scripts/ai-learning.mjs classes
//   node scripts/ai-learning.mjs record --class <slug> --what "..." --cause "..." --fix "..."
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = 'https://github.com/azmok/noe-shiftica-ais-self-learning.git'
const NAME = 'noe-shiftica-ais-self-learning'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const isCloud = process.env.CLAUDE_CODE_REMOTE === 'true'

const git = (cwd, ...args) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' },
  }).trim()
const tryGit = (...args) => {
  try {
    return git(...args)
  } catch {
    return null
  }
}
const fail = (message) => {
  console.error(`ai-learning: ${message}`)
  process.exit(1)
}
const reason = (error) => String(error.stderr || error.message).trim()

function dataDir() {
  if (process.env.AI_LEARNING_DIR) {
    const dir = path.resolve(process.env.AI_LEARNING_DIR)
    if (!existsSync(path.join(dir, '.git'))) fail(`AI_LEARNING_DIR が git リポジトリではない: ${dir}`)
    return dir
  }
  // worktree から呼ばれても、本体リポジトリの隣を見る
  const common = tryGit(root, 'rev-parse', '--path-format=absolute', '--git-common-dir')
  const candidates = [path.join(root, '..', NAME), path.join(root, '.ai')]
  if (common) candidates.unshift(path.join(path.dirname(common), '..', NAME))
  const found = candidates.find((dir) => existsSync(path.join(dir, '.git')))
  if (found) return path.resolve(found)
  const target = path.join(root, '.ai')
  try {
    git(root, 'clone', REPO, target)
  } catch (error) {
    fail(`学習リポジトリを取得できない。クラウドならセッションに ${NAME} を追加する。\n${reason(error)}`)
  }
  return target
}

const fetchAll = (dir) => tryGit(dir, 'fetch', '--prune', 'origin') !== null

// 1ミス1ファイル: <日付>__<分類>__<ID>.md
const parse = (file) => path.posix.basename(file).match(/^\d{4}-\d{2}-\d{2}__([a-z0-9-]+)__[0-9a-f]+\.md$/)?.[1]

function records(dir) {
  const files = new Set()
  const refs = tryGit(dir, 'for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes/origin') || ''
  for (const ref of refs.split('\n').filter((r) => r && !r.endsWith('/HEAD'))) {
    const tree = tryGit(dir, 'ls-tree', '-r', '--name-only', ref, '--', 'mistakes') || ''
    for (const file of tree.split('\n')) if (parse(file)) files.add(path.posix.basename(file))
  }
  const local = path.join(dir, 'mistakes')
  if (existsSync(local)) for (const file of readdirSync(local)) if (parse(file)) files.add(file)
  return [...files]
}

function options(args) {
  const out = {}
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '')
    if (!args[i]?.startsWith('--') || !['class', 'what', 'cause', 'fix'].includes(key)) fail(`不明な引数: ${args[i]}`)
    const value = (args[i + 1] ?? '').replace(/\s+/g, ' ').trim()
    if (!value || value.startsWith('--')) fail(`--${key} が空`)
    out[key] = value
  }
  for (const key of ['class', 'what', 'cause', 'fix']) if (!out[key]) fail(`--${key} が必要`)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(out.class)) fail('--class は英小文字・数字・ハイフンだけ')
  return out
}

function sync() {
  const dir = dataDir()
  const fetched = fetchAll(dir)
  const pulled = fetched && tryGit(dir, 'rev-parse', '--verify', 'origin/main') !== null && tryGit(dir, 'merge', '--ff-only', 'origin/main') !== null
  console.log(`学習リポジトリ: ${dir}`)
  if (!fetched) console.log('警告: 最新を取得できない。手元の内容を表示する。')
  else if (!pulled) console.log('警告: origin/main を取り込めていない（未作成、または手元と分岐）。')
  const lessons = path.join(dir, 'lessons.md')
  console.log(existsSync(lessons) ? readFileSync(lessons, 'utf8') : 'lessons.md はまだない。')
}

function classes() {
  const dir = dataDir()
  if (!fetchAll(dir)) console.log('警告: 最新を取得できない。件数は手元分だけ。')
  const counts = {}
  for (const file of records(dir)) counts[parse(file)] = (counts[parse(file)] || 0) + 1
  const rows = Object.entries(counts).sort()
  console.log(rows.length ? rows.map(([name, n]) => `${name}: ${n}`).join('\n') : '記録はまだない。')
}

function record(args) {
  const o = options(args)
  const dir = dataDir()
  const fetched = fetchAll(dir)
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date())
  const id = randomBytes(4).toString('hex')
  const file = `mistakes/${date}__${o.class}__${id}.md`
  if (isCloud) {
    const branch = tryGit(dir, 'symbolic-ref', '--short', 'HEAD') || ''
    if (!branch.startsWith('claude/')) {
      try {
        git(dir, 'checkout', '-b', `claude/mistakes-${id}`)
      } catch (error) {
        fail(`作業ブランチを作れない。\n${reason(error)}`)
      }
    }
  }
  mkdirSync(path.join(dir, 'mistakes'), { recursive: true })
  writeFileSync(
    path.join(dir, file),
    `# ${o.what}\n\n- 日付: ${date}\n- 環境: ${isCloud ? 'cloud' : 'local'}\n- 分類: ${o.class}\n- 原因: ${o.cause}\n- 対策: ${o.fix}\n`,
    'utf8',
  )
  const count = records(dir).filter((f) => parse(f) === o.class).length
  console.log(`記録: ${file}\n「${o.class}」は ${count} 回目`)
  if (!fetched) console.log('警告: 最新を取得できず、回数は未確定。')
  if (count >= 2) console.log('作業を止めて報告し、仕組みを提案する。順番: テスト・lint → hook → スキル → lessons.md。承認まで実装しない。')
  try {
    git(dir, 'add', '--', file)
    if (isCloud) {
      // 自動 commit / push はクラウドの mistakes/ の1ファイルだけ（あずま承認済み 2026-11-25）
      git(dir, 'commit', '-m', `mistake: ${o.class}`, '--', file)
      git(dir, 'push', '-u', 'origin', 'HEAD')
      console.log('作業ブランチに push した。')
    } else console.log('ステージした。commit と push はあずまの指示を待つ。')
  } catch (error) {
    fail(`記録ファイルは残っているが、git の処理に失敗した: ${path.join(dir, file)}\n${reason(error)}`)
  }
}

const [command, ...rest] = process.argv.slice(2)
if (command === 'sync' && !rest.length) sync()
else if (command === 'classes' && !rest.length) classes()
else if (command === 'record') record(rest)
else fail('使い方: sync | classes | record --class <slug> --what "..." --cause "..." --fix "..."')
