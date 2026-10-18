/**
 * Unit tests: scripts/publish-article.mjs (no network)
 *
 * The script only decides which image files to attach; everything else is done by
 * /api/ai/posts (see tests/unit/api/aiPosts.test.ts).
 */

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
