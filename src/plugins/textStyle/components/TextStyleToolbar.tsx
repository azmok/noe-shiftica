'use client'

import React, { useState, useEffect, useRef, CSSProperties } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection } from 'lexical'
import { $patchStyleText, $getSelectionStyleValueForProperty } from '@lexical/selection'
import { Trash2, ChevronDown, Check } from 'lucide-react'

/**
 * NOTE: The Payload admin panel only loads Payload's own CSS + custom.scss.
 * The project's Tailwind stylesheet is NOT present here, so Tailwind utility
 * classNames do nothing. Everything below uses inline styles + a single
 * injected <style> tag (for :hover / scrollbar that inline styles can't do).
 * Payload theme CSS variables (var(--theme-*)) work fine inline.
 */

const ACCENT = '#E2FF3D'

// 選択ハイライトの見え方。
//
// 目的: 選択中でも「変更後の文字色／グラデーション」を正確に見たい。
//
// 重要な仕様: ブラウザは選択時、::selection で color を指定しないと
//   既定の文字色で上書きする（＝黒/白に反転して色が潰れる）。これが
//   「選択すると色が見えない」元凶。よって color を currentColor に固定し、
//   「その要素自身に設定された色」をそのまま使わせる。-webkit-text-fill-color
//   も同様に固定することで、グラデ文字（fill:transparent + background-clip:text）
//   も透明扱いが維持され崩れない。
//
// SELECTION_BG  : 選択範囲の背景。薄いグレーで「選択中」を示す。
// SELECTION_TEXT: 選択中の文字色。'currentColor' で本来の色を維持。
//   （'transparent' や固定色に変えて挙動を試すことも可能）
const SELECTION_BG = 'rgba(128, 128, 128, 0.1)' // グレー / 透過度 0.1
const SELECTION_TEXT = 'currentColor'

// ── Data ────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#FFFFFF', '#D4D4D4', '#737373', '#404040', '#262626', '#000000',
  '#FF8787', '#FF6B6B', '#EF4444', '#FF922B', '#FCC419', ACCENT,
  '#6EE7B7', '#34D399', '#10B981', '#20C997', '#22D3EE', '#0EA5E9',
  '#93C5FD', '#60A5FA', '#4DABF7', '#3B82F6', '#4C6EF5', '#5C7CFA',
  '#E879F9', '#C084FC', '#A855F7', '#AE3EC9', '#9333EA', '#DD2476',
]

const PRESET_GRADIENTS = [
  { name: 'Sunset',     css: 'linear-gradient(90deg, #FF512F, #DD2476)' },
  { name: 'Neon Dream', css: 'linear-gradient(90deg, #7F00FF, #E100FF)' },
  { name: 'Ocean',      css: 'linear-gradient(90deg, #00C6FF, #0072FF)' },
  { name: 'Aurora',     css: 'linear-gradient(90deg, #11998e, #38ef7d)' },
  { name: 'Gold',       css: 'linear-gradient(90deg, #BF953F 0%, #FCF6BA 40%, #B38728 100%)' },
  { name: 'Cyber',      css: 'linear-gradient(90deg, #FF007F 0%, #7F00FF 50%, #00F0FF 100%)' },
]

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64', '72']

// ── Injected stylesheet (hover / scrollbar) ─────────────────────

