import { describe, it, expect } from 'vitest'
import { calculateReadingTime } from '@/lib/calculateReadingTime'

describe('calculateReadingTime', () => {
  it('returns 0 for null/undefined input', () => {
    expect(calculateReadingTime(null)).toBe(0)
    expect(calculateReadingTime(undefined)).toBe(0)
  })

  it('returns 0 for empty Lexical document', () => {
    const emptyDoc = { root: { children: [] } }
    expect(calculateReadingTime(emptyDoc)).toBe(0)
  })

  it('calculates 1 min for content under 600 chars', () => {
    const doc = {
      root: {
        children: [
          {
            children: [{ text: 'あ'.repeat(300) }],
          },
        ],
      },
    }
    expect(calculateReadingTime(doc)).toBe(1)
  })

  it('calculates 2 mins for content between 601-1200 chars', () => {
    const doc = {
      root: {
        children: [
          {
            children: [{ text: 'あ'.repeat(700) }],
          },
        ],
      },
    }
    expect(calculateReadingTime(doc)).toBe(2)
  })

  it('traverses nested Lexical nodes correctly', () => {
    const doc = {
      root: {
        children: [
          {
            children: [
              { text: 'あ'.repeat(200) },
              {
                children: [{ text: 'い'.repeat(200) }],
              },
            ],
          },
          {
            children: [{ text: 'う'.repeat(200) }],
          },
        ],
      },
    }
    // 600 chars total → ceil(600/600) = 1
    expect(calculateReadingTime(doc)).toBe(1)
  })

  it('handles plain string content (HTML fallback path)', () => {
    const html = '<p>' + 'あ'.repeat(600) + '</p>'
    // 600 chars after stripping tags → 1 min
    expect(calculateReadingTime(html)).toBe(1)
  })

  it('strips HTML tags before counting in string mode', () => {
    const html = '<h1>Title</h1><p>Body text here</p>'
    // "TitleBody text here" = 19 chars → ceil(19/600) = 1
    expect(calculateReadingTime(html)).toBe(1)
  })
})
