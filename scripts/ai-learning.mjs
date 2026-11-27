#!/usr/bin/env node
// AI 共通の脳（azmok/ai-brains）の入口。Windows / クラウド共通、依存なし。
// 設計は ai-brains の README.md と common/rules.md。
//   node scripts/ai-learning.mjs sync      … 無ければクローン、あれば最新にして、教訓と引き継ぎを表示（SessionStart フック）
//   node scripts/ai-learning.mjs push      … handoff/・memory/・mistakes/ の変更を main に反映（Stop フック）
//   node scripts/ai-learning.mjs classes   … ミスの分類ごとの件数
//   node scripts/ai-learning.mjs record --class <slug> [--scope <範囲>] --what "..." --cause "..." --fix "..."
//   node scripts/ai-learning.mjs report <報告.oui> [--open など]  … あずまへの報告を HTML にする（ai-brains の tools/report）
import { execFileSync, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = process.env.AI_BRAINS_REPO || 'https://github.com/azmok/ai-brains.git'
const NAME = 'ai-brains'
const LEGACY = 'noe-shiftica-ais-self-learning' // 2026-11-26 に ai-brains へ改名
const root = path.resolve(process.env.AI_BRAINS_PROJECT_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'))
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
  console.error(`ai-brains: ${message}`)
  process.exit(1)
}
const reason = (error) => String(error.stderr || error.message).trim()

// プロジェクト名：origin の URL のリポジトリ名（worktree でも同じになる）。取れなければフォルダ名
function projectName() {
  if (process.env.AI_BRAINS_PROJECT) return process.env.AI_BRAINS_PROJECT
  const url = tryGit(root, 'remote', 'get-url', 'origin') || ''
  const fromUrl = url.replace(/\.git$/, '').split(/[/:]/).pop()
  return (fromUrl || path.basename(root)).toLowerCase()
}

// 本体リポジトリのルート（worktree でも本体を返す）
function baseDir() {
  const common = tryGit(root, 'rev-parse', '--path-format=absolute', '--git-common-dir')
  return common ? path.dirname(common) : root
}

// 正規の置き場所はプロジェクトの隣（../ai-brains）の1か所だけ
function defaultDir() {
  return path.resolve(baseDir(), '..', NAME)
}

// ai-brains の場所を探す。無ければ null
function findDir() {
  const given = process.env.AI_BRAINS_DIR || process.env.AI_LEARNING_DIR
  if (given) {
    const dir = path.resolve(given)
    if (!existsSync(path.join(dir, '.git'))) fail(`AI_BRAINS_DIR が git リポジトリではない: ${dir}`)
    return dir
  }
  const bases = [baseDir()]
  if (bases[0] !== root) bases.push(root)
  const candidates = []
  for (const base of bases) {
    candidates.push(path.join(base, '..', NAME), path.join(base, NAME), path.join(base, '..', LEGACY), path.join(base, '.ai'))
  }
  const found = candidates.find((dir) => existsSync(path.join(dir, '.git')))
  return found ? path.resolve(found) : null
}

// 正規の場所（../ai-brains）以外を使っているときは知らせる。
// CLAUDE.md は ../ai-brains だけを読むので、プロジェクトの中や改名前の場所だと共通ルールが読まれない。
function warnLegacy(dir) {
  if (process.env.AI_BRAINS_DIR || process.env.AI_LEARNING_DIR) return
  const expected = defaultDir()
  if (path.resolve(dir) === expected) return
  console.log(`警告: 正規の場所（${expected}）ではない場所（${dir}）を使っている。プロジェクトの隣に ai-brains として置き直す（git clone ${REPO} ${expected}）。`)
  const left = tryGit(dir, 'status', '--porcelain') || ''
  if (left) console.log(`警告: そこに push していない変更がある。消す前に中身を ai-brains へ移す:\n${left}`)
}

// 各 AI の全体の設定（~/.claude/CLAUDE.md など）に「ai-brains を先に読む」案内を入れる。手元の PC だけ（クラウドは使い捨て）
function linkGlobal(dir) {
  const script = path.join(dir, 'tools', 'setup', 'link-global.mjs')
  if (isCloud || !existsSync(script)) return
  const r = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 30_000 })
  if (r.stdout?.trim()) console.log(r.stdout.trim())
  if (r.status !== 0) console.log(`警告: 全体の設定に案内を入れられなかった。${(r.stderr || '').trim()}`)
}

// 無ければプロジェクトの隣（../ai-brains）にクローンする（手元の PC 向け。クラウドはセッションに入れる）
function dataDir() {
  const found = findDir()
  if (found) return found
  const target = defaultDir()
  try {
    git(path.dirname(target), 'clone', REPO, target)
  } catch (error) {
    fail(
      `ai-brains を取得できない。${isCloud ? 'クラウドなら、セッションに azmok/ai-brains を追加する。' : 'GitHub にログインできているか確認する。'}\n${reason(error)}`,
    )
  }
  return target
}

