import { describe, it, expect } from 'vitest'
import matter from 'gray-matter'
import { extractCustomMetaData, mergeCustomMetaData, revisedAtFromFrontmatter } from '@/plugins/markdownImport/frontmatter'

describe('extractCustomMetaData', () => {
  it('keeps only the keys without their own field', () => {
    expect(
      extractCustomMetaData({
        title: 't',
        slug: 's',
        description: 'd',
        date: '2026-03-10',
        updated: '2026-10-26',
        og_title: 'OG',
        seo_title: 'SEO',
      }),
    ).toEqual({ og_title: 'OG', seo_title: 'SEO' })
  })
})

describe('mergeCustomMetaData', () => {
  it('overwrites given keys, keeps the rest, and deletes null keys', () => {
    expect(
      mergeCustomMetaData(
        { og_title: 'old', canonical: 'slug', tags: ['a'], subtitle: 'stale' },
        { og_title: 'new', subtitle: null, seo_title: 'SEO' },
      ),
    ).toEqual({ og_title: 'new', canonical: 'slug', tags: ['a'], seo_title: 'SEO' })
  })

  it('starts from an empty object when there is no usable existing value', () => {
    expect(mergeCustomMetaData(null, { a: 1 })).toEqual({ a: 1 })
    expect(mergeCustomMetaData(['x'], { a: 1 })).toEqual({ a: 1 })
  })
})

describe('revisedAtFromFrontmatter', () => {
  it('reads quoted and unquoted YAML dates', () => {
    const quoted = matter('---\nupdated: "2026-10-26"\n---\n').data
    const bare = matter('---\nupdated: 2026-10-26\n---\n').data
    expect(revisedAtFromFrontmatter(quoted)).toBe('2026-10-26T00:00:00.000Z')
    expect(revisedAtFromFrontmatter(bare)).toBe('2026-10-26T00:00:00.000Z')
  })

  it('returns undefined when absent or unreadable, and null to clear', () => {
    expect(revisedAtFromFrontmatter({})).toBeUndefined()
    expect(revisedAtFromFrontmatter({ updated: 'not a date' })).toBeUndefined()
    expect(revisedAtFromFrontmatter({ updated: null })).toBeNull()
  })
})
