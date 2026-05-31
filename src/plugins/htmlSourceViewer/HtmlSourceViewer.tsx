/**
 * HtmlSourceViewer.tsx
 *
 * Lexical Editor に差し込む React プラグイン。
 * ツールバーの「<>」ボタンと Monaco Editor の表示制御を担う。
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { HTMLHint } from 'htmlhint'
import { html as beautifyHtml } from 'js-beautify'
import { Sparkles } from 'lucide-react'

// Monaco Editor is dynamic-loaded to avoid SSR issues
const MonacoEditor = dynamic(
  async () => {
    const { default: Editor } = await import('@monaco-editor/react')
    return Editor
  },
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '500px',
          background: 'var(--theme-elevation-50, #1a1a1a)',
          borderRadius: '4px',
          border: '1px solid var(--theme-elevation-150, #444)',
        }}
      />
    ),
  }
)

// ----------------------------------------------------------------
// CSS（インライン — Payload の CSS 変数を参照）
// ----------------------------------------------------------------

const STYLES = {
  wrapper: {
    position: 'relative' as const,
    width: '100%',
    zIndex: 10,
    marginTop: '8px',
  },
  editorContainer: {
    width: '100%',
    height: '500px',
    border: '1px solid var(--theme-elevation-150, #444)',
    borderRadius: '4px',
    overflow: 'hidden',
    background: 'var(--theme-elevation-50, #1a1a1a)',
  },
  errorBanner: {
    marginTop: '12px',
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
  },
} as const

// ----------------------------------------------------------------
// Syntax Error Detail Interface & Verification
// ----------------------------------------------------------------

interface SyntaxErrorDetail {
  line: number
  col: number
  message: string
}

function verifyHtml(html: string): SyntaxErrorDetail[] {
  if (!html.trim()) return []
  try {
    const messages = HTMLHint.verify(html, {
      'tagname-lowercase': true,
      'attr-lowercase': true,
      'attr-value-double-quotes': true,
      'tag-pair': true,
      'spec-char-escape': true,
      'id-unique': true,
      'src-not-empty': true,
      'attr-no-duplication': true,
    })
    return messages.map((msg) => ({
      line: msg.line,
      col: msg.col,
      message: msg.message,
    }))
  } catch (err) {
    console.error('HTMLHint verification failed:', err)
    return []
  }
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

interface HtmlSourceViewerProps {
  isSourceMode: boolean
  htmlValue: string
  onHtmlChange: (val: string) => void
  parseError?: string | null
}

export function HtmlSourceViewer({
  isSourceMode,
  htmlValue,
  onHtmlChange,
  parseError,
}: HtmlSourceViewerProps) {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark')
  const [errors, setErrors] = useState<SyntaxErrorDetail[]>([])

  // 1. Auto Theme Switching matching Payload's current theme state
  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark'
      setTheme(currentTheme === 'dark' ? 'vs-dark' : 'light')
    }
    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    })

    return () => observer.disconnect()
  }, [])

  // 2. Real-time Syntax Checking and Monaco Model Markers
  useEffect(() => {
    if (!isSourceMode) return

    const validationErrors = verifyHtml(htmlValue)
    setErrors(validationErrors)

    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        const markers = validationErrors.map((err) => ({
          startLineNumber: err.line,
          startColumn: err.col,
          endLineNumber: err.line,
          endColumn: err.col + 1,
          message: err.message,
          severity: monacoRef.current.MarkerSeverity.Error,
        }))
        monacoRef.current.editor.setModelMarkers(model, 'htmlhint', markers)
      }
    }
  }, [htmlValue, isSourceMode])

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Make sure we run initial lint markers on mount
    const validationErrors = verifyHtml(htmlValue)
    setErrors(validationErrors)
    const model = editor.getModel()
    if (model) {
      const markers = validationErrors.map((err) => ({
        startLineNumber: err.line,
        startColumn: err.col,
        endLineNumber: err.line,
        endColumn: err.col + 1,
        message: err.message,
        severity: monaco.MarkerSeverity.Error,
      }))
      monaco.editor.setModelMarkers(model, 'htmlhint', markers)
    }
  }

  // 3. Trigger active HTML formatting using js-beautify with tag separation pre-processing
  const handleFormat = () => {
    if (!htmlValue) return
    try {
      // Robust pre-processor to break block/inline tags and self-closing tags (like <br>) into distinct lines
      // so js-beautify can run its nesting logic with 100% accuracy.
      const preprocessed = htmlValue
        // 1. Insert newline after any closing tag
        .replace(/(<\/[-_a-zA-Z0-9]+>)/g, '$1\n')
        // 2. Insert newline before any opening tag (avoid duplicating if already done)
        .replace(/(<[-_a-zA-Z0-9]+(?:\s+[^>]*)*>)/g, '\n$1')
        // 3. Guarantee separate lines around br, hr, and img self-closing tags
        .replace(/(<(?:br|hr|img)\s*\/?>)/gi, '\n$1\n')
        // 4. Clean up excessive whitespaces/duplicate blank lines
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .join('\n')

      const formatted = beautifyHtml(preprocessed, {
        indent_size: 2,
        wrap_line_length: 120,
        preserve_newlines: false,
        indent_inner_html: true,
        extra_liners: [],
        inline: [],      // Force inline elements (like span, a, strong) to break and indent
        unformatted: [], // Prevent any element from dodging formatting rules
      })
      if (formatted) {
        onHtmlChange(formatted)
      }
    } catch (err) {
      console.error('HTML formatting failed:', err)
    }
  }

  if (!isSourceMode) return null

  return (
    <div style={STYLES.wrapper}>
      <div style={STYLES.editorContainer}>
        <MonacoEditor
          height="100%"
          language="html"
          theme={theme}
          value={htmlValue}
          onChange={(val) => onHtmlChange(val || '')}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            fontSize: 14,
            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
            automaticLayout: true,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          type="button"
          onClick={handleFormat}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: 'pointer',
            background: 'var(--theme-elevation-200, #333)',
            color: 'var(--theme-text, #e0e0e0)',
            border: '1px solid var(--theme-elevation-300, #555)',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--theme-elevation-300, #444)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--theme-elevation-200, #333)'
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--theme-success-500, #4caf50)' }} />
          自動フォーマット
        </button>
      </div>

      {errors.length > 0 && (
        <div style={STYLES.errorBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff6b6b', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
            <span>シンタックスエラーを検出しました ({errors.length}件)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {errors.map((err, index) => (
              <div key={index} style={{ fontSize: '12px', color: 'var(--theme-elevation-800)', fontFamily: 'monospace' }}>
                <span style={{ color: '#ff6b6b', fontWeight: 'bold', marginRight: '8px' }}>Line {err.line}:</span>
                <span>{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {parseError && (
        <div style={{ ...STYLES.errorBanner, background: 'rgba(220,53,69,.15)', borderColor: 'rgba(220,53,69,.5)' }}>
          <div style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '13px' }}>
            <span>Lexical変換エラー: {parseError}</span>
          </div>
        </div>
      )}
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

export function HtmlSourceViewerToolbarButton({
  isSourceMode,
  onToggle,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={isSourceMode ? 'リッチテキストに戻る' : 'HTMLソースを編集'}
      title={isSourceMode ? 'Rich Text (Ctrl+Shift+H)' : 'HTML Source (Ctrl+Shift+H)'}
      onClick={onToggle}
      className={`payload-html-source-viewer-button ${isSourceMode ? 'active' : ''}`}
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

