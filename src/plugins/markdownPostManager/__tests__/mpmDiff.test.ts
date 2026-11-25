import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// public/mpm-app/diff.js はブラウザ用（window.NoeDiff）。globalThis に載せて読む
const g = globalThis as any
new Function(readFileSync(resolve(__dirname, '../../../../public/mpm-app/diff.js'), 'utf8'))()
const D = g.NoeDiff as {
  lines: (a: string, b: string) => { op: string; a: number | null; b: number | null; text: string }[]
  chars: (a: string, b: string) => { op: string; text: string }[]
  hunks: (rows: any[], ctx: number) => any[]
  stats: (rows: any[]) => { added: number; removed: number }
}

const rebuild = (rows: { op: string; text: string }[], side: 'a' | 'b') =>
  rows.filter((r) => r.op === ' ' || r.op === (side === 'a' ? '-' : '+')).map((r) => r.text).join('\n')

describe('mpm-app diff.js', () => {
  it('line diff reproduces both sides and numbers lines', () => {
    const a = '# 見出し\n本文1\n本文2\n本文3\n終わり'
    const b = '# 見出し\n本文1\n本文2 改\n本文3\n追加の行\n終わり'
    const rows = D.lines(a, b)
    expect(rebuild(rows, 'a')).toBe(a)
    expect(rebuild(rows, 'b')).toBe(b)
    expect(D.stats(rows)).toEqual({ added: 2, removed: 1 })
    const add = rows.find((r) => r.text === '追加の行')!
    expect(add).toMatchObject({ op: '+', a: null, b: 5 })
  })

  it('handles empty / missing sides and CRLF', () => {
    expect(D.stats(D.lines('', 'a\nb'))).toEqual({ added: 2, removed: 0 })
    expect(D.stats(D.lines('a\r\nb\r\n', 'a\nb\n'))).toEqual({ added: 0, removed: 0 })
    expect(D.lines(null as any, 'x')).toEqual([{ op: '+', a: null, b: 1, text: 'x' }])
  })

  it('random edits always round-trip with a minimal-ish script', () => {
    let seed = 7
    const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed % n)
    for (let t = 0; t < 200; t++) {
      const base = Array.from({ length: rnd(30) }, () => 'L' + rnd(8))
      const next = base.filter(() => rnd(5) > 0)
      for (let k = rnd(5); k > 0; k--) next.splice(rnd(next.length + 1), 0, 'N' + rnd(8))
      const rows = D.lines(base.join('\n'), next.join('\n'))
      expect(rebuild(rows, 'a')).toBe(base.join('\n'))
      expect(rebuild(rows, 'b')).toBe(next.join('\n'))
      const s = D.stats(rows)
      expect(s.added + s.removed).toBeLessThanOrEqual(base.length + next.length)
    }
  })

  it('char diff marks only the changed part of a line', () => {
    const parts = D.chars('Claude Codeの標準機能だけで組む', 'Claude Codeの標準機能で組む')
    expect(parts.filter((p) => p.op === '-').map((p) => p.text).join('')).toBe('だけ')
    expect(parts.filter((p) => p.op === '+')).toEqual([])
  })

  it('hunks keep context around changes and count skipped lines', () => {
    const a = Array.from({ length: 20 }, (_, i) => 'x' + i).join('\n')
    const b = a.replace('x10', 'y10')
    const hs = D.hunks(D.lines(a, b), 2)
    expect(hs).toHaveLength(1)
    expect(hs[0].skippedBefore).toBe(8)
    expect(hs[0].rows.map((r: any) => r.op).join('')).toBe('  -+  ')
    expect((hs as any).skippedAfter).toBe(7)
  })
})
