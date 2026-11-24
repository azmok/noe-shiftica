import { describe, it, expect } from 'vitest'
import { resolveCanonical } from '@/lib/canonical'

describe('resolveCanonical', () => {
  const own = '/dev/obsidian-is-not-a-second-brain-degraded-rdb-truth'

  it('defaults to the post\'s own path', () => {
    expect(resolveCanonical(undefined, own)).toBe(own)
    expect(resolveCanonical('', own)).toBe(own)
    expect(resolveCanonical('   ', own)).toBe(own)
  })

  it('ignores overrides that point elsewhere on this site', () => {
    expect(resolveCanonical('https://noe-shiftica.com/obsidian-not-second-brain-degraded-rdb', own)).toBe(own)
    expect(resolveCanonical('https://www.noe-shiftica.com/dev/other', own)).toBe(own)
    expect(resolveCanonical('/obsidian-not-second-brain-degraded-rdb', own)).toBe(own)
    expect(resolveCanonical('obsidian-not-second-brain-degraded-rdb', own)).toBe(own)
  })

  it('keeps an external original for cross-posts', () => {
    expect(resolveCanonical(' https://zenn.dev/azuma/articles/x ', own)).toBe('https://zenn.dev/azuma/articles/x')
  })
})