const CSS = `
.ts-btn{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 6px;background:transparent;border:none;border-radius:4px;color:var(--theme-text);cursor:pointer;font-size:11px;line-height:1;user-select:none;transition:background-color .1s ease,color .1s ease;}
.ts-btn:hover{background:var(--theme-elevation-100);}
.ts-btn[data-open="true"]{background:var(--theme-elevation-100);color:${ACCENT};}
.ts-btn-clear:hover{color:#f87171;}
.ts-caret{opacity:.35;transition:transform .15s ease;flex-shrink:0;}
.ts-btn[data-open="true"] .ts-caret{transform:rotate(180deg);}
.ts-panel{position:absolute;left:0;top:100%;margin-top:3px;background:var(--theme-elevation-50);border:1px solid var(--theme-elevation-150);border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.55);z-index:9999;}
.ts-scroll{overflow-y:auto;overscroll-behavior:contain;}
.ts-scroll::-webkit-scrollbar{width:8px;}
.ts-scroll::-webkit-scrollbar-thumb{background:var(--theme-elevation-200);border-radius:8px;border:2px solid var(--theme-elevation-50);}
.ts-scroll::-webkit-scrollbar-track{background:transparent;}
.ts-size-item{display:flex;align-items:center;justify-content:space-between;width:100%;box-sizing:border-box;padding:6px 12px;background:transparent;border:none;cursor:pointer;font-family:monospace;font-size:12px;color:var(--theme-text);transition:background-color .08s ease;}
.ts-size-item:hover{background:var(--theme-elevation-100);}
.ts-size-item[data-active="true"]{color:${ACCENT};font-weight:700;background:var(--theme-elevation-100);}
.ts-swatch{box-sizing:border-box;width:26px;height:26px;border-radius:4px;border:1px solid rgba(255,255,255,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:transform .08s ease;}
.ts-swatch:hover{transform:scale(1.12);}
.ts-swatch:active{transform:scale(.94);}
.ts-grad-bar{box-sizing:border-box;width:100%;height:24px;border-radius:4px;border:1px solid transparent;cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:0 8px;transition:transform .08s ease;}
.ts-grad-bar:hover{transform:scale(1.015);}
.ts-hex{box-sizing:border-box;height:26px;background:var(--theme-elevation-100);border:1px solid var(--theme-elevation-150);border-radius:4px;padding:0 8px;font-family:monospace;font-size:11px;color:var(--theme-text);outline:none;transition:border-color .1s ease;}
.ts-hex:focus{border-color:${ACCENT};}
.ts-range{flex:1;height:3px;cursor:pointer;accent-color:${ACCENT};}

/* Lexical 編集領域内の選択ハイライト。
   薄グレー背景＋文字色を currentColor で固定し、選択中も本来の色を保つ。 */
.ContentEditable__root ::selection,
.ContentEditable__root::selection,
[data-lexical-editor="true"] ::selection,
[data-lexical-editor="true"]::selection{background-color:${SELECTION_BG} !important;color:${SELECTION_TEXT} !important;-webkit-text-fill-color:${SELECTION_TEXT} !important;}
.ContentEditable__root ::-moz-selection,
.ContentEditable__root::-moz-selection,
[data-lexical-editor="true"] ::-moz-selection,
[data-lexical-editor="true"]::-moz-selection{background-color:${SELECTION_BG} !important;color:${SELECTION_TEXT} !important;}
`

let injected = false
function useInjectStyles() {
  useEffect(() => {
    if (injected) return
    injected = true
    const el = document.createElement('style')
    el.setAttribute('data-textstyle-toolbar', '')
    el.textContent = CSS
    document.head.appendChild(el)
  }, [])
}

// ── Shared helpers ───────────────────────────────────────────────

function applyStyle(editor: any, styles: Record<string, string>) {
  editor.update(() => {
    const sel = $getSelection()
    if ($isRangeSelection(sel)) $patchStyleText(sel, styles)
  })
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  const cb = useRef(onClose)
  cb.current = onClose
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [ref])
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.58
}

const wrapStyle: CSSProperties = { position: 'relative', display: 'inline-flex' }

// ── 1. FontSizeToolbarItem ────────────────────────────────────────

