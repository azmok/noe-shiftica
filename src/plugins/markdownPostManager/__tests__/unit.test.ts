/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { renderMarkdownArticle, rewriteUrl } from '../render'
import { scopeMarkdownCss, scopeSelector } from '../scopeCss'
import { prepareMarkdownSource, referencedMarkdownImages } from '../prepare'
import { markdownPostManager, markdownPostFields, isMarkdownMode } from '../index'
import { markdownRevision, checkGitOverwrite } from '../revision'

const ai = `
<div class="ai-box ai-box--claude">
<h4 class="ai-box__title"><img class="icons" src="../../_assets/icons/claude.svg" alt="" />Claude</h4>

- **太字** の箇条書き
- [リンク](https://example.com)

\`\`\`bash
echo "<img src='./x.png'>"
\`\`\`

</div>

段落の中に <button type="button" class="term" data-note="注釈">用語</button> がある。

<div class="table-scroll">
<table><tr><td>a</td></tr></table>
</div>
`

describe('renderMarkdownArticle', () => {
  it('converts Markdown inside a <div> block separated by blank lines', () => {
    const { html } = renderMarkdownArticle(ai)
    expect(html).toContain('<div class="ai-box ai-box--claude">')
    expect(html).toContain('<strong>太字</strong>')
    expect(html).toContain('<li><a href="https://example.com">リンク</a></li>')
    expect(html).toContain('<pre><code class="language-bash">')
  })

  it('keeps inline HTML such as <button class="term"> as real elements', () => {
    const { html } = renderMarkdownArticle(ai)
    expect(html).toContain('<button type="button" class="term" data-note="注釈">用語</button>')
    expect(html).not.toContain('&lt;button')
  })

  it('keeps the table-scroll wrapper', () => {
    expect(renderMarkdownArticle(ai).html).toContain('<div class="table-scroll">')
  })

  it('rewrites _assets paths to /md-assets/ (img src / link href / script src)', () => {
    const { html } = renderMarkdownArticle(
      '<link rel="stylesheet" href="../../_assets/md/ini.md.css" />\n<script src="../_assets/md/md-ui.js"></script>\n\n<img src="../../../_assets/icons/a.svg">',
    )
    expect(html).toContain('href="/md-assets/md/ini.md.css"')
    expect(html).toContain('src="/md-assets/md/md-ui.js"')
    expect(html).toContain('src="/md-assets/icons/a.svg"')
  })

  it('rewrites ./xxx.png to the media URL, but not inside code blocks or for external URLs', () => {
    const media = { 'a b.png': { url: 'https://cdn/x/a-b.png' }, 'x.png': { url: 'https://cdn/x.png' } }
    const { html } = renderMarkdownArticle(
      '![alt](./a%20b.png)\n\n<img src="./x.png">\n\n<img src="https://e.com/x.png">\n\n```\n<img src="./x.png">\n```\n',
      media,
    )
    expect(html).toContain('src="https://cdn/x/a-b.png"')
    expect(html).toContain('<img src="https://cdn/x.png">')
    expect(html).toContain('src="https://e.com/x.png"')
    expect(html).toContain('&lt;img src=&quot;./x.png&quot;&gt;')
  })

  it('leaves other attributes such as data-src alone', () => {
    const { html } = renderMarkdownArticle('<img data-src="./x.png" src="./x.png">', { 'x.png': { url: 'https://cdn/x.png' } })
    expect(html).toContain('data-src="./x.png"')
    expect(html).toContain(' src="https://cdn/x.png"')
  })

  it('does not rewrite link hrefs to media', () => {
    expect(rewriteUrl('./x.png', 'href', { 'x.png': { url: 'https://cdn/x.png' } })).toBe('./x.png')
  })

  it('gives headings ids and returns TOC headings with the same rule as articleToc', () => {
    const { html, headings } = renderMarkdownArticle('# T\n\n## 問題の原因\n\n### 詳細\n\n## 問題の原因\n')
    expect(headings.map((h) => [h.id, h.level, h.text])).toEqual([
      ['t', 1, 'T'],
      ['問題の原因', 2, '問題の原因'],
      ['詳細', 3, '詳細'],
      ['問題の原因-2', 2, '問題の原因'],
    ])
    expect(html).toContain('<h2 id="問題の原因" data-heading-id="問題の原因">')
    expect(html).toContain('<h2 id="問題の原因-2" data-heading-id="問題の原因-2">')
  })

  it('ids: false keeps data-heading-id but drops id (second copy of the body)', () => {
    const { html } = renderMarkdownArticle('## 見出し\n', {}, { ids: false })
    expect(html).toContain('<h2 data-heading-id="見出し">')
    expect(html).not.toContain(' id=')
  })
})

