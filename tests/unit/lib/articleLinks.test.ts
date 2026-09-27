import { describe, it, expect } from 'vitest'
import { toInternalHref } from '@/lib/articleLinks'

describe('toInternalHref', () => {
  it('turns absolute links to this site into root-relative paths', () => {
    expect(toInternalHref('https://noe-shiftica.com/blog/todd-rose')).toBe('/blog/todd-rose')
    expect(toInternalHref('https://www.noe-shiftica.com/blog/a?x=1#見出し')).toBe('/blog/a?x=1#%E8%A6%8B%E5%87%BA%E3%81%97')
    expect(toInternalHref('HTTP://Noe-Shiftica.com/dev/b')).toBe('/dev/b')
  })

  it('keeps root-relative paths', () => {
    expect(toInternalHref('/blog/todd-rose')).toBe('/blog/todd-rose')
  })

  it('leaves external, protocol-relative, in-page and non-http links alone', () => {
    expect(toInternalHref('https://example.com/blog/a')).toBeNull()
    expect(toInternalHref('https://noe-shiftica.com.evil.example/a')).toBeNull()
    expect(toInternalHref('//noe-shiftica.com/blog/a')).toBeNull()
    expect(toInternalHref('#section')).toBeNull()
    expect(toInternalHref('mailto:info@noe-shiftica.com')).toBeNull()
    expect(toInternalHref('')).toBeNull()
    expect(toInternalHref(undefined)).toBeNull()
  })
})
