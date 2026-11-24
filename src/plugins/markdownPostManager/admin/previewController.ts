import { renderMarkdownArticle, type MarkdownMedia } from '../render'
import { applyBlockEdit, inlineMarkdown, normalizeInline, targetOf } from './blockEdit'

/**
 * 管理画面の Markdown エディタの「プレビュー」側。React に依存しない DOM だけの部品
 * （設計書 docs/markdown-post-manager-and-style-editor.md §2.3）。
 *
 * - 本物の下書きプレビューページ（/dev|blog/<slug>/preview）を iframe で開き、本文（[data-md-root]）だけを
 *   入力中の Markdown で差し替える。サイトの CSS・型・共通 JS がそのまま効くので、見た目は本番と同じ。
 *   ページが無い（未保存・slug なし・Markdown 記事ではない）ときは、上書き CSS だけの簡易表示にする。
 * - 段落・見出し・表のセルをクリックすると、その場で書き換えられる（Enter で確定 / Esc で取り消し）。
 *   確定すると onChange に新しい原文が渡る。
 * - スクロール位置を「原文の何行目か」でやりとりする（エディタ側と連動させるため）。
 */

const EDITABLE =
  'p[data-src], h1[data-src], h2[data-src], h3[data-src], h4[data-src], h5[data-src], h6[data-src], span.noe-tight[data-src], td[data-row], th[data-row]'
const SCRIPTS = ['/md-assets/md/term-note.js', '/md-assets/md/md-ui.js']