describe('scopeMarkdownCss', () => {
  it('prefixes every selector with #article-page; html / body / :root become #article-page itself', () => {
    expect(scopeSelector('html')).toBe('#article-page')
    expect(scopeSelector('body')).toBe('#article-page')
    expect(scopeSelector(':root')).toBe('#article-page')
    expect(scopeSelector('body.dark')).toBe('#article-page.dark')
    expect(scopeSelector('h1')).toBe('#article-page h1')
    expect(scopeSelector('.article-body h2')).toBe('#article-page .article-body h2')
    expect(scopeSelector('.bodyish')).toBe('#article-page .bodyish')
    expect(scopeSelector('::selection')).toBe('#article-page ::selection')
  })

  it('markdown-only adapters stay limited to the markdown body', () => {
    expect(scopeSelector(':where(.md-render, html > body) table td')).toBe('#article-page :where(.md-render, html > body) table td')
  })

  it('scopes selector lists and nested @media, and hoists @keyframes / @import', () => {
    const out = scopeMarkdownCss(`
      /* c { x } */
      @import url("x.css");
      @keyframes k { from { opacity: 0 } to { opacity: 1 } }
      html, button, a:not(.x, .y) { touch-action: manipulation; }
      @media (max-width: 640px) { body { padding: 0 } th, td { min-width: 1em } }
    `)
    expect(out.indexOf('@import url("x.css");')).toBe(0)
    expect(out).toMatch(/^@keyframes k\{ from \{ opacity: 0 \} to \{ opacity: 1 \} \}$/m)
    expect(out).toContain('#article-page, #article-page button, #article-page a:not(.x, .y){')
    expect(out).toMatch(/@media \(max-width: 640px\)\{\s*#article-page\{ padding: 0 \}/)
    expect(out).toContain('#article-page th, #article-page td{')
    expect(out).not.toContain('c { x }')
  })

  it('every rule in the real article.css is scoped (nothing can reach the nav or footer)', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'public/md-assets/md/article.css'), 'utf8')
    const out = scopeMarkdownCss(css)
    expect(out.split('{').length).toBe(out.split('}').length)
    // collect top-level and @media-nested selector lists and check each selector starts with the root
    const selectors = [...out.matchAll(/(?:^|\})\s*([^{}@][^{}]*)\{/g)].map((m) => m[1].trim()).filter((sel) => sel && !sel.startsWith('@') && !/^(from|to|\d+%)/.test(sel))
    expect(selectors.length).toBeGreaterThan(50)
    for (const list of selectors) {
      for (const sel of list.split(/,(?![^(]*\))/)) expect(sel.trim().startsWith('#article-page')).toBe(true)
    }
  })

  it('the committed article.scoped.css is up to date (run `pnpm md-assets:build`)', () => {
    const dir = path.resolve(process.cwd(), 'public/md-assets/md')
    const fresh = scopeMarkdownCss(fs.readFileSync(path.join(dir, 'article.css'), 'utf8'))
    expect(fs.readFileSync(path.join(dir, 'article.scoped.css'), 'utf8')).toBe(fresh)
  })
})

describe('prepareMarkdownSource', () => {
  it('drops stylesheet links, _assets scripts, the leading h1 and HTML comments', () => {
    const out = prepareMarkdownSource(
      [
        '<link rel="stylesheet" href="../../_assets/md/ini.md.css" />',
        '<script src="../../_assets/md/term-note.js" defer></script>',
        '<!-- メモ -->',
        '<h1>Title</h1>',
        '',
        '本文',
        '<h1>second</h1>',
        '```html',
        '<link rel="stylesheet" href="x.css" />',
        '```',
      ].join('\n'),
    )
    expect(out).not.toContain('ini.md.css')
    expect(out).not.toContain('term-note.js')
    expect(out).not.toContain('メモ')
    expect(out).not.toContain('<h1>Title</h1>')
    expect(out).toContain('<h1>second</h1>')
    expect(out).toContain('<link rel="stylesheet" href="x.css" />')
    expect(out.startsWith('本文')).toBe(true)
  })

  it('keeps non-asset scripts', () => {
    expect(prepareMarkdownSource('<script src="https://x.test/a.js"></script>')).toContain('x.test/a.js')
  })
})

describe('referencedMarkdownImages', () => {
  it('finds relative images anywhere (inline, in HTML), skipping _assets / URLs / code fences', () => {
    const md = [
      '![a](./01.png)',
      '<div class="ai-box">![b](./02%20x.jpg "t")</div>',
      '<img src="./03.webp" alt="">',
      '<img class="icons" src="../../_assets/icons/c.svg">',
      '![u](https://e.com/u.png)',
      '![svg](./d.svg)',
      '![gif](./e.gif)',
      '```',
      '![z](./zz.png)',
      '```',
    ].join('\n')
    expect(referencedMarkdownImages(md)).toEqual(['01.png', '02 x.jpg', '03.webp', 'd.svg', 'e.gif'])
  })
})

describe('markdownPostManager', () => {
  it('adds the fields only to the listed collections', () => {
    const cfg: any = { collections: [{ slug: 'posts', fields: [] }, { slug: 'media', fields: [] }] }
    const out: any = markdownPostManager({ collections: ['posts'] })(cfg)
    expect(out.collections[0].fields.map((f: any) => f.name)).toEqual(['renderMode', 'markdownSource', 'markdownMedia', 'markdownRevision'])
    expect(out.collections[1].fields).toEqual([])
  })

  it('validates renderMode and defaults to lexical', () => {
    const f: any = markdownPostFields.find((x: any) => x.name === 'renderMode')
    expect(f.defaultValue).toBe('lexical')
    expect(f.validate('markdown')).toBe(true)
    expect(f.validate(undefined)).toBe(true)
    expect(f.validate('html')).not.toBe(true)
  })

  it('isMarkdownMode is false for existing articles (renderMode unset or lexical)', () => {
    expect(isMarkdownMode({})).toBe(false)
    expect(isMarkdownMode({ renderMode: 'lexical', markdownSource: 'x' })).toBe(false)
    expect(isMarkdownMode({ renderMode: 'markdown', markdownSource: '' })).toBe(false)
    expect(isMarkdownMode({ renderMode: 'markdown', markdownSource: '# a' })).toBe(true)
    expect(isMarkdownMode(null)).toBe(false)
  })
})

describe('markdownRevision', () => {
  it('is stable across CRLF / LF and trailing blank lines', () => {
    expect(markdownRevision('a\r\nb\r\n\r\n')).toBe(markdownRevision('a\nb'))
    expect(markdownRevision('a\nb')).not.toBe(markdownRevision('a\nc'))
    expect(markdownRevision('x')).toMatch(/^[0-9a-f]{16}$/)
  })

  it('is filled by the field hook from markdownSource (incoming or existing)', () => {
    const f: any = markdownPostFields.find((x: any) => x.name === 'markdownRevision')
    const hook = f.hooks.beforeChange[0]
    expect(hook({ siblingData: { markdownSource: 'hello' } })).toBe(markdownRevision('hello'))
    expect(hook({ siblingData: {}, originalDoc: { markdownSource: 'old' } })).toBe(markdownRevision('old'))
    expect(hook({ siblingData: {} })).toBeNull()
  })
})

describe('checkGitOverwrite', () => {
  const cur = markdownRevision('current body')
  it('lets Git write new and never-published articles', () => {
    expect(checkGitOverwrite({ existing: null, incomingRevision: 'x' }).ok).toBe(true)
    expect(checkGitOverwrite({ existing: { published: false, markdownRevision: cur }, incomingRevision: 'x' }).ok).toBe(true)
  })
  it('accepts an identical resend of a published article', () => {
    expect(checkGitOverwrite({ existing: { published: true, markdownRevision: cur }, incomingRevision: cur }).ok).toBe(true)
  })
  it('accepts an edit based on the current DB version (baseRevision)', () => {
    expect(checkGitOverwrite({ existing: { published: true, markdownRevision: cur }, incomingRevision: 'new', baseRevision: cur }).ok).toBe(true)
  })
  it('rejects an old .md without baseRevision once the article is published', () => {
    const r = checkGitOverwrite({ existing: { published: true, markdownRevision: cur }, incomingRevision: 'old' })
    expect(r.ok).toBe(false)
  })
  it('rejects when the DB changed after the export', () => {
    const r = checkGitOverwrite({ existing: { published: true, markdownRevision: cur }, incomingRevision: 'new', baseRevision: 'stale' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('stale')
  })
})