const fetchMain = (dir) => tryGit(dir, 'fetch', 'origin', '+refs/heads/main:refs/remotes/origin/main') !== null
const branchOf = (dir) => tryGit(dir, 'symbolic-ref', '--short', 'HEAD') || ''
const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : null)

// projects/<名前>/README.md の「## 使っている技術」の箇条書き
function stacksOf(dir, project) {
  const readme = read(path.join(dir, 'projects', project, 'README.md')) || ''
  const section = readme.split(/^## /m).find((s) => s.startsWith('使っている技術'))
  if (!section) return []
  return [...section.matchAll(/^- ([a-z0-9-]+)\s*$/gm)].map((m) => m[1])
}

function sync() {
  const dir = dataDir()
  const project = projectName()
  const fetched = fetchMain(dir)
  const pulled = fetched && branchOf(dir) === 'main' && tryGit(dir, 'merge', '--ff-only', 'origin/main') !== null
  console.log(`ai-brains: ${dir}（プロジェクト: ${project}）`)
  if (!fetched) console.log('警告: 最新を取得できない。手元の内容を表示する。')
  else if (!pulled) console.log(`警告: origin/main を取り込めていない（今のブランチ: ${branchOf(dir) || '不明'}、または手元と分岐）。`)
  warnLegacy(dir)
  linkGlobal(dir)

  const show = (title, file) => {
    const text = read(file)
    if (text) console.log(`\n---- ${title}: ${file} ----\n${text}`)
    return text !== null
  }
  // 旧構成（ルートの lessons.md）にも対応
  if (!show('共通の教訓', path.join(dir, 'common', 'lessons.md'))) show('教訓', path.join(dir, 'lessons.md'))
  for (const stack of stacksOf(dir, project)) show(`${stack} の教訓`, path.join(dir, 'stacks', stack, 'lessons.md'))
  show(`${project} の教訓`, path.join(dir, 'projects', project, 'lessons.md'))

  const tasks = path.join(dir, 'projects', project, 'handoff', 'tasks.md')
  if (show('引き継ぎ', tasks)) {
    console.log('続けて decisions.md と log/ の最新月の末尾を読む。終わるときは log/ に追記し、tasks.md を直す（書き方は common/handoff.md）。')
  } else console.log(`\n引き継ぎ（projects/${project}/handoff/tasks.md）はまだない。`)
  if (existsSync(path.join(dir, 'tools', 'report', 'build.mjs'))) {
    console.log('報告：作業の区切りは HTML にして渡す。ひな形 tools/report/template.oui をコピーして書き、node scripts/ai-learning.mjs report <報告.oui>（決まりは common/reporting.md）。')
  }
}

// ---------------------------------------------------------------- report
// ai-brains の tools/report/build.mjs に任せる。ai-brains の場所（隣・中・クラウド）をここで吸収する
function report(args) {
  const dir = dataDir()
  const build = path.join(dir, 'tools', 'report', 'build.mjs')
  if (!existsSync(build)) fail(`ai-brains に報告の道具が無い（${build}）。sync で最新にする。`)
  const hasProject = args.includes('--project')
  const r = spawnSync(process.execPath, [build, ...args, ...(hasProject ? [] : ['--project', projectName()])], { stdio: 'inherit' })
  process.exit(r.status ?? 1)
}

// ---------------------------------------------------------------- push
// AI が直接 main に反映してよい場所（あずま承認 2026-11-26。memory/ も同日に追加）
const isFree = (file) => /^projects\/[^/]+\/(handoff|memory)\//.test(file) || /^mistakes\//.test(file)

function changedFiles(dir) {
  // 行頭の空白（" M" = 変更）に意味があるので、git() のように前後を削らずに読む
  let out = ''
  try {
    out = execFileSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60_000,
    })
  } catch {
    return []
  }
  const files = []
  const parts = out.split('\0').filter(Boolean)
  for (let i = 0; i < parts.length; i++) {
    const status = parts[i].slice(0, 2)
    files.push(parts[i].slice(3))
    if (status.startsWith('R') || status.startsWith('C')) i++ // 改名は元の名前が続く
  }
  return files
}

