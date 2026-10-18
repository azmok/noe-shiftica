import { describe, it, expect } from 'vitest'
import { openLinksInNewTab, prepareArticleMarkdown, replaceImagePlaceholders } from '@/lib/aiPostMarkdown'

const article = `---
title: "Title"
slug: "a-slug"
---

<link rel="stylesheet" href="../../../_css/md/ini.md.css" />

<h1 class="text-gradient">Title</h1>

Intro paragraph.

<!-- 書き手×読み手の2×2マトリクス図 -->
![01_writer_reader_flow](./01_writer_reader_flow.png)

<!--
multi-line
memo
-->

\`\`\`
![not-an-image](./inside-fence.png)
<h1>kept in code</h1>
\`\`\`

![](./02_no_alt.gif)

![03 encoded](./%E7%94%BB%E5%83%8F.png)

<blockquote class="twitter-tweet"><p>HTML is the new markdown.</p></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
`

describe('prepareArticleMarkdown', () => {
  const { markdown, images } = prepareArticleMarkdown(article)

  it('drops the stylesheet link, the h1, HTML comments and the widgets.js script', () => {
    expect(markdown).not.toContain('<link rel="stylesheet"')
    expect(markdown).not.toContain('<h1 class="text-gradient">')
    expect(markdown).not.toContain('<!--')
    expect(markdown).not.toContain('multi-line')
    expect(markdown).not.toContain('widgets.js')
  })

  it('keeps the X blockquote so the frontend can turn it into a card', () => {
    expect(markdown).toContain('<blockquote class="twitter-tweet">')
  })

  it('replaces image lines with placeholders (alt falls back to the file name, paths are decoded)', () => {
    expect(images).toEqual([
      { src: '01_writer_reader_flow.png', alt: '01_writer_reader_flow' },
      { src: '02_no_alt.gif', alt: '02_no_alt' },
      { src: '画像.png', alt: '03 encoded' },
    ])
    expect(markdown).toContain('MDIMAGEPLACEHOLDER0END')
    expect(markdown).toContain('MDIMAGEPLACEHOLDER2END')
  })

  it('leaves fenced code untouched', () => {
    expect(markdown).toContain('![not-an-image](./inside-fence.png)')
    expect(markdown).toContain('<h1>kept in code</h1>')
  })

  it('keeps the frontmatter for the converter', () => {
    expect(markdown.startsWith('---\ntitle: "Title"')).toBe(true)
  })
})

describe('replaceImagePlaceholders', () => {
  const paragraph = (text: string) => ({ type: 'paragraph', children: [{ type: 'text', text }] })

  it('swaps placeholder paragraphs for media upload nodes', () => {
    const lexical = {
      root: { type: 'root', children: [paragraph('Intro'), paragraph('MDIMAGEPLACEHOLDER0END')] },
    }
    replaceImagePlaceholders(lexical, [42])
    expect(lexical.root.children[0]).toEqual(paragraph('Intro'))
    expect(lexical.root.children[1]).toEqual({
      type: 'upload',
      relationTo: 'media',
      value: 42,
      fields: null,
      format: '',
      version: 3,
    })
  })

  it('throws when a placeholder has no uploaded media', () => {
    const lexical = { root: { type: 'root', children: [paragraph('MDIMAGEPLACEHOLDER3END')] } }
    expect(() => replaceImagePlaceholders(lexical, [1])).toThrow()
  })

  it('throws when a placeholder ended up inside other text', () => {
    const lexical = {
      root: { type: 'root', children: [{ type: 'list', children: [paragraph('x MDIMAGEPLACEHOLDER0END')] }] },
    }
    expect(() => replaceImagePlaceholders(lexical, [1])).toThrow()
  })
})

describe('openLinksInNewTab', () => {
  it('sets newTab on every link and autolink, keeping the other fields', () => {
    const lexical = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'link', fields: { url: 'https://example.com', linkType: 'custom', newTab: false }, children: [] },
              { type: 'text', text: 'plain' },
            ],
          },
          { type: 'list', children: [{ type: 'listitem', children: [{ type: 'autolink', fields: { url: 'https://a.b' } }] }] },
        ],
      },
    }
    openLinksInNewTab(lexical)
    const p = lexical.root.children[0] as { children: { fields?: Record<string, unknown> }[] }
    expect(p.children[0].fields).toEqual({ url: 'https://example.com', linkType: 'custom', newTab: true })
    expect(p.children[1].fields).toBeUndefined()
    const list = lexical.root.children[1] as { children: { children: { fields?: Record<string, unknown> }[] }[] }
    const auto = list.children[0].children[0]
    expect(auto.fields).toEqual({ url: 'https://a.b', newTab: true })
  })
})

