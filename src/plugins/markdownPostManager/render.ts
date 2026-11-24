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

// 管理画面のプレビュー用：リストの中の段落（tight list で <p> が出ない）にも印を付けられるよう、
// 隠し段落を <span class="noe-tight" data-src> で包む。env.sourceMap が無ければ今まで通り何も出さない
const renderHiddenParagraph =
  (open: boolean) =>
  (tokens: any[], idx: number, options: any, env: any, self: any): string => {
    const t = tokens[idx]
    if (t.hidden) {
      if (!env?.sourceMap) return ''
      if (open) return t.attrGet('data-src') ? `<span class="noe-tight" data-src="${t.attrGet('data-src')}">` : ''
      return t.meta?.span ? '</span>' : ''
    }
    return self.renderToken(tokens, idx, options)
  }
md.renderer.rules.paragraph_open = renderHiddenParagraph(true)
md.renderer.rules.paragraph_close = renderHiddenParagraph(false)

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
  // 直前が空白の src / href だけ（data-src などの別の属性は書き換えない）
  return html.replace(/(\s)(src|href)=("([^"]*)"|'([^']*)')/g, (match, sp: string, attr: 'src' | 'href', quoted: string, dq?: string, sq?: string) => {
    const value = dq ?? sq ?? ''
    const next = rewriteUrl(value, attr, media)
    if (next === value) return match
    const q = quoted[0]
    return `${sp}${attr}=${q}${next.replace(q === '"' ? /"/g : /'/g, q === '"' ? '&quot;' : '&#39;')}${q}`
  })
}

function textOfInline(children: Array<{ type: string; content: string }> | null): string {
  return (children ?? [])
    .filter((t) => t.type === 'text' || t.type === 'code_inline')
    .map((t) => t.content)
    .join('')
}

export interface RenderOptions {
  /**
   * 見出しに実際の `id` を付けるか。本文はモバイル用とデスクトップ用の2回描画されるので、
   * 片方だけ true にして fragment の id を一意に保つ（articleToc の headingWithAnchor と同じ方針）。
   * `data-heading-id` は常に付く（HeadingAnchorBehavior / ArticleTocSidebar が見る）。
   */
  ids?: boolean
  /**
   * 管理画面のプレビュー用。段落・見出しに `data-src="開始行:終了行"`（markdownSource の行番号、0 始まり）、
   * 表のセルに `data-row` / `data-col` を付ける。スクロールの連動と、クリックしてその場で書き換える機能が使う。
   * サイトの表示では付けない（既定 false）。
   */
  sourceMap?: boolean
}

function addSourceMap(tokens: any[]): void {
  const openHidden: number[] = []
  let row = -1
  let col = 0
  for (const t of tokens) {
    if ((t.type === 'paragraph_open' || t.type === 'heading_open') && t.map) t.attrSet('data-src', `${t.map[0]}:${t.map[1]}`)
    if (t.type === 'paragraph_open' && t.hidden) openHidden.push(t.level)
    if (t.type === 'paragraph_close' && t.hidden && openHidden.length && openHidden[openHidden.length - 1] === t.level) {
      openHidden.pop()
      t.meta = { ...(t.meta ?? {}), span: true }
    }
    if (t.type === 'tr_open' && t.map) {
      row = t.map[0]
      col = 0
    }
    if ((t.type === 'th_open' || t.type === 'td_open') && row >= 0) {
      t.attrSet('data-row', String(row))
      t.attrSet('data-col', String(col++))
    }
  }
}

export function renderMarkdownArticle(
  source: string,
  media: MarkdownMedia = {},
  options: RenderOptions = {},
): RenderedMarkdown {
  const env: { headings: ArticleHeading[]; sourceMap?: boolean } = { headings: [], sourceMap: options.sourceMap }
  const used = new Set<string>()

  const tokens = md.parse(source ?? '', env)
  if (options.sourceMap) addSourceMap(tokens)
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
    if (options.ids !== false) t.attrSet('id', id)
    t.attrSet('data-heading-id', id)
    env.headings.push({ id, text, level: Number(t.tag.slice(1)) })
  }

  const html = rewriteHtmlUrls(md.renderer.render(tokens, md.options, env), media)
  return { html, headings: env.headings }
}
