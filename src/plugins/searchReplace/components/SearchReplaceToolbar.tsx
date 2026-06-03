'use client'

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { createPortal } from 'react-dom'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $getNodeByKey,
  $createRangeSelection,
  $setSelection,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isElementNode,
  type LexicalNode,
} from 'lexical'
import { Search, ChevronUp, ChevronDown, X, CaseSensitive } from 'lucide-react'

/**
 * Search & Replace toolbar item for the PayloadCMS v3 Lexical editor.
 *
 * NOTE: The Payload admin panel only loads Payload's own CSS + custom.scss.
 * The project's Tailwind stylesheet is NOT present here, so Tailwind utility
 * classNames do nothing. Everything below uses inline styles + a single
 * injected <style> tag (for :hover / :focus / scrollbar that inline styles
 * can't express). Payload theme CSS variables (var(--theme-*)) work inline.
 *
 * Design decisions:
 * - Matches are computed per single TextNode. A query that spans multiple
 *   adjacent text nodes (e.g. across a bold boundary) is intentionally not
 *   matched — this keeps offsets unambiguous and replacement safe.
 * - The current/all matches are highlighted with a custom OVERLAY layer
 *   (absolutely positioned divs measured via DOM Range.getClientRects),
 *   NOT by mutating the Lexical selection. Setting the editor selection
 *   would steal focus from the search input on every keystroke, so we avoid
 *   it during navigation. Replace deliberately uses a RangeSelection.
 */

const ACCENT = '#E2FF3D'

const CSS = `
.sr-btn{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 6px;background:transparent;border:none;border-radius:4px;color:var(--theme-text);cursor:pointer;font-size:11px;line-height:1;user-select:none;transition:background-color .1s ease,color .1s ease;}
.sr-btn:hover{background:var(--theme-elevation-100);}
.sr-btn[data-open="true"]{background:var(--theme-elevation-100);color:${ACCENT};}
.sr-panel{position:absolute;left:0;top:100%;margin-top:3px;width:300px;background:var(--theme-elevation-50);border:1px solid var(--theme-elevation-150);border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.55);z-index:10000;padding:10px;display:flex;flex-direction:column;gap:7px;}
.sr-row{display:flex;align-items:center;gap:6px;}
.sr-input{box-sizing:border-box;flex:1;min-width:0;height:28px;background:var(--theme-elevation-100);border:1px solid var(--theme-elevation-150);border-radius:4px;padding:0 8px;font-size:12px;color:var(--theme-text);outline:none;transition:border-color .1s ease;}
.sr-input:focus{border-color:${ACCENT};}
.sr-count{font-family:monospace;font-size:11px;color:var(--theme-text);opacity:.6;white-space:nowrap;font-variant-numeric:tabular-nums;flex-shrink:0;min-width:46px;text-align:center;}
.sr-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;flex-shrink:0;background:transparent;border:none;border-radius:4px;color:var(--theme-text);cursor:pointer;transition:background-color .1s ease,color .1s ease;}
.sr-icon-btn:hover:not(:disabled){background:var(--theme-elevation-100);}
.sr-icon-btn:disabled{opacity:.3;cursor:default;}
.sr-icon-btn[data-active="true"]{background:var(--theme-elevation-100);color:${ACCENT};}
.sr-text-btn{display:inline-flex;align-items:center;justify-content:center;height:28px;padding:0 10px;flex-shrink:0;background:var(--theme-elevation-100);border:1px solid var(--theme-elevation-150);border-radius:4px;color:var(--theme-text);cursor:pointer;font-size:11px;font-weight:600;line-height:1;white-space:nowrap;transition:background-color .1s ease,color .1s ease;}
.sr-text-btn:hover:not(:disabled){background:var(--theme-elevation-150);color:${ACCENT};}
.sr-text-btn:disabled{opacity:.35;cursor:default;}
.sr-hl{position:fixed;pointer-events:none;border-radius:2px;background:rgba(226,255,61,.22);z-index:9998;}
.sr-hl[data-current="true"]{background:rgba(226,255,61,.42);outline:1px solid ${ACCENT};}
`

