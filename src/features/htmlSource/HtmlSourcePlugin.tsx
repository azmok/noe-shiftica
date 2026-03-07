/**
 * HtmlSourcePlugin.tsx
 *
 * Lexical Editor に差し込む React プラグイン。
 * ツールバーの「<>」ボタンと Textarea の表示制御を担う。
 */

'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useEffect, useRef, useState } from 'react'

import { htmlToLexical, lexicalToHtml } from './conversion'

// ----------------------------------------------------------------
// CSS（インライン — Payload の CSS 変数を参照）
// ----------------------------------------------------------------

const STYLES = {
  wrapper: {
    position: 'relative' as const,
    width: '100%',
  },
  textarea: {
    width: '100%',
    minHeight: '320px',
    fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '12px',
    border: '2px solid var(--theme-elevation-150, #444)',
    borderRadius: '4px',
    background: 'var(--theme-elevation-50, #1a1a1a)',
    color: 'var(--theme-text, #e0e0e0)',
    resize: 'vertical' as const,
    outline: 'none',
    boxSizing: 'border-box' as const,
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
  /** ソースモード開始 / 終了イベントを親に通知したい場合 */
  onModeChange?: (isSource: boolean) => void
}

export function HtmlSourcePlugin({ onModeChange }: HtmlSourcePluginProps) {
  const [editor] = useLexicalComposerContext()
  const [isSourceMode, setIsSourceMode] = useState(false)
  const [htmlValue, setHtmlValue] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ----------------------------------------------------------------
  // ソースモード ON: Lexical → HTML
  // ----------------------------------------------------------------
  const enterSourceMode = useCallback(() => {
    console.group('[HtmlSource] ══ enterSourceMode ══')
    try {
      const html = lexicalToHtml(editor)
      setHtmlValue(html)
      setParseError(null)
      setIsSourceMode(true)
      onModeChange?.(true)
      console.log('[HtmlSource] textarea populated, chars:', html.length)
    } catch (err) {
      console.error('[HtmlSource] enterSourceMode failed:', err)
    }
    console.groupEnd()
  }, [editor, onModeChange])

  // ----------------------------------------------------------------
  // ソースモード OFF: HTML → Lexical
  // ----------------------------------------------------------------
  const exitSourceMode = useCallback(() => {
    console.group('[HtmlSource] ══ exitSourceMode ══')
    setParseError(null)

    try {
      editor.update(
        () => {
          htmlToLexical(editor, htmlValue)
        },
        {
          onUpdate: () => {
            console.log('[HtmlSource] editor.update() completed successfully')
            console.groupEnd()
          },
        },
      )
      setIsSourceMode(false)
      onModeChange?.(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[HtmlSource] exitSourceMode failed:', err)
      setParseError(`パースエラー: ${msg}`)
      console.groupEnd()
    }
  }, [editor, htmlValue, onModeChange])

  // ----------------------------------------------------------------
  // ソースモード時は Textarea のみレンダリング
  // ----------------------------------------------------------------
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
        onChange={(e) => setHtmlValue(e.target.value)}
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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '4px',
        border: isSourceMode
          ? '1.5px solid var(--theme-success-500, #4caf50)'
          : '1.5px solid transparent',
        background: isSourceMode
          ? 'rgba(76,175,80,.15)'
          : 'transparent',
        color: 'var(--theme-text, #e0e0e0)',
        cursor: 'pointer',
        fontSize: '13px',
        fontFamily: 'monospace',
        transition: 'all .15s ease',
      }}
    >
      {'</>'}
    </button>
  )
}