export const FALLBACK_PREVIEW = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/md-assets/md/article.scoped.css">
<style>html,body{margin:0;background:#121212;color:#e5e5e5;font-family:system-ui,-apple-system,"Hiragino Sans",sans-serif}
#article-page{max-width:820px;margin:0 auto;padding:32px 20px 40vh}.noe-preview-note{font-size:12px;color:#9aa0ac;margin-bottom:16px}</style>
</head><body><main id="article-page"><p class="noe-preview-note">簡易プレビュー（保存すると、本物の記事ページの見た目で確認できます）</p>
<div class="md-render" data-md-root></div></main></body></html>`

export interface PreviewCallbacks {
  /** プレビューで書き換えた結果の新しい原文 */
  onChange: (nextSource: string) => void
  /** 書き換え中かどうか（ツールバーのボタンの有効・無効に使う） */
  onEditing?: (editing: boolean) => void
  /** プレビューがスクロールされた */
  onScroll?: () => void
}

export class MarkdownPreview {
  private iframe: HTMLIFrameElement
  private cb: PreviewCallbacks
  private source = ''
  private media: MarkdownMedia = {}
  private editing: HTMLElement | null = null
  private editingOriginal = ''
  private scriptTimer: ReturnType<typeof setTimeout> | null = null
  private ready = false
  /** 本物のページで開けたか（false なら簡易表示） */
  realPage = false

  constructor(iframe: HTMLIFrameElement, cb: PreviewCallbacks) {
    this.iframe = iframe
    this.cb = cb
  }

  get doc(): Document | null {
    try {
      return this.iframe.contentDocument
    } catch {
      return null
    }
  }

  /** プレビューを開く。url が null か、開いたページに本文の箱が無ければ簡易表示 */
  load(url: string | null): Promise<void> {
    this.ready = false
    return new Promise((resolve) => {
      const done = () => {
        this.ready = true
        this.hook()
        this.render()
        resolve()
      }
      const fallback = () => {
        this.realPage = false
        this.iframe.onload = () => done()
        this.iframe.removeAttribute('src')
        this.iframe.srcdoc = FALLBACK_PREVIEW
      }
      if (!url) return fallback()
      this.iframe.onload = () => {
        const d = this.doc
        if (!d || !d.querySelector('[data-md-root]')) return fallback()
        this.realPage = true
        done()
      }
      this.iframe.removeAttribute('srcdoc')
      this.iframe.src = url
    })
  }

  /** 入力中の原文と画像の対応表を受け取って、本文を描き直す */
  update(source: string, media: MarkdownMedia): void {
    this.source = source
    this.media = media || {}
    if (this.ready && !this.editing) this.render()
  }

  private render(): void {
    const d = this.doc
    if (!d) return
    const roots = Array.from(d.querySelectorAll<HTMLElement>('[data-md-root]'))
    roots.forEach((root, i) => {
      // モバイル用の本文だけ見出しに id を付ける（サイトと同じ。id の重複を避ける）
      const ids = roots.length === 1 || !!root.closest('.article-mobile') || (i === 0 && !d.querySelector('.article-mobile'))
      root.innerHTML = renderMarkdownArticle(this.source, this.media, { ids, sourceMap: true }).html
    })
    this.rerunScripts()
  }

  /** 共通 JS（コピー・用語の注釈・開閉ボックス）を、描き直した本文にもう一度かける */
  private rerunScripts(): void {
    if (this.scriptTimer) clearTimeout(this.scriptTimer)
    this.scriptTimer = setTimeout(() => {
      const d = this.doc
      if (!d) return
      SCRIPTS.forEach((src) => {
        const s = d.createElement('script')
        s.src = src + '?v=' + Date.now()
        s.dataset.noePreview = '1'
        d.body.appendChild(s)
        s.onload = () => s.remove()
      })
    }, 600)
  }

  private hook(): void {
    const d = this.doc
    if (!d) return
    const win = d.defaultView
    win?.addEventListener('scroll', () => this.cb.onScroll?.(), { passive: true })
    d.addEventListener(
      'click',
      (ev) => {
        const target = ev.target as Element | null
        if (!target || !target.closest) return
        if (this.editing && this.editing.contains(target)) {
          if (target.closest('a')) ev.preventDefault()
          return
        }
        const a = target.closest('a')
        const block = target.closest(EDITABLE) as HTMLElement | null
        // 本文以外（ナビ・フッター）のリンクで管理画面のプレビューが別ページに飛ばないように
        if (a) ev.preventDefault()
        if (block && block.closest('[data-md-root]')) {
          ev.preventDefault()
          if (this.editing) this.commit()
          this.startEdit(block)
        } else if (a) {
          const href = a.getAttribute('href') || ''
          if (href[0] === '#') {
            const el = this.visibleById(decodeURIComponent(href.slice(1)))
            if (el) win?.scrollTo({ top: this.absTop(el) - 20, behavior: 'smooth' })
          }
        }
      },
      true,
    )
  }

  private visibleById(id: string): Element | null {
    const all = this.doc?.querySelectorAll('[id], [data-heading-id]') ?? []
    for (const el of Array.from(all)) {
      if ((el.id === id || el.getAttribute('data-heading-id') === id) && el.getClientRects().length) return el
    }
    return null
  }

  // ------------------------------------------------------------ クリックして書き換える
  private onKey = (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault()
      this.commit()
    } else if (ev.key === 'Escape') {
      ev.preventDefault()
      this.cancel()
    } else if (ev.key === 'Enter' && ev.shiftKey) {
      ev.preventDefault()
      this.doc?.execCommand('insertLineBreak')
    }
  }

  private startEdit(el: HTMLElement): void {
    this.editing = el
    this.editingOriginal = el.innerHTML
    el.contentEditable = 'true'
    el.focus()
    el.addEventListener('keydown', this.onKey)
    this.cb.onEditing?.(true)
  }

  private endEdit(): void {
    if (!this.editing) return
    this.editing.removeEventListener('keydown', this.onKey)
    this.editing.removeAttribute('contenteditable')
    this.editing = null
    this.cb.onEditing?.(false)
  }

  get isEditing(): boolean {
    return !!this.editing
  }

  /** 書き換えを確定する。変わっていれば onChange に新しい原文を渡す */
  commit(): void {
    const el = this.editing
    if (!el) return
    const text = normalizeInline(inlineMarkdown(el))
    const target = targetOf(el)
    const before = this.doc!.createElement('div')
    before.innerHTML = this.editingOriginal
    this.endEdit()
    if (!target || normalizeInline(inlineMarkdown(before)) === text) return
    const next = applyBlockEdit(this.source, target, text)
    if (next !== this.source) {
      this.source = next
      this.cb.onChange(next)
    }
    this.render()
  }

  cancel(): void {
    if (!this.editing) return
    this.editing.innerHTML = this.editingOriginal
    this.endEdit()
  }

  /** 書き換え中の文字に、太字・斜体・コード・リンクを付ける */
  format(cmd: 'bold' | 'italic' | 'code' | 'link', url?: string): void {
    const d = this.doc
    if (!d || !this.editing) return
    const sel = d.getSelection()
    if (!sel || !sel.rangeCount || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    if (cmd === 'link') {
      if (url) d.execCommand('createLink', false, url)
    } else if (cmd === 'code') {
      const code = d.createElement('code')
      code.textContent = range.toString()
      range.deleteContents()
      range.insertNode(code)
    } else {
      const tag = cmd === 'bold' ? 'strong' : 'em'
      const anc = (range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode) as Element
      const wrap = anc?.closest?.(cmd === 'bold' ? 'strong, b' : 'em, i')
      if (wrap && this.editing.contains(wrap) && wrap !== this.editing) {
        const parent = wrap.parentNode!
        while (wrap.firstChild) parent.insertBefore(wrap.firstChild, wrap)
        parent.removeChild(wrap)
      } else {
        const w = d.createElement(tag)
        w.appendChild(range.extractContents())
        range.insertNode(w)
        sel.removeAllRanges()
        const nr = d.createRange()
        nr.selectNodeContents(w)
        sel.addRange(nr)
      }
    }
    this.editing?.focus()
  }

  // ------------------------------------------------------------ スクロール（原文の行番号でやりとり）
  private absTop(el: Element): number {
    const win = this.doc?.defaultView
    return el.getBoundingClientRect().top + (win?.scrollY ?? 0)
  }

  private blocks(): Array<{ line: number; top: number }> {
    const d = this.doc
    if (!d) return []
    return Array.from(d.querySelectorAll('[data-md-root] [data-src]'))
      .filter((e) => e.getClientRects().length)
      .map((e) => ({ line: Number(e.getAttribute('data-src')!.split(':')[0]), top: this.absTop(e) }))
      .sort((a, b) => a.top - b.top)
  }

  /** いま画面のいちばん上に見えている本文が、原文の何行目か */
  lineAtTop(): number {
    const win = this.doc?.defaultView
    const y = (win?.scrollY ?? 0) + 24
    const blocks = this.blocks()
    if (!blocks.length) return 0
    let b = blocks[0]
    for (const x of blocks) {
      if (x.top <= y) b = x
      else break
    }
    return b.line
  }

  /** 原文の line 行目あたりの本文が、画面のいちばん上に来るようにスクロールする */
  scrollToLine(line: number): void {
    const win = this.doc?.defaultView
    const blocks = this.blocks()
    if (!win || !blocks.length) return
    const b = blocks.find((x) => x.line >= line) ?? blocks[blocks.length - 1]
    win.scrollTo({ top: Math.max(0, b.top - 24) })
  }
}