function useInjectStyles() {
  useEffect(() => {
    let el = document.head.querySelector<HTMLStyleElement>('style[data-searchreplace-toolbar]')
    if (!el) {
      el = document.createElement('style')
      el.setAttribute('data-searchreplace-toolbar', '')
      document.head.appendChild(el)
    }
    if (el.textContent !== CSS) el.textContent = CSS
  }, [])
}

type Match = { key: string; start: number; end: number }

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Descend firstChild until reaching the (single) #text node Lexical renders
// for a TextNode, transparently skipping format wrappers (<strong>, <em>, …).
function firstTextNode(el: Node | null): Text | null {
  let n: Node | null = el
  while (n && n.nodeType !== Node.TEXT_NODE) n = n.firstChild
  return n && n.nodeType === Node.TEXT_NODE ? (n as Text) : null
}

export function SearchReplaceToolbarItem() {
  useInjectStyles()
  const [editor] = useLexicalComposerContext()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [, forceRerender] = useReducer((x) => x + 1, 0)

  const searchRef = useRef<HTMLInputElement>(null)

  // ── Match computation (per single TextNode) ────────────────────
  const recompute = useCallback(() => {
    if (!query) {
      setMatches([])
      return
    }
    const found: Match[] = []
    editor.getEditorState().read(() => {
      const needle = caseSensitive ? query : query.toLowerCase()
      const visit = (node: LexicalNode) => {
        if ($isTextNode(node)) {
          const text = node.getTextContent()
          const hay = caseSensitive ? text : text.toLowerCase()
          let i = hay.indexOf(needle)
          while (i !== -1) {
            found.push({ key: node.getKey(), start: i, end: i + query.length })
            i = hay.indexOf(needle, i + needle.length)
          }
        } else if ($isElementNode(node)) {
          node.getChildren().forEach(visit)
        }
      }
      visit($getRoot())
    })
    setMatches(found)
  }, [editor, query, caseSensitive])

  // Recompute when the query / flags change while open.
  useEffect(() => {
    if (open) recompute()
  }, [open, recompute])

  // Keep matches & overlay in sync with editor edits + scroll/resize.
  useEffect(() => {
    if (!open) return
    const rerender = () => forceRerender()
    window.addEventListener('scroll', rerender, true)
    window.addEventListener('resize', rerender)
    const unregister = editor.registerUpdateListener(() => {
      recompute()
      forceRerender()
    })
    return () => {
      window.removeEventListener('scroll', rerender, true)
      window.removeEventListener('resize', rerender)
      unregister()
    }
  }, [open, editor, recompute])

  // Clamp the cursor when the match set shrinks.
  useEffect(() => {
    if (currentIndex >= matches.length) setCurrentIndex(0)
  }, [matches.length, currentIndex])

  // Focus the search field whenever the panel opens.
  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  // ── Global shortcut: Cmd/Ctrl+H toggles the panel ──────────────
  // (Registered only on the fixed toolbar — see feature.client — so the
  //  listener is mounted exactly once and the toggle never double-fires.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // ── Navigation ─────────────────────────────────────────────────
  const goTo = useCallback(
    (index: number) => {
      if (!matches.length) return
      const i = ((index % matches.length) + matches.length) % matches.length
      setCurrentIndex(i)
      const el = editor.getElementByKey(matches[i].key)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      forceRerender()
    },
    [matches, editor],
  )

  // ── Replace ────────────────────────────────────────────────────
  const replaceCurrent = useCallback(() => {
    const m = matches[currentIndex]
    if (!m) return
    editor.update(() => {
      const node = $getNodeByKey(m.key)
      if (!$isTextNode(node)) return
      const sel = $createRangeSelection()
      sel.anchor.set(m.key, m.start, 'text')
      sel.focus.set(m.key, m.end, 'text')
      $setSelection(sel)
      const s = $getSelection()
      if ($isRangeSelection(s)) s.insertText(replacement)
    })
    // Keep the user in the panel for repeated replacements.
    setTimeout(() => searchRef.current?.focus(), 0)
  }, [editor, matches, currentIndex, replacement])

  const replaceAll = useCallback(() => {
    if (!query) return
    editor.update(() => {
      const re = new RegExp(escapeRegExp(query), caseSensitive ? 'g' : 'gi')
      const visit = (node: LexicalNode) => {
        if ($isTextNode(node)) {
          const t = node.getTextContent()
          re.lastIndex = 0
          if (re.test(t)) {
            re.lastIndex = 0
            node.setTextContent(t.replace(re, replacement))
          }
        } else if ($isElementNode(node)) {
          node.getChildren().forEach(visit)
        }
      }
      visit($getRoot())
    })
    setTimeout(() => searchRef.current?.focus(), 0)
  }, [editor, query, replacement, caseSensitive])

  // ── Overlay highlights (measured live each render) ─────────────
  const renderOverlay = () => {
    if (!open || !matches.length || typeof document === 'undefined') return null
    const rects: { rect: DOMRect; current: boolean; idx: number; r: number }[] = []
    matches.forEach((m, idx) => {
      const el = editor.getElementByKey(m.key)
      const textNode = firstTextNode(el)
      if (!textNode) return
      const len = textNode.textContent?.length ?? 0
      if (m.start > len || m.end > len) return
      const range = document.createRange()
      try {
        range.setStart(textNode, m.start)
        range.setEnd(textNode, m.end)
      } catch {
        return
      }
      Array.from(range.getClientRects()).forEach((rect, r) => {
        rects.push({ rect, current: idx === currentIndex, idx, r })
      })
    })
    return createPortal(
      <>
        {rects.map(({ rect, current, idx, r }) => (
          <div
            key={`${idx}-${r}`}
            className="sr-hl"
            data-current={current}
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          />
        ))}
      </>,
      document.body,
    )
  }

  const counter = matches.length ? `${currentIndex + 1} / ${matches.length}` : query ? '0 / 0' : ''

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="sr-btn"
        data-open={open}
        onClick={() => setOpen((o) => !o)}
        title="検索・置換（Cmd/Ctrl+H）"
      >
        <Search size={14} />
        <ChevronDown className="sr-caret" size={10} style={{ opacity: 0.35 }} />
      </button>

      {open && (
        <div
          className="sr-panel"
          // Keep editor selection / focus untouched when interacting with the panel.
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Search row */}
          <div className="sr-row">
            <input
              ref={searchRef}
              type="text"
              className="sr-input"
              placeholder="検索..."
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  goTo(e.shiftKey ? currentIndex - 1 : currentIndex + 1)
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  setOpen(false)
                }
              }}
            />
            <span className="sr-count">{counter}</span>
            <button
              type="button"
              className="sr-icon-btn"
              title="大文字・小文字を区別"
              data-active={caseSensitive}
              onClick={() => setCaseSensitive((v) => !v)}
            >
              <CaseSensitive size={16} />
            </button>
          </div>

          {/* Replace row */}
          <div className="sr-row">
            <input
              type="text"
              className="sr-input"
              placeholder="置換後..."
              spellCheck={false}
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setOpen(false)
                }
              }}
            />
            <button
              type="button"
              className="sr-text-btn"
              disabled={!matches.length}
              onClick={replaceCurrent}
            >
              置換
            </button>
            <button
              type="button"
              className="sr-text-btn"
              disabled={!matches.length}
              onClick={replaceAll}
            >
              全置換
            </button>
          </div>

          {/* Nav row */}
          <div className="sr-row" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="sr-icon-btn"
              title="前へ（Shift+Enter）"
              disabled={!matches.length}
              onClick={() => goTo(currentIndex - 1)}
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              className="sr-icon-btn"
              title="次へ（Enter）"
              disabled={!matches.length}
              onClick={() => goTo(currentIndex + 1)}
            >
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              className="sr-icon-btn"
              title="閉じる（Esc）"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {renderOverlay()}
    </div>
  )
}
