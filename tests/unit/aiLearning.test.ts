import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const script = (name: string) => path.resolve('scripts', name)

describe('claude-shell-guard', () => {
  const run = (input: string) =>
    spawnSync('node', [script('claude-shell-guard.mjs')], { input, encoding: 'utf8' }).status
  const bash = (command: string) => run(JSON.stringify({ tool_name: 'Bash', tool_input: { command } }))

  it.each([
    "sed -i 's#x#C:\\Users\\a#' f.md",
    "sed -E -i.bak 's/a\\.b/c/' f",
    "sed --in-place 's/a\\.b/c/' f",
    "cat > a.html <<'EOF'\n<p>\nEOF",
    "tee docs/a.html <<EOF\n<p>\nEOF",
  ])('blocks %j', (command) => expect(bash(command)).toBe(2))

  it.each([
    "sed -i 's/a/b/' f.md",
    "sed -n 's/a\\.b/c/p' f",
    "sed -i 's/a/b/' \\\n f.md",
    "cat > a.md <<'EOF'\nx\nEOF",
    'cat a.html',
    '',
    '\n',
  ])('allows %j', (command) => expect(bash(command)).toBe(0))

  it('does not block on unreadable input', () => {
    expect(run('')).toBe(0)
    expect(run('{')).toBe(0)
    expect(run('null')).toBe(0)
  })
})

describe('ai-learning record', () => {
  let dir = ''
  beforeEach(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'ai-learning-'))
    execFileSync('git', ['init', '-q'], { cwd: dir })
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  const record = (what: string) =>
    spawnSync(
      'node',
      [script('ai-learning.mjs'), 'record', '--class', 'demo', '--what', what, '--cause', 'c', '--fix', 'f'],
      { encoding: 'utf8', env: { ...process.env, AI_LEARNING_DIR: dir, CLAUDE_CODE_REMOTE: '' } },
    )

  it('asks to stop only from the second mistake of the same class', () => {
    expect(record('a').stdout).not.toContain('作業を止めて報告')
    const second = record('b')
    expect(second.status).toBe(0)
    expect(second.stdout).toContain('「demo」は 2 回目')
    expect(second.stdout).toContain('作業を止めて報告')
  }, 30_000)

  it('rejects empty input', () => {
    expect(record('\n').status).toBe(1)
  }, 30_000)
})
