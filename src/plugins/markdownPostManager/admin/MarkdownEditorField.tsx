'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'
import type { TextareaFieldClientProps } from 'payload'
import type { MarkdownMedia } from '../render'
import { referencedMarkdownImages } from '../prepare'
import { MarkdownPreview } from './previewController'

/**
 * markdownSource の編集欄（設計書 docs/markdown-post-manager-and-style-editor.md §2.3、フェーズ2）。
 *
 * - 左に Markdown、右に本物の記事ページのプレビュー。スクロールは原文の行番号で連動する
 * - プレビューの段落・見出し・表のセルをクリックすると、その場で書き換えられる（Enter で確定 / Esc で取り消し）
 * - 「画像を追加」で Media にアップロードし、markdownMedia に登録して本文に ![](./ファイル名) を入れる
 * - 「MD / 並べて / プレビュー」の切り替えと、全画面表示
 *
 * 入力は手元の state で即座に描き、フォームへの setValue は少し遅らせてまとめる（打鍵ごとに重くしない）。
 * markdownMedia（json）への setValue は別 tick で行う（既知の罠2：json の setValue は重い。ai-brains の stacks/payload/lessons.md）。
 */

type View = 'md' | 'split' | 'preview'

const CSS = `
.noe-mde{border:1px solid var(--theme-elevation-150);border-radius:8px;overflow:hidden;background:var(--theme-elevation-0)}
.noe-mde.is-full{position:fixed;inset:0;z-index:1000;border-radius:0;display:flex;flex-direction:column}
.noe-mde__bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 8px;border-bottom:1px solid var(--theme-elevation-150);background:var(--theme-elevation-50)}
.noe-mde__bar button{font:inherit;font-size:12px;padding:4px 9px;border-radius:6px;border:1px solid var(--theme-elevation-200);background:var(--theme-elevation-0);color:var(--theme-text);cursor:pointer}
.noe-mde__bar button:disabled{opacity:.4;cursor:default}
.noe-mde__bar button.is-on{background:var(--theme-elevation-800);color:var(--theme-elevation-0);border-color:var(--theme-elevation-800)}
.noe-mde__seg{display:inline-flex;gap:0}.noe-mde__seg button{border-radius:0}.noe-mde__seg button:first-child{border-radius:6px 0 0 6px}.noe-mde__seg button:last-child{border-radius:0 6px 6px 0}
.noe-mde__grow{flex:1}
.noe-mde__hint{font-size:11px;color:var(--theme-elevation-500)}
.noe-mde__body{display:flex;height:75vh;min-height:420px}
.noe-mde.is-full .noe-mde__body{flex:1;height:auto}
.noe-mde__src,.noe-mde__prev{flex:1;min-width:0;position:relative}
.noe-mde.view-md .noe-mde__prev,.noe-mde.view-preview .noe-mde__src{display:none}
.noe-mde.view-split .noe-mde__prev{border-left:1px solid var(--theme-elevation-150)}
.noe-mde__src textarea{width:100%;height:100%;resize:none;border:0;outline:0;padding:14px 16px 40vh;box-sizing:border-box;background:var(--theme-elevation-0);color:var(--theme-text);font:13px/1.7 ui-monospace,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere;tab-size:2}
.noe-mde__prev iframe{width:100%;height:100%;border:0;background:#121212;display:block}
.noe-mde__warn{padding:6px 10px;font-size:12px;background:rgba(255,170,0,.12);border-top:1px solid rgba(255,170,0,.4);color:var(--theme-text)}
@media (max-width:900px){.noe-mde.view-split .noe-mde__body{flex-direction:column}.noe-mde.view-split .noe-mde__prev{border-left:0;border-top:1px solid var(--theme-elevation-150)}}
`

function useDebounced<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  const ref = useRef(fn)
  ref.current = fn
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback(
    ((...args: any[]) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => ref.current(...args), ms)
    }) as T,
    [ms],
  )
}

