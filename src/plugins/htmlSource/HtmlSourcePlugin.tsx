/**
 * HtmlSourcePlugin.tsx
 *
 * Lexical Editor に差し込む React プラグイン。
 * ツールバーの「<>」ボタンと Textarea の表示制御を担う。
 * (親コンポーネントによって制御される Controlled Component)
 */

'use client'

import { useEffect, useRef } from 'react'

// ----------------------------------------------------------------
// CSS（インライン — Payload の CSS 変数を参照）
// ----------------------------------------------------------------

const STYLES = {
  wrapper: {
    position: 'relative' as const,
    width: '100%',
    zIndex: 10,
  },
  textarea: {
    width: '100%',
    height: 'calc(100vh - 180px)',
    fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '16px',
    border: '1px solid var(--theme-elevation-150, #444)',
    borderRadius: '4px',
    background: 'var(--theme-elevation-50, #1a1a1a)',
    color: 'var(--theme-text, #e0e0e0)',
    resize: 'vertical' as const,
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginTop: '8px',
    overflowY: 'auto' as const,
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
  },
  errorBanner: {
    marginTop: '6px',
    padding: '8px 12px',
    background: 'rgba(220,53,69,.15)',
    border: '1px solid rgba(220,53,69,.5)',
    borderRadius: '4px',
    color: '#ff6b6b',
    fontSize: '13px',
  },
} as const

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

interface HtmlSourcePluginProps {
  isSourceMode: boolean
  htmlValue: string
  onHtmlChange: (val: string) => void
  parseError?: string | null
}

export function HtmlSourcePlugin({
  isSourceMode,
  htmlValue,
  onHtmlChange,
  parseError,
}: HtmlSourcePluginProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isSourceMode) {
      // フォーカスを textarea へ移す
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [isSourceMode])

  if (!isSourceMode) return null

  return (
    <div style={STYLES.wrapper}>
      <textarea
        ref={textareaRef}
        style={STYLES.textarea}
        value={htmlValue}
        onChange={(e) => onHtmlChange(e.target.value)}
        spellCheck={false}
        aria-label="HTML source editor"
        placeholder="<!-- ここに HTML を入力 -->"
      />
      {parseError && <div style={STYLES.errorBanner}>{parseError}</div>}
    </div>
  )
}

// ----------------------------------------------------------------
// Toolbar Button (別コンポーネントとして export)
// ----------------------------------------------------------------

interface ToolbarButtonProps {
  isSourceMode: boolean
  onToggle: () => void
}

export function HtmlSourceToolbarButton({
  isSourceMode,
  onToggle,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={isSourceMode ? 'リッチテキストに戻る' : 'HTMLソースを編集'}
      title={isSourceMode ? 'Rich Text (Ctrl+Shift+H)' : 'HTML Source (Ctrl+Shift+H)'}
      onClick={onToggle}
      className={`payload-html-source-button ${isSourceMode ? 'active' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        width: '32px',
        height: '32px',
        padding: '0',
        borderRadius: '4px',
        border: 'none',
        background: isSourceMode
          ? 'var(--theme-elevation-200, #333)'
          : 'transparent',
        color: isSourceMode
          ? 'var(--theme-success-500, #4caf50)'
          : 'var(--theme-text, #e0e0e0)',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        transition: 'all .15s ease',
      }}
    >
      {'</>'}
    </button>
  )
}