// handoff/・memory/・mistakes/ の変更だけを commit して main に push する。結果を文字列で返す（失敗は投げる）
function publish(dir, files, message) {
  if (!files.length) return null
  const branch = branchOf(dir)
  if (branch !== 'main') return `main 以外のブランチ（${branch || '不明'}）にいるので、自動では反映しない: ${files.join(', ')}`
  git(dir, 'add', '-A', '--', ...files)
  git(dir, 'commit', '-m', message, '--', ...files)
  for (let attempt = 1; ; attempt++) {
    // 承認待ちの変更（lessons など）が手元に残っていても取り込めるように autostash
    if (fetchMain(dir) && tryGit(dir, 'rebase', '--autostash', 'origin/main') === null) {
      tryGit(dir, 'rebase', '--abort')
      throw new Error('ほかのセッションの変更とぶつかった。commit は手元に残っている。中身を見て直してから push する')
    }
    try {
      git(dir, 'push', 'origin', 'HEAD:refs/heads/main')
      return `main に反映した: ${files.join(', ')}`
    } catch (error) {
      if (attempt >= 3) throw error // 同時に push されたら、取り込み直して最大3回
    }
  }
}

function push() {
  const dir = findDir()
  if (!dir) return // ai-brains が無ければ何もしない（返答のたびに動くので静かに）
  const files = changedFiles(dir)
  if (!files.length) return
  const free = files.filter(isFree)
  const others = files.filter((f) => !isFree(f))
  try {
    const result = publish(dir, free, `ai-brains: ${projectName()} の引き継ぎ・記憶・ミスの記録（自動）`)
    if (result) console.log(`ai-brains: ${result}`)
  } catch (error) {
    fail(`main に反映できなかった。\n${reason(error)}`)
  }
  if (others.length) {
    console.log(`ai-brains: あずまの承認が要る変更が残っている（作業ブランチ → プルリクエスト）: ${others.join(', ')}`)
  }
}

// ---------------------------------------------------------------- mistakes
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

const KEYS = ['class', 'scope', 'what', 'cause', 'fix']
function options(args) {
  const out = {}
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '')
    if (!args[i]?.startsWith('--') || !KEYS.includes(key)) fail(`不明な引数: ${args[i]}`)
    const value = (args[i + 1] ?? '').replace(/\s+/g, ' ').trim()
    if (!value || value.startsWith('--')) fail(`--${key} が空`)
    out[key] = value
  }
  for (const key of ['class', 'what', 'cause', 'fix']) if (!out[key]) fail(`--${key} が必要`)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(out.class)) fail('--class は英小文字・数字・ハイフンだけ')
  if (out.scope && !/^(common|(stack|project)\/[a-z0-9]+(-[a-z0-9]+)*)$/.test(out.scope)) {
    fail('--scope は common / stack/<技術> / project/<名前>（英小文字・数字・ハイフン）')
  }
  return out
}

function classes() {
  const dir = dataDir()
  if (!fetchMain(dir)) console.log('警告: 最新を取得できない。件数は手元分だけ。')
  const counts = {}
  for (const file of records(dir)) counts[parse(file)] = (counts[parse(file)] || 0) + 1
  const rows = Object.entries(counts).sort()
  console.log(rows.length ? rows.map(([name, n]) => `${name}: ${n}`).join('\n') : '記録はまだない。')
}

function record(args) {
  const o = options(args)
  const dir = dataDir()
  const project = projectName()
  const scope = o.scope || `project/${project}`
  const fetched = fetchMain(dir)
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date())
  const id = randomBytes(4).toString('hex')
  const file = `mistakes/${date}__${o.class}__${id}.md`
  mkdirSync(path.join(dir, 'mistakes'), { recursive: true })
  writeFileSync(
    path.join(dir, file),
    `# ${o.what}\n\n- 日付: ${date}\n- 環境: ${isCloud ? 'cloud' : 'local'}\n- 分類: ${o.class}\n- 範囲: ${scope}\n- プロジェクト: ${project}\n- 原因: ${o.cause}\n- 対策: ${o.fix}\n`,
    'utf8',
  )
  const count = records(dir).filter((f) => parse(f) === o.class).length
  console.log(`記録: ${file}（範囲: ${scope}）\n「${o.class}」は ${count} 回目`)
  if (!fetched) console.log('警告: 最新を取得できず、回数は未確定。')
  if (count >= 2) console.log('作業を止めて報告し、仕組みを提案する。順番: テスト・lint → hook → スキル → lessons.md。承認まで実装しない。')
  try {
    const result = publish(dir, [file], `mistake: ${o.class}`)
    if (result) console.log(result)
  } catch (error) {
    console.log(`警告: 記録ファイルは残っているが、main に反映できなかった（あとで push で再試行）: ${path.join(dir, file)}\n${reason(error)}`)
  }
}

const [command, ...rest] = process.argv.slice(2)
if (command === 'sync' && !rest.length) sync()
else if (command === 'push' && !rest.length) push()
else if (command === 'classes' && !rest.length) classes()
else if (command === 'record') record(rest)
else if (command === 'report' && rest.length) report(rest)
else fail('使い方: sync | push | classes | record --class <slug> [--scope <範囲>] --what "..." --cause "..." --fix "..." | report <報告.oui> [--open]')
