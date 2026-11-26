/**
 * Unit tests: scripts/ai-learning.mjs (no network)
 *
 * 学習ループの「同じ分類で2回目になったら作業を止めて報告する」動きを固定する。
 * スクリプトは import しただけで動くため、サブプロセスとして呼ぶ。
 * 学習リポジトリの代わりに、一時ディレクトリに作った本物の git リポジトリ（origin は手元の bare）を使う。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const SCRIPT = path.resolve(__dirname, '../../scripts/ai-learning.mjs')
const STOP_MESSAGE = '作業を止めて報告し'

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
    },
  }).trim()

let tmp: string
let origin: string
let data: string

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'ai-learning-'))
  origin = path.join(tmp, 'origin.git')
  data = path.join(tmp, 'data')
  git(tmp, 'init', '--bare', '-b', 'main', origin)
  git(tmp, 'clone', origin, data)
  git(data, 'checkout', '-b', 'claude/test')
  git(data, 'commit', '--allow-empty', '-m', 'init')
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

function run(args: string[], env: Record<string, string> = { CLAUDE_CODE_REMOTE: 'true' }) {
  const result = spawnSync('node', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      AI_LEARNING_DIR: data,
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
      ...env,
    },
  })
  return { status: result.status, out: result.stdout, err: result.stderr }
}

const record = (cls: string, env?: Record<string, string>) =>
  run(['record', '--class', cls, '--what', 'テスト', '--cause', 'テスト', '--fix', 'テスト'], env)

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

  it('クラウドでは mistakes/ の1ファイルを commit して作業ブランチに push する', () => {
    const result = record('push-check')
    expect(result.out).toContain('作業ブランチに push した')
    const files = readdirSync(path.join(data, 'mistakes'))
    expect(files).toHaveLength(1)
    expect(git(origin, 'ls-tree', '-r', '--name-only', 'claude/test', '--', 'mistakes')).toContain(files[0])
  })

  it('クラウド以外ではステージだけして commit / push しない', () => {
    const result = record('local-check', { CLAUDE_CODE_REMOTE: 'false' })
    expect(result.out).toContain('ステージした')
    expect(git(data, 'log', '--oneline')).not.toContain('mistake:')
    expect(existsSync(path.join(origin, 'refs/heads/claude/test'))).toBe(false)
  })

  it('分類が不正（大文字・空白）なら何も書かずに失敗する', () => {
    const result = record('Bad Class')
    expect(result.status).toBe(1)
    expect(existsSync(path.join(data, 'mistakes'))).toBe(false)
  })
})

describe('ai-learning sync', () => {
  it('引き継ぎの tasks.md があれば、中身と次に読むものを表示する', () => {
    mkdirSync(path.join(data, 'docs', 'handoff'), { recursive: true })
    writeFileSync(path.join(data, 'docs', 'handoff', 'tasks.md'), '# タスク\n\n- [ ] 次にやること\n', 'utf8')
    const result = run(['sync'])
    expect(result.status).toBe(0)
    expect(result.out).toContain('- [ ] 次にやること')
    expect(result.out).toContain('decisions.md')
  })

  it('tasks.md が無くても失敗せず、無いことを伝える', () => {
    const result = run(['sync'])
    expect(result.status).toBe(0)
    expect(result.out).toContain('docs/handoff/tasks.md）はまだない')
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