export const MarkdownEditorField: React.FC<TextareaFieldClientProps> = (props) => {
  const { path, field, readOnly: readOnlyProp } = props
  const readOnly = Boolean(readOnlyProp || field?.admin?.readOnly)
  const { value, setValue } = useField<string>({ path })
  const { value: mediaValue, setValue: setMedia } = useField<MarkdownMedia | null>({ path: 'markdownMedia' })
  const { value: slug } = useField<string>({ path: 'slug' })
  const { id, collectionSlug } = useDocumentInfo()

  const [text, setText] = useState<string>(value ?? '')
  const [view, setView] = useState<View>('split')
  const [full, setFull] = useState(false)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState('')
  const media = useMemo<MarkdownMedia>(() => (mediaValue && typeof mediaValue === 'object' ? mediaValue : {}), [mediaValue])

  const taRef = useRef<HTMLTextAreaElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<MarkdownPreview | null>(null)
  const textRef = useRef(text)
  textRef.current = text
  const mediaRef = useRef(media)
  mediaRef.current = media
  const syncFrom = useRef<'md' | 'preview' | null>(null)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lineTops = useRef<number[]>([])

  // フォームの値が外から変わったとき（読み込み・別の操作）だけ手元に取り込む
  const lastSent = useRef<string | undefined>(value)
  useEffect(() => {
    if (value !== lastSent.current && typeof value === 'string' && value !== textRef.current) setText(value)
  }, [value])

  const pushValue = useDebounced((next: string) => {
    lastSent.current = next
    setValue(next)
  }, 400)
  const renderPreview = useDebounced(() => previewRef.current?.update(textRef.current, mediaRef.current), 250)

  const changeText = useCallback(
    (next: string) => {
      setText(next)
      textRef.current = next
      pushValue(next)
      renderPreview()
    },
    [pushValue, renderPreview],
  )

  // ---------------------------------------------------------------- プレビュー
  const previewUrl = useMemo(() => {
    if (!id || !slug || (collectionSlug !== 'posts' && collectionSlug !== 'tech-posts')) return null
    return `/${collectionSlug === 'posts' ? 'blog' : 'dev'}/${encodeURIComponent(slug)}/preview`
  }, [id, slug, collectionSlug])

  useEffect(() => {
    const iframe = frameRef.current
    if (!iframe) return
    const p = new MarkdownPreview(iframe, {
      onChange: (next) => changeText(next),
      onEditing: setEditing,
      onScroll: () => syncMdFromPreview(),
    })
    previewRef.current = p
    p.update(textRef.current, mediaRef.current)
    void p.load(previewUrl)
    return () => {
      previewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl])

  useEffect(() => {
    previewRef.current?.update(textRef.current, media)
  }, [media])

  // ---------------------------------------------------------------- スクロールの連動（原文の行番号）
  const buildMirror = useCallback(() => {
    const ta = taRef.current
    if (!ta || !ta.offsetParent) return
    const cs = getComputedStyle(ta)
    const mirror = document.createElement('div')
    mirror.style.cssText =
      'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre-wrap;overflow-wrap:anywhere;box-sizing:border-box;' +
      `width:${ta.clientWidth}px;padding:${cs.padding};font:${cs.font};tab-size:${cs.tabSize}`
    textRef.current.split('\n').forEach((l) => {
      const d = document.createElement('div')
      d.textContent = l || '​'
      mirror.appendChild(d)
    })
    document.body.appendChild(mirror)
    lineTops.current = Array.from(mirror.children).map((c) => (c as HTMLElement).offsetTop)
    mirror.remove()
  }, [])
  const rebuildMirror = useDebounced(buildMirror, 300)
  useEffect(() => {
    rebuildMirror()
  }, [text, view, full, rebuildMirror])

  const lock = (src: 'md' | 'preview') => {
    syncFrom.current = src
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => (syncFrom.current = null), 200)
  }
  const mdLineAtTop = () => {
    const ta = taRef.current
    const tops = lineTops.current
    if (!ta || !tops.length) return 0
    const y = ta.scrollTop + 8
    let lo = 0
    let hi = tops.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (tops[mid] <= y) lo = mid
      else hi = mid - 1
    }
    return lo
  }
  const syncPreviewFromMd = () => {
    if (view !== 'split' || syncFrom.current === 'preview') return
    lock('md')
    previewRef.current?.scrollToLine(mdLineAtTop())
  }
  const syncMdFromPreview = () => {
    if (syncFrom.current === 'md' || !taRef.current) return
    const line = previewRef.current?.lineAtTop() ?? 0
    lock('preview')
    taRef.current.scrollTop = Math.max(0, (lineTops.current[line] ?? 0) - 8)
  }

  /** 表示を切り替えても、同じ場所を開く */
  const switchView = (next: View) => {
    if (previewRef.current?.isEditing) previewRef.current.commit()
    const anchor = view === 'md' ? mdLineAtTop() : (previewRef.current?.lineAtTop() ?? 0)
    setView(next)
    setTimeout(() => {
      buildMirror()
      if (next !== 'preview' && taRef.current) {
        lock('preview')
        taRef.current.scrollTop = Math.max(0, (lineTops.current[anchor] ?? 0) - 8)
      }
      if (next !== 'md') {
        lock('md')
        previewRef.current?.scrollToLine(anchor)
      }
    }, 0)
  }

  // ---------------------------------------------------------------- 画像
  const missing = useMemo(() => {
    const refs = referencedMarkdownImages(text)
    return refs.filter((f) => !media[f] && !media[f.split('/').pop() ?? f])
  }, [text, media])

  const insertAtCursor = (snippet: string) => {
    const ta = taRef.current
    const cur = textRef.current
    const pos = ta && view !== 'preview' ? ta.selectionStart : cur.length
    const before = cur.slice(0, pos)
    const after = cur.slice(pos)
    const pad = (before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '') + snippet + (after.startsWith('\n') ? '\n' : '\n\n')
    changeText(before + pad + after)
  }

  const uploadImages = async (files: FileList | null) => {
    if (!files || !files.length) return
    const added: MarkdownMedia = {}
    try {
      for (const file of Array.from(files)) {
        setBusy(`アップロード中：${file.name}`)
        const name = file.name.replace(/\s+/g, '-')
        const fd = new FormData()
        fd.append('file', file, name)
        fd.append('_payload', JSON.stringify({ alt: name.replace(/\.[^.]+$/, '') }))
        const res = await fetch('/api/media', { method: 'POST', body: fd, credentials: 'include' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.doc?.id) throw new Error(json?.errors?.[0]?.message || json?.message || `アップロードに失敗しました（${res.status}）`)
        added[name] = { id: json.doc.id, url: json.doc.url }
        insertAtCursor(`![${name.replace(/\.[^.]+$/, '')}](./${name})`)
      }
      const next = { ...mediaRef.current, ...added }
      mediaRef.current = next
      setTimeout(() => setMedia(next), 0)
      previewRef.current?.update(textRef.current, next)
      setBusy('')
    } catch (e) {
      setBusy(e instanceof Error ? e.message : String(e))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ---------------------------------------------------------------- 表示
  const label = typeof field?.label === 'string' ? field.label : 'Markdown'
  const fmt = (cmd: 'bold' | 'italic' | 'code' | 'link') => {
    if (cmd === 'link') {
      const url = window.prompt('リンク先の URL')
      if (url) previewRef.current?.format('link', url)
    } else previewRef.current?.format(cmd)
  }

  return (
    <div className="field-type noe-mde-field" style={{ marginBottom: 24 }}>
      <style>{CSS}</style>
      <label className="field-label">{label}</label>
      <div className={`noe-mde view-${view}${full ? ' is-full' : ''}`}>
        <div className="noe-mde__bar">
          <span className="noe-mde__seg" role="group" aria-label="表示">
            {(['md', 'split', 'preview'] as View[]).map((v) => (
              <button key={v} type="button" className={view === v ? 'is-on' : ''} onClick={() => switchView(v)}>
                {v === 'md' ? 'MD' : v === 'split' ? '並べて' : 'プレビュー'}
              </button>
            ))}
          </span>
          {!readOnly && (
            <>
              <button type="button" title="太字" disabled={!editing} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt('bold')}>
                <b>B</b>
              </button>
              <button type="button" title="斜体" disabled={!editing} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt('italic')}>
                <i>I</i>
              </button>
              <button type="button" title="コード" disabled={!editing} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt('code')}>
                {'</>'}
              </button>
              <button type="button" title="リンク" disabled={!editing} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt('link')}>
                リンク
              </button>
              <button type="button" disabled={!editing} onClick={() => previewRef.current?.cancel()}>
                取消
              </button>
              <button type="button" disabled={!editing} onClick={() => previewRef.current?.commit()}>
                確定
              </button>
              <button type="button" onClick={() => fileRef.current?.click()}>
                画像を追加
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void uploadImages(e.target.files)} />
            </>
          )}
          <span className="noe-mde__grow" />
          <span className="noe-mde__hint">
            {busy ||
              (editing
                ? 'Enter で確定 / Shift+Enter で改行 / Esc で取り消し'
                : readOnly
                  ? '読み取り専用'
                  : 'プレビューの段落・見出し・表のセルをクリックすると、その場で書き換えられます')}
          </span>
          <button type="button" onClick={() => setFull((f) => !f)}>
            {full ? '全画面を閉じる' : '全画面'}
          </button>
        </div>
        <div className="noe-mde__body">
          <div className="noe-mde__src">
            <textarea
              ref={taRef}
              value={text}
              readOnly={readOnly}
              spellCheck={false}
              onChange={(e) => changeText(e.target.value)}
              onScroll={syncPreviewFromMd}
            />
          </div>
          <div className="noe-mde__prev">
            <iframe ref={frameRef} title="プレビュー" />
          </div>
        </div>
        {missing.length > 0 && (
          <div className="noe-mde__warn">
            画像が見つかりません（表示されず、保存しても本文から消えません）：{missing.join('、')}。「画像を追加」で同じファイル名の画像を入れてください。
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditorField
