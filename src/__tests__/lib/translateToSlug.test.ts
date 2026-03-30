import { describe, it, expect, vi, afterEach } from 'vitest'
import { slugify, containsCJK, translateToSlug } from '@/lib/translateToSlug'

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('foo bar baz')).toBe('foo-bar-baz')
  })

  it('removes non-alphanumeric characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('foo---bar')).toBe('foo-bar')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello')
  })

  it('returns empty string for all-symbol input', () => {
    expect(slugify('!!!')).toBe('')
  })

  it('handles already-valid slugs unchanged', () => {
    expect(slugify('my-blog-post')).toBe('my-blog-post')
  })
})

describe('containsCJK', () => {
  it('returns true for Japanese hiragana', () => {
    expect(containsCJK('こんにちは')).toBe(true)
  })

  it('returns true for Japanese kanji', () => {
    expect(containsCJK('日本語')).toBe(true)
  })

  it('returns true for mixed Japanese/English', () => {
    expect(containsCJK('Hello 世界')).toBe(true)
  })

  it('returns false for pure ASCII', () => {
    expect(containsCJK('Hello World')).toBe(false)
  })

  it('returns false for numbers and symbols', () => {
    expect(containsCJK('123!@#')).toBe(false)
  })
})

describe('translateToSlug', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('slugifies ASCII title directly without fetching', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    const result = await translateToSlug('My Blog Post Title')
    expect(result).toBe('my-blog-post-title')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('calls Google Translate for CJK title and slugifies the result', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [[['anti aging tips', '老化防止のコツ', null]], null],
    } as Response)

    const result = await translateToSlug('老化防止のコツ')
    expect(result).toBe('anti-aging-tips')
  })

  it('falls back gracefully when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))
    // CJK chars are stripped, remaining ASCII is slugified
    const result = await translateToSlug('テスト')
    // All CJK stripped → empty after slugify → 'untitled'
    expect(result).toBe('untitled')
  })

  it('falls back when API returns non-ok status', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response)

    const result = await translateToSlug('記事タイトル')
    expect(result).toBe('untitled')
  })
})
