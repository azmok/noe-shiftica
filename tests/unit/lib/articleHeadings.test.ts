import { describe, it, expect } from 'vitest'
import { extractHeadings, slugifyHeading } from '@/lib/articleHeadings'

const text = (value: string) => ({ type: 'text', text: value })
const heading = (tag: string, ...children: object[]) => ({ type: 'heading', tag, children })
const doc = (...children: object[]) => ({ root: { type: 'root', children } })

describe('slugifyHeading', () => {
  it('keeps Japanese text readable', () => {
    expect(slugifyHeading('問題の原因')).toBe('問題の原因')
  })

  it('lowercases, hyphenates spaces, and drops punctuation', () => {
    expect(slugifyHeading('  Next.js の ISR キャッシュ!? ')).toBe('nextjs-の-isr-キャッシュ')
  })

  it('normalizes full-width characters and spaces', () => {
    expect(slugifyHeading('ＳＴＥＰ　１')).toBe('step-1')
  })

  it('falls back when nothing usable is left', () => {
    expect(slugifyHeading('!!!')).toBe('section')
  })
})

describe('extractHeadings', () => {
  it('collects headings in order with their levels', () => {
    const { headings } = extractHeadings(
      doc(heading('h2', text('はじめに')), { type: 'paragraph', children: [text('本文')] }, heading('h3', text('背景'))),
    )
    expect(headings).toEqual([
      { id: 'はじめに', text: 'はじめに', level: 2 },
      { id: '背景', text: '背景', level: 3 },
    ])
  })

  it('joins text split across formatting and links', () => {
    const { headings } = extractHeadings(
      doc(heading('h2', text('Cache '), { type: 'link', children: [text('handler')] }, text(' 解説'))),
    )
    expect(headings[0]).toMatchObject({ id: 'cache-handler-解説', text: 'Cache handler 解説' })
  })

  it('keeps IDs unique, including against headings that look like suffixes', () => {
    const { headings } = extractHeadings(
      doc(heading('h2', text('まとめ')), heading('h2', text('まとめ-2')), heading('h2', text('まとめ'))),
    )
    expect(headings.map((h) => h.id)).toEqual(['まとめ', 'まとめ-2', 'まとめ-3'])
  })

  it('maps each heading node to its ID for rendering', () => {
    const node = heading('h2', text('概要'))
    const { idByNode } = extractHeadings(doc(node))
    expect(idByNode.get(node)).toBe('概要')
  })

  it('skips empty headings and tolerates missing content', () => {
    expect(extractHeadings(doc(heading('h2'))).headings).toEqual([])
    expect(extractHeadings(null).headings).toEqual([])
  })
})