export function FontSizeToolbarItem() {
  useInjectStyles()
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [size, setSize] = useState('16px')
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setIsOpen(false))

  useEffect(() => editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => {
      const sel = $getSelection()
      if ($isRangeSelection(sel))
        setSize($getSelectionStyleValueForProperty(sel, 'font-size', '16px'))
    })
  }), [editor])

  const current = size.replace('px', '')

  // Photoshop-like: scroll the active size into view when opening
  useEffect(() => {
    if (!isOpen || !listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]') as HTMLElement | null
    if (active) active.scrollIntoView({ block: 'center' })
  }, [isOpen])

  return (
    <div style={wrapStyle} ref={ref}>
      <button
        type="button"
        className="ts-btn"
        data-open={isOpen}
        onClick={() => setIsOpen(v => !v)}
        title="フォントサイズ"
      >
        <span style={{ fontSize: 10, opacity: 0.4, fontFamily: 'monospace' }}>T</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 600, minWidth: 18, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
          {current}
        </span>
        <ChevronDown className="ts-caret" size={10} />
      </button>

      {isOpen && (
        <div className="ts-panel ts-scroll" ref={listRef} style={{ width: 66, maxHeight: 220, padding: '4px 0' }}>
          {FONT_SIZES.map(s => (
            <button
              key={s}
              type="button"
              className="ts-size-item"
              data-active={current === s}
              onClick={() => { applyStyle(editor, { 'font-size': `${s}px` }); setIsOpen(false) }}
            >
              <span>{s}</span>
              {current === s && <Check size={11} style={{ flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 2. TextColorToolbarItem ───────────────────────────────────────

export function TextColorToolbarItem() {
  useInjectStyles()
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [color, setColor] = useState('')
  const [hex, setHex] = useState('#ffffff')
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setIsOpen(false))

  useEffect(() => editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => {
      const sel = $getSelection()
      if ($isRangeSelection(sel)) {
        const v = $getSelectionStyleValueForProperty(sel, 'color', '')
        setColor(v)
        if (v.startsWith('#')) setHex(v)
      }
    })
  }), [editor])

  const applyColor = (c: string) => applyStyle(editor, {
    color: c,
    'background-image': '',
    'background-clip': '',
    '-webkit-background-clip': '',
    '-webkit-text-fill-color': '',
  })

  return (
    <div style={wrapStyle} ref={ref}>
      <button
        type="button"
        className="ts-btn"
        data-open={isOpen}
        onClick={() => setIsOpen(v => !v)}
        title="文字カラー"
      >
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, lineHeight: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 13, lineHeight: 1, color: isOpen ? ACCENT : 'var(--theme-text)' }}>A</span>
          <span style={{ width: 14, height: 2, borderRadius: 2, background: color || 'var(--theme-text)' }} />
        </span>
        <ChevronDown className="ts-caret" size={10} />
      </button>

      {isOpen && (
        <div className="ts-panel" style={{ width: 188, padding: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, marginBottom: 10 }}>
            {PRESET_COLORS.map(c => {
              const active = color.toLowerCase() === c.toLowerCase()
              return (
                <button
                  key={c}
                  type="button"
                  className="ts-swatch"
                  onClick={() => applyColor(c)}
                  title={c}
                  style={{ background: c, borderColor: active ? ACCENT : 'rgba(255,255,255,.08)' }}
                >
                  {active && <Check size={12} style={{ color: isLight(c) ? '#000' : '#fff' }} />}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid var(--theme-elevation-150)' }}>
            <div style={{ position: 'relative', width: 26, height: 26, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--theme-elevation-200)', flexShrink: 0 }}>
              <span style={{ position: 'absolute', inset: 0, background: hex }} />
              <input
                type="color"
                value={hex}
                onChange={e => { setHex(e.target.value); applyColor(e.target.value) }}
                style={{ position: 'absolute', inset: 0, width: '200%', height: '200%', transform: 'translate(-25%,-25%)', cursor: 'pointer', opacity: 0, border: 'none' }}
              />
            </div>
            <input
              type="text"
              className="ts-hex"
              value={hex}
              spellCheck={false}
              onChange={e => {
                setHex(e.target.value)
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) applyColor(e.target.value)
              }}
              onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
              placeholder="#ffffff"
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── 3. TextGradientToolbarItem ─────────────────────────────────────

export function TextGradientToolbarItem() {
  useInjectStyles()
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [activeGrad, setActiveGrad] = useState('')
  const [c1, setC1] = useState('#7f00ff')
  const [c2, setC2] = useState('#e100ff')
  const [deg, setDeg] = useState(90)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setIsOpen(false))

  useEffect(() => editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => {
      const sel = $getSelection()
      if ($isRangeSelection(sel))
        setActiveGrad($getSelectionStyleValueForProperty(sel, 'background-image', ''))
    })
  }), [editor])

  const applyGrad = (css: string) => applyStyle(editor, {
    'background-image': css,
    'background-clip': 'text',
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
    color: 'transparent',
  })

  const customCss = `linear-gradient(${deg}deg, ${c1}, ${c2})`
  const hasGrad = activeGrad.includes('gradient')

  return (
    <div style={wrapStyle} ref={ref}>
      <button
        type="button"
        className="ts-btn"
        data-open={isOpen}
        onClick={() => setIsOpen(v => !v)}
        title="グラデーションテキスト"
      >
        <span style={{ width: 18, height: 10, borderRadius: 2, background: hasGrad ? activeGrad : PRESET_GRADIENTS[0].css, opacity: hasGrad ? 1 : 0.6, flexShrink: 0 }} />
        <ChevronDown className="ts-caret" size={10} />
      </button>

      {isOpen && (
        <div className="ts-panel" style={{ width: 222, padding: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {PRESET_GRADIENTS.map(g => {
              const active = activeGrad.replace(/\s+/g, '') === g.css.replace(/\s+/g, '')
              return (
                <button
                  key={g.css}
                  type="button"
                  className="ts-grad-bar"
                  onClick={() => applyGrad(g.css)}
                  style={{ background: g.css, borderColor: active ? ACCENT : 'transparent' }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.85)' }}>{g.name}</span>
                  {active && <Check size={11} style={{ color: '#fff', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.6))' }} />}
                </button>
              )
            })}
          </div>

          <div style={{ paddingTop: 9, marginTop: 8, borderTop: '1px solid var(--theme-elevation-150)', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {([{ val: c1, set: setC1 }, { val: c2, set: setC2 }] as const).map(({ val, set }, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4, height: 26, background: 'var(--theme-elevation-100)', border: '1px solid var(--theme-elevation-150)', borderRadius: 4, padding: '0 4px' }}>
                  <div style={{ position: 'relative', width: 16, height: 16, borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', inset: 0, background: val }} />
                    <input
                      type="color"
                      value={val}
                      onChange={e => set(e.target.value)}
                      style={{ position: 'absolute', inset: 0, width: '200%', height: '200%', transform: 'translate(-25%,-25%)', cursor: 'pointer', opacity: 0, border: 'none' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={val}
                    onChange={e => set(e.target.value)}
                    style={{ width: '100%', minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 9, fontFamily: 'monospace', color: 'var(--theme-text)', padding: 0 }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--theme-text)', opacity: 0.45, flexShrink: 0 }}>角度</span>
              <input type="range" className="ts-range" min={0} max={360} value={deg} onChange={e => setDeg(Number(e.target.value))} />
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--theme-text)', opacity: 0.6, width: 28, textAlign: 'right', flexShrink: 0 }}>{deg}°</span>
            </div>

            <button
              type="button"
              onClick={() => applyGrad(customCss)}
              style={{ width: '100%', height: 24, borderRadius: 4, border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.85)', background: customCss }}
            >
              カスタムを適用
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 4. ClearStyleToolbarItem ──────────────────────────────────────

export function ClearStyleToolbarItem() {
  useInjectStyles()
  const [editor] = useLexicalComposerContext()
  return (
    <button
      type="button"
      className="ts-btn ts-btn-clear"
      onClick={() => applyStyle(editor, {
        'font-size': '',
        color: '',
        'background-image': '',
        'background-clip': '',
        '-webkit-background-clip': '',
        '-webkit-text-fill-color': '',
      })}
      title="装飾クリア"
    >
      <Trash2 size={14} style={{ opacity: 0.6 }} />
    </button>
  )
}
