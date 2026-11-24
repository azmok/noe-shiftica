// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { renderMarkdownArticle } from '../render'
import { applyBlockEdit, inlineMarkdown, normalizeInline, replaceTableCell, targetOf } from '../admin/blockEdit'
import { placeImages, syncContentFromMarkdown, MARKDOWN_CONTENT_PROVIDED } from '../contentSync'

const SRC = ['# 見出し', '', '本文の段落です。', '', '- 項目A', '- 項目B', '', '| a | b |', '|---|---|', '| 1 | 2 |', ''].join('\n')

describe('renderMarkdownArticle sourceMap', () => {
  it('adds data-src / data-row only when asked', () => {
    const plain = renderMarkdownArticle(SRC).html
    expect(plain).not.toContain('data-src')
    expect(plain).not.toContain('noe-tight')
    const mapped = renderMarkdownArticle(SRC, {}, { sourceMap: true }).html
    expect(mapped).toContain('<h1 data-src="0:1"')
    expect(mapped).toContain('<p data-src="2:3">本文の段落です。</p>')
    expect(mapped).toContain('<span class="noe-tight" data-src="4:5">項目A</span>')
    expect(mapped).toContain('data-row="9" data-col="1"')
  })
})

describe('applyBlockEdit', () => {
  it('replaces a paragraph and keeps heading / list markers', () => {
    expect(applyBlockEdit(SRC, { src: [2, 3] }, '直した段落')).toContain('\n直した段落\n')
    expect(applyBlockEdit(SRC, { src: [0, 1] }, '新しい見出し').split('\n')[0]).toBe('# 新しい見出し')
    expect(applyBlockEdit(SRC, { src: [5, 6] }, '項目B2').split('\n')[5]).toBe('- 項目B2')
  })
  it('keeps the blank line after a block', () => {
    const out = applyBlockEdit('a\nb\n\nc', { src: [0, 3] }, 'x')
    expect(out).toBe('x\n\nc')
  })
  it('replaces a table cell (escaping pipes)', () => {
    expect(applyBlockEdit(SRC, { row: 9, col: 1 }, 'x|y').split('\n')[9]).toBe('| 1 | x\\|y |')
    expect(replaceTableCell('a | b', 0, 'z')).toBe(' z | b')
  })
  it('ignores targets outside the source', () => {
    expect(applyBlockEdit('a', { src: [5, 6] }, 'x')).toBe('a')
  })
})

describe('inlineMarkdown', () => {
  it('turns inline HTML back into Markdown', () => {
    const div = document.createElement('div')
    div.innerHTML = 'これは <strong>太字</strong> と <em>斜体</em>、<code>a&lt;b</code>、<a href="https://x.test">リンク</a><span>箱</span> <span class="term">用語</span>'
    expect(normalizeInline(inlineMarkdown(div))).toBe('これは **太字** と *斜体*、`a<b`、[リンク](https://x.test)箱 <span class="term">用語</span>')
  })
  it('reads the edit target from data attributes', () => {
    const p = document.createElement('p')
    p.setAttribute('data-src', '3:5')
    expect(targetOf(p)).toEqual({ src: [3, 5] })
    const td = document.createElement('td')
    td.setAttribute('data-row', '9')
    td.setAttribute('data-col', '1')
    expect(targetOf(td)).toEqual({ row: 9, col: 1 })
  })
})

describe('content sync', () => {
  it('turns image placeholders into uploads and drops ones without media', () => {
    const root: any = {
      children: [
        { type: 'paragraph', children: [{ type: 'text', text: 'MDIMAGEPLACEHOLDER0END' }] },
        { type: 'paragraph', children: [{ type: 'text', text: 'MDIMAGEPLACEHOLDER1END' }] },
        { type: 'paragraph', children: [{ type: 'text', text: '本文' }] },
      ],
    }
    placeImages(root, [7, undefined])
    expect(root.children.map((c: any) => c.type)).toEqual(['upload', 'paragraph'])
    expect(root.children[0].value).toBe(7)
  })

  const req = (context = {}) => ({ context, payload: { config: {}, logger: { warn: vi.fn() } } }) as any
  it('skips when the API already provided content, when not markdown, or when the source did not change', async () => {
    const data = { renderMode: 'markdown', markdownSource: 'new', content: 'keep' }
    expect((await syncContentFromMarkdown({ data: { ...data }, originalDoc: { markdownSource: 'old' }, req: req({ [MARKDOWN_CONTENT_PROVIDED]: true }) } as any)).content).toBe('keep')
    expect((await syncContentFromMarkdown({ data: { ...data, renderMode: 'lexical' }, originalDoc: {}, req: req() } as any)).content).toBe('keep')
    expect((await syncContentFromMarkdown({ data: { ...data }, originalDoc: { markdownSource: 'new' }, req: req() } as any)).content).toBe('keep')
  })
})
