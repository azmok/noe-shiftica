import MarkdownIt from 'markdown-it'
import { slugifyHeading, type ArticleHeading } from '@/plugins/articleToc/headings'

/**
 * markdownSource → 本文 HTML。サーバーでもブラウザ（管理画面の Live Preview）でも動く純粋な関数。
 *
 * Lexical を経由せず markdown-it（CommonMark）で直接 HTML にするので、ローカルプレビューと
 * 同じ解釈になる（空行を挟んだ <div> の中の Markdown も変換される）。
 * `html: true` なので、本文に書かれた HTML はそのまま出る。書き込めるのは api-clients の
 * キーを持つ人と管理画面のユーザーだけ、という前提（設計書 §4-4）。
 */

export type MarkdownMedia = Record<string, { id?: number | string; url: string }>

export interface RenderedMarkdown {
  html: string
  /** 目次用（既存の ArticleToc / ArticleTocSidebar にそのまま渡せる形） */
  headings: ArticleHeading[]
}

const md = new MarkdownIt({ html: true, linkify: true, typographer: false })

/** 共通アセットのパス（`../../_assets/…`）を、サイトの /md-assets/ に書き換える */
const ASSET_PATH_RE = /^(?:\.{1,2}\/)+_assets\/(.*)$/

function decode(p: string): string {
  try {
    return decodeURI(p)
  } catch {
    return p
  }
}

const isExternal = (v: string) => /^(?:[a-z][a-z0-9+.-]*:|\/|#|data:)/i.test(v)

export function rewriteUrl(value: string, attr: 'src' | 'href', media: MarkdownMedia): string {
  const asset = value.match(ASSET_PATH_RE)
  if (asset) return `/md-assets/${asset[1]}`
  // 本文画像（./xxx.png）→ media の URL。リンク先（href）は触らない
  if (attr === 'src' && !isExternal(value)) {
    const key = decode(value).replace(/^\.\//, '')
    const hit = media[key] ?? media[key.split('/').pop() ?? key]
    if (hit?.url) return hit.url
  }
  return value
}

/**
 * 出力 HTML の src / href を書き換える。コードブロック内の `src="…"` は escapeHtml で
 * `&quot;` になっているので、このパターンにはマッチしない。
 */
function rewriteHtmlUrls(html: string, media: MarkdownMedia): string {
  return html.replace(/\b(src|href)=("([^"]*)"|'([^']*)')/g, (match, attr: 'src' | 'href', quoted: string, dq?: string, sq?: string) => {
    const value = dq ?? sq ?? ''
    const next = rewriteUrl(value, attr, media)
    if (next === value) return match
    const q = quoted[0]
    return `${attr}=${q}${next.replace(q === '"' ? /"/g : /'/g, q === '"' ? '&quot;' : '&#39;')}${q}`
  })
}

function textOfInline(children: Array<{ type: string; content: string }> | null): string {
  return (children ?? [])
    .filter((t) => t.type === 'text' || t.type === 'code_inline')
    .map((t) => t.content)
    .join('')
}

export function renderMarkdownArticle(source: string, media: MarkdownMedia = {}): RenderedMarkdown {
  const env: { headings: ArticleHeading[] } = { headings: [] }
  const used = new Set<string>()

  const tokens = md.parse(source ?? '', env)
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.type !== 'heading_open') continue
    const text = textOfInline(tokens[i + 1]?.children ?? null).replace(/\s+/g, ' ').trim()
    if (!text) continue
    // articleToc/headings.ts と同じ規則（slugifyHeading + 重複は -2, -3）
    const base = slugifyHeading(text)
    let id = base
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`
    used.add(id)
    t.attrSet('id', id)
    env.headings.push({ id, text, level: Number(t.tag.slice(1)) })
  }

  const html = rewriteHtmlUrls(md.renderer.render(tokens, md.options, env), media)
  return { html, headings: env.headings }
}
