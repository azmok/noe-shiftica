/**
 * Unit tests: scripts/publish-article.mjs (no network)
 *
 * The script only decides which image files to attach; everything else is done by
 * /api/ai/posts (see src/plugins/ai-api/__tests__/unit.test.ts).
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { referencedImages } from '../../scripts/publish-article.mjs'

describe('referencedImages', () => {
  it('lists standalone image references once, decoded and without ./', () => {
    const md = [
      '![01_a](./01_a.png)',
      'text ![inline](./inline.png) is not standalone',
      '![](02_b.gif)',
      '![again](./01_a.png)',
      '![enc](./%E7%94%BB%E5%83%8F.png)',
    ].join('\n\n')
    expect(referencedImages(md)).toEqual(['01_a.png', '02_b.gif', '画像.png'])
  })

  it('ignores images inside fenced code', () => {
    const md = '```\n![x](./in-fence.png)\n```\n\n![y](./outside.png)'
    expect(referencedImages(md)).toEqual(['outside.png'])
  })
})

it('sends the MPM hero image even when the Markdown body does not reference it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mpm-publish-'))
  try {
    const article = join(dir, 'article.md')
    const hero = 'mpm-hero-98f1234d.webp'
    writeFileSync(article, '---\r\ntitle: Test\r\nhero: ./' + hero + '\r\n---\r\nBody')
    writeFileSync(join(dir, hero), 'fixture')
    const script = fileURLToPath(new URL('../../scripts/publish-article.mjs', import.meta.url))
    const stdout = execFileSync(process.execPath, [script, 'draft', article, '--render', 'markdown', '--dry-run'], { encoding: 'utf8' })
    const result = JSON.parse(stdout)
    expect(result.heroImage).toBe(hero)
    expect(result.images).toEqual([expect.stringContaining(hero)])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
