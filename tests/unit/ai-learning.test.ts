/**
 * Unit tests: scripts/ai-learning.mjs (no network)
 *
 * ai-brains（AI 共通の脳）の入口スクリプトの動きを固定する。
 * - record：同じ分類で2回目になったら作業を止めて報告する／範囲（scope）を書く／main に反映する
 * - sync：教訓と引き継ぎを表示する
 * - push：handoff/・memory/・mistakes/ だけを main に反映し、それ以外は残して知らせる
 * スクリプトは import しただけで動くため、サブプロセスとして呼ぶ。
 * ai-brains の代わりに、一時ディレクトリに作った本物の git リポジトリ（origin は手元の bare）を使う。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const SCRIPT = path.resolve(__dirname, '../../scripts/ai-learning.mjs')
const STOP_MESSAGE = '作業を止めて報告し'
const ENV = {
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
}

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, ...ENV } }).trim()

let tmp: string
let origin: string
let data: string

const write = (file: string, text: string) => {
  mkdirSync(path.dirname(path.join(data, file)), { recursive: true })
  writeFileSync(path.join(data, file), text, 'utf8')
}
const onMain = (file: string) => git(origin, 'ls-tree', '-r', '--name-only', 'main').split('\n').includes(file)

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'ai-brains-'))
  origin = path.join(tmp, 'origin.git')
  data = path.join(tmp, 'data')
  git(tmp, 'init', '--bare', '-b', 'main', origin)
  git(tmp, 'clone', origin, data)
  git(data, 'checkout', '-b', 'main')
  git(data, 'commit', '--allow-empty', '-m', 'init')
  git(data, 'push', '-u', 'origin', 'main')
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

function run(args: string[], env: Record<string, string> = { CLAUDE_CODE_REMOTE: 'true' }) {
  const result = spawnSync('node', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, AI_BRAINS_DIR: data, AI_BRAINS_PROJECT: 'demo', ...ENV, ...env },
  })
  return { status: result.status, out: result.stdout, err: result.stderr }
}

const record = (cls: string, extra: string[] = [], env?: Record<string, string>) =>
  run(['record', '--class', cls, ...extra, '--what', 'テスト', '--cause', 'テスト', '--fix', 'テスト'], env)

describe('ai-learning record', () => {
  it('1回目は回数だけ出して、止める指示は出さない', () => {
    const first = record('same-kind')
    expect(first.status).toBe(0)
    expect(first.out).toContain('「same-kind」は 1 回目')
    expect(first.out).not.toContain(STOP_MESSAGE)
  })

  it('同じ分類の2回目で「作業を止めて報告する」指示を出す', () => {
    record('same-kind')
    const second = record('same-kind')
    expect(second.status).toBe(0)
    expect(second.out).toContain('「same-kind」は 2 回目')
    expect(second.out).toContain(STOP_MESSAGE)
    expect(second.out).toContain('テスト・lint → hook → スキル → lessons.md')
  })

  it('分類が違えば別々に数える（2回目にならない）', () => {
    record('kind-a')
    const other = record('kind-b')
    expect(other.out).toContain('「kind-b」は 1 回目')
    expect(other.out).not.toContain(STOP_MESSAGE)
  })

  it('範囲を省略すると project/<今のプロジェクト>、指定すればそれを書く', () => {
    record('kind-a')
    record('kind-b', ['--scope', 'stack/payload'])
    const texts = readdirSync(path.join(data, 'mistakes')).map((f) => readFileSync(path.join(data, 'mistakes', f), 'utf8'))
    expect(texts.some((t) => t.includes('- 範囲: project/demo'))).toBe(true)
    expect(texts.some((t) => t.includes('- 範囲: stack/payload'))).toBe(true)
    expect(texts.every((t) => t.includes('- プロジェクト: demo'))).toBe(true)
  })

  it('記録は main に commit して push する（クラウドでも手元でも）', () => {
    for (const env of [{ CLAUDE_CODE_REMOTE: 'true' }, { CLAUDE_CODE_REMOTE: 'false' }]) {
      const result = record('push-check', [], env)
      expect(result.out).toContain('main に反映した')
    }
    const files = readdirSync(path.join(data, 'mistakes'))
    expect(files).toHaveLength(2)
    for (const f of files) expect(onMain(`mistakes/${f}`)).toBe(true)
  })

  it('分類や範囲が不正なら何も書かずに失敗する', () => {
    expect(record('Bad Class').status).toBe(1)
    expect(record('ok', ['--scope', 'stack/']).status).toBe(1)
    expect(record('ok', ['--scope', 'everywhere']).status).toBe(1)
    expect(existsSync(path.join(data, 'mistakes'))).toBe(false)
  })
})

describe('ai-learning sync', () => {
  it('共通・技術・プロジェクトの教訓と、引き継ぎの tasks.md を表示する', () => {
    write('common/lessons.md', '共通の教訓X\n')
    write('stacks/payload/lessons.md', 'Payloadの教訓Y\n')
    write('stacks/python/lessons.md', 'Pythonの教訓Z\n')
    write('projects/demo/README.md', '# demo\n\n## 使っている技術\n\n- payload\n')
    write('projects/demo/lessons.md', 'demoの教訓W\n')
    write('projects/demo/handoff/tasks.md', '# タスク\n\n- [ ] 次にやること\n')
    const result = run(['sync'])
    expect(result.status).toBe(0)
    for (const text of ['共通の教訓X', 'Payloadの教訓Y', 'demoの教訓W', '- [ ] 次にやること', 'decisions.md']) {
      expect(result.out).toContain(text)
    }
    expect(result.out).not.toContain('Pythonの教訓Z') // 使っていない技術は出さない
  })

  it('tasks.md が無くても失敗せず、無いことを伝える', () => {
    const result = run(['sync'])
    expect(result.status).toBe(0)
    expect(result.out).toContain('projects/demo/handoff/tasks.md）はまだない')
  })
})

describe('ai-learning push', () => {
  it('変更が無ければ何も出さない', () => {
    const result = run(['push'])
    expect(result.status).toBe(0)
    expect(result.out).toBe('')
  })

  it('handoff/・memory/ と mistakes/ は main に反映し、それ以外は残して知らせる', () => {
    write('projects/demo/handoff/log/2026-11.md', '### やったこと\n')
    write('projects/demo/memory/mirror/signs.md', '# Signs\n')
    write('projects/demo/rules/rules.md', '承認待ちのルール\n')
    write('common/lessons.md', '承認待ちの教訓\n')
    const result = run(['push'])
    expect(result.status).toBe(0)
    expect(result.out).toContain('projects/demo/handoff/log/2026-11.md')
    expect(result.out).toContain('projects/demo/memory/mirror/signs.md')
    expect(result.out).toContain('あずまの承認が要る変更が残っている')
    expect(onMain('projects/demo/handoff/log/2026-11.md')).toBe(true)
    expect(onMain('projects/demo/memory/mirror/signs.md')).toBe(true)
    expect(onMain('projects/demo/rules/rules.md')).toBe(false)
    expect(onMain('common/lessons.md')).toBe(false)
    expect(readFileSync(path.join(data, 'common/lessons.md'), 'utf8')).toBe('承認待ちの教訓\n') // 手元からは消さない
  })

  it('すでにあるファイルの書き換え（新規ではない）も、名前を欠かさずに反映する', () => {
    write('projects/demo/handoff/tasks.md', '- [ ] a\n')
    run(['push'])
    write('projects/demo/handoff/tasks.md', '- [x] a\n')
    const result = run(['push'])
    expect(result.status).toBe(0)
    expect(result.out).toContain('main に反映した: projects/demo/handoff/tasks.md')
    expect(git(origin, 'show', 'main:projects/demo/handoff/tasks.md')).toBe('- [x] a')
  })

  it('ほかのセッションが先に push していても、取り込んでから反映する', () => {
    const other = path.join(tmp, 'other')
    git(tmp, 'clone', origin, other)
    writeFileSync(path.join(other, 'from-other.md'), 'x', 'utf8')
    git(other, 'add', '.')
    git(other, 'commit', '-m', 'other')
    git(other, 'push', 'origin', 'main')

    write('projects/demo/handoff/tasks.md', '- [ ] a\n')
    const result = run(['push'])
    expect(result.status).toBe(0)
    expect(onMain('from-other.md')).toBe(true)
    expect(onMain('projects/demo/handoff/tasks.md')).toBe(true)
  })

  it('main 以外のブランチでは自動で反映しない', () => {
    git(data, 'checkout', '-b', 'feature')
    write('projects/demo/handoff/tasks.md', '- [ ] a\n')
    const result = run(['push'])
    expect(result.status).toBe(0)
    expect(result.out).toContain('main 以外のブランチ（feature）')
    expect(onMain('projects/demo/handoff/tasks.md')).toBe(false)
  })
})

describe('ai-learning push（同時に書いたとき）', () => {
  it('log は .gitattributes の union で、ほかのセッションの追記と両方残る', () => {
    write('.gitattributes', 'projects/*/handoff/log/*.md merge=union\n')
    write('projects/demo/handoff/log/2026-11.md', '# log\n')
    git(data, 'add', '.')
    git(data, 'commit', '-m', 'base')
    git(data, 'push', 'origin', 'main')

    const other = path.join(tmp, 'other')
    git(tmp, 'clone', origin, other)
    writeFileSync(path.join(other, 'projects/demo/handoff/log/2026-11.md'), '# log\n- ほかのセッション\n', 'utf8')
    git(other, 'commit', '-am', 'other')
    git(other, 'push', 'origin', 'main')

    write('projects/demo/handoff/log/2026-11.md', '# log\n- このセッション\n')
    const result = run(['push'])
    expect(result.status).toBe(0)
    const merged = git(origin, 'show', 'main:projects/demo/handoff/log/2026-11.md')
    expect(merged).toContain('- ほかのセッション')
    expect(merged).toContain('- このセッション')
  })
})

describe('ai-learning report と sync の案内', () => {
  // ai-brains の tools の代わりに、受け取った引数を出すだけの小さなスクリプトを置く
  const stub = (file: string) => write(file, 'console.log("STUB " + process.argv.slice(2).join(" "))\n')

  it('report は ai-brains の tools/report/build.mjs に、プロジェクト名を付けて渡す', () => {
    stub('tools/report/build.mjs')
    const result = run(['report', 'a.oui', '--open'])
    expect(result.status).toBe(0)
    expect(result.out).toContain('STUB a.oui --open --project demo')
  })

  it('report の道具が無ければ、sync で最新にするよう伝えて止まる', () => {
    const result = run(['report', 'a.oui'])
    expect(result.status).toBe(1)
    expect(result.err).toContain('sync で最新にする')
  })

  it('sync は報告の決まりを案内し、全体の設定への案内は手元の PC でだけ入れる', () => {
    stub('tools/report/build.mjs')
    stub('tools/setup/link-global.mjs')
    const cloud = run(['sync'])
    expect(cloud.out).toContain('common/reporting.md')
    expect(cloud.out).not.toContain('STUB')
    const local = run(['sync'], { CLAUDE_CODE_REMOTE: 'false' })
    expect(local.out).toContain('STUB')
  })
})

describe('ai-learning classes', () => {
  it('記録が無いときは「記録はまだない。」', () => {
    expect(run(['classes']).out).toContain('記録はまだない。')
  })

  it('分類ごとの件数を出す', () => {
    record('kind-a')
    record('kind-a')
    record('kind-b')
    const out = run(['classes']).out
    expect(out).toContain('kind-a: 2')
    expect(out).toContain('kind-b: 1')
  })
})

describe('ai-learning 置き場所（プロジェクトの隣のみ）', () => {
  it('ai-brains が無ければプロジェクトの隣（../ai-brains）にクローンする', () => {
    const ws = path.join(tmp, 'ws')
    const proj = path.join(ws, 'my-proj')
    mkdirSync(proj, { recursive: true })
    git(proj, 'init', '-b', 'main')
    const result = spawnSync('node', [SCRIPT, 'sync'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        AI_BRAINS_DIR: '',
        AI_LEARNING_DIR: '',
        AI_BRAINS_PROJECT: 'demo',
        AI_BRAINS_PROJECT_ROOT: proj,
        AI_BRAINS_REPO: origin,
        CLAUDE_CODE_REMOTE: 'true',
        ...ENV,
      },
    })
    expect(result.status).toBe(0)
    expect(existsSync(path.join(ws, 'ai-brains', '.git'))).toBe(true)
    expect(existsSync(path.join(proj, 'ai-brains'))).toBe(false)
  })

  it('ai-brains が取得できなければエラーで止まる', () => {
    const ws = path.join(tmp, 'ws-fail')
    const proj = path.join(ws, 'my-proj')
    mkdirSync(proj, { recursive: true })
    git(proj, 'init', '-b', 'main')
    const result = spawnSync('node', [SCRIPT, 'sync'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        AI_BRAINS_DIR: '',
        AI_LEARNING_DIR: '',
        AI_BRAINS_PROJECT: 'demo',
        AI_BRAINS_PROJECT_ROOT: proj,
        AI_BRAINS_REPO: path.join(tmp, 'missing-repo.git'),
        CLAUDE_CODE_REMOTE: 'true',
        ...ENV,
      },
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('ai-brains を取得できない')
  })
})
