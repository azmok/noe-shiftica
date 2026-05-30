'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useField, useForm } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import beautify from 'js-beautify'
import { createPortal } from 'react-dom'
import { Sparkles, AlertTriangle } from 'lucide-react'
import dynamic from 'next/dynamic'

// ============================================================================
// Robust CJK/Whitespace-Safe HTML & CSS Stack Parsers (VS Code Style)
// ============================================================================

interface SyntaxErrorDetail {
  line: number
  message: string
}

function checkHtmlErrors(html: string): SyntaxErrorDetail[] {
  const errors: SyntaxErrorDetail[] = []
  const tagRegex = /<\/?([a-zA-Z0-9:-]+)(?:\s+[^>]*)?>/g
  const stack: { tag: string; line: number }[] = []

  let match
  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0]
    const tagName = match[1].toLowerCase()
    const isClose = fullTag.startsWith('</')
    const isSelfClosing = fullTag.endsWith('/>') || ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName)

    const offset = match.index
    const line = html.substring(0, offset).split('\n').length

    if (isSelfClosing) continue

    if (isClose) {
      if (stack.length === 0) {
        errors.push({ line, message: `閉じタグ </${tagName}> に対応する開始タグがありません。` })
      } else {
        const last = stack.pop()
        if (last?.tag !== tagName) {
          errors.push({ line, message: `タグの対応が不正です: <${last?.tag}> が </${tagName}> で閉じられています (開始行: ${last?.line}行目)。` })
        }
      }
    } else {
      stack.push({ tag: tagName, line })
    }
  }

  while (stack.length > 0) {
    const unclosed = stack.pop()
    errors.push({ line: unclosed!.line, message: `開始タグ <${unclosed!.tag}> が閉じられていません。` })
  }

  return errors
}

function checkCssErrors(css: string): SyntaxErrorDetail[] {
  const errors: SyntaxErrorDetail[] = []
  const lines = css.split('\n')

  let openBraces = 0
  const braceStack: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i]
    const lineNum = i + 1

    for (const char of lineContent) {
      if (char === '{') {
        openBraces++
        braceStack.push(lineNum)
      } else if (char === '}') {
        if (openBraces === 0) {
          errors.push({ line: lineNum, message: `対応する開始括弧 '{' がない閉じ括弧 '}' があります。` })
        } else {
          openBraces--
          braceStack.pop()
        }
      }
    }
  }

  while (braceStack.length > 0) {
    const unclosedLine = braceStack.pop()
    errors.push({ line: unclosedLine!, message: `括弧 '{' が閉じられていません。` })
  }

  return errors
}

// ============================================================================
// CodeMirror 6 Editor (browser-only — lazy loaded to prevent SSR issues)
// ============================================================================

const CodeMirrorEditor = dynamic(
  async () => {
    const [{ default: CM }, { html }, { css }, { vscodeDarkInit }] = await Promise.all([
      import('@uiw/react-codemirror'),
      import('@codemirror/lang-html'),
      import('@codemirror/lang-css'),
      import('@uiw/codemirror-theme-vscode'),
    ])

    // Build the VS Code dark theme with a custom selection color (project accent #E2FF3D).
    // Using the theme's own `settings.selection` is far more robust than a cascade override:
    // it feeds the same code path that produces the default blue, so no specificity war.
    const editorTheme = vscodeDarkInit({
      settings: {
        selection: '#e2ff3d3a', // E2FF3D @ ~0.23 alpha
        selectionMatch: '#e2ff3d24',
      },
    })

    function EditorCore({ language, value, onChange }: {
      language: 'html' | 'css'
      value: string
      onChange: (val: string) => void
    }) {
      const extensions = React.useMemo(
        () => (language === 'css' ? [css()] : [html()]),
        [language],
      )
      return (
        <CM
          value={value}
          onChange={(val) => onChange(val)}
          extensions={extensions}
          theme={editorTheme}
          minHeight="400px"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
          }}
          style={{ fontSize: '14px' }}
        />
      )
    }

    return EditorCore
  },
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: '400px',
          background: '#1e1e1e',
          borderRadius: '8px',
          border: '1px solid var(--theme-elevation-200)',
        }}
      />
    ),
  },
) as React.ComponentType<{ language: 'html' | 'css'; value: string; onChange: (val: string) => void }>

// ============================================================================
// Core MobileFullscreenEditor Component
// ============================================================================

export const MobileFullscreenEditor: React.FC<TextFieldClientProps> = (props) => {
  const { path, field } = props
  const labelText = typeof field?.label === 'string' ? field.label : path

  const { value, setValue } = useField<string>({ path: path || '' })
  const { submit } = useForm()

  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [localVal, setLocalVal] = useState(value || '')
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null)
  const [errors, setErrors] = useState<SyntaxErrorDetail[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external changes (e.g. initial load or formatting) back to localVal
  useEffect(() => {
    if (value !== localVal) {
      setLocalVal(value || '')
    }
  }, [value])

  // Responsive check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // iOS Safari body scroll lock
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // iOS Safari stop touchmove bubbling
  useEffect(() => {
    if (!isOpen) return
    const ta = textareaRef.current
    if (!ta) return

    const stopProp = (e: TouchEvent) => {
      e.stopPropagation()
    }
    ta.addEventListener('touchmove', stopProp, { passive: false })
    return () => ta.removeEventListener('touchmove', stopProp)
  }, [isOpen])

  // Inject Header Controls into doc-controls__content
  useEffect(() => {
    if (path !== 'bodyHtml') return

    const injectControls = () => {
      const parent = document.querySelector('.doc-controls__content')
      if (!parent) return

      if (document.getElementById('html-files-custom-controls')) return

      const container = document.createElement('div')
      container.id = 'html-files-custom-controls'
      container.style.display = 'flex'
      container.style.alignItems = 'center'
      container.style.gap = '8px'
      container.style.marginRight = '16px'

      setPortalTarget(container)
      parent.insertBefore(container, parent.firstChild)
    }

    const timer = setTimeout(injectControls, 500)
    const observer = new MutationObserver(injectControls)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
      const existing = document.getElementById('html-files-custom-controls')
      if (existing) existing.remove()
    }
  }, [path])

  // Sync to Payload immediately + debounced error analysis
  useEffect(() => {
    setValue(localVal)

    const timer = setTimeout(() => {
      let syntaxErrors: SyntaxErrorDetail[] = []
      if (localVal) {
        if (path === 'bodyHtml') syntaxErrors = checkHtmlErrors(localVal)
        else if (path === 'embedCss') syntaxErrors = checkCssErrors(localVal)
      }
      setErrors(syntaxErrors)
    }, 150)

    return () => clearTimeout(timer)
  }, [localVal, path, setValue])

  // Format event handler
  useEffect(() => {
    const handleFormat = () => {
      if (!localVal) return

      try {
        let formatted = ''
        if (path === 'bodyHtml') {
          formatted = beautify.html(localVal, {
            indent_size: 2,
            wrap_line_length: 120,
            unformatted: ['code', 'pre'],
          })
        } else if (path === 'embedCss') {
          formatted = beautify.css(localVal, {
            indent_size: 2,
          })
        }

        if (formatted) {
          setLocalVal(formatted)
        }
      } catch (err) {
        console.error('Formatting failed:', err)
      }
    }

    window.addEventListener('html-files:format', handleFormat)
    return () => window.removeEventListener('html-files:format', handleFormat)
  }, [localVal, path])

  // Desktop view: CodeMirror 6 editor
  if (!isMobile) {
    return (
      <div className="field-type textarea" style={{ marginBottom: '1.5rem', position: 'relative' }}>
        {portalTarget && createPortal(
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('html-files:format'))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: 'pointer',
              background: '#E2FF3D',
              color: '#000',
              border: 'none',
              boxShadow: '0 0 10px rgba(226, 255, 61, 0.2)',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={14} />
            自動フォーマット
          </button>,
          portalTarget,
        )}

        <label
          className="field-label"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: 'sticky',
            top: '56px',
            zIndex: 10,
            background: 'var(--theme-bg, #0d0f14)',
            padding: '12px 16px',
            margin: '0 -16px 8px -16px',
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            borderBottom: isCollapsed ? '1px solid transparent' : '1px solid var(--theme-elevation-200)',
            transition: 'border-color 0.2s',
          }}
        >
          <span style={{
            fontSize: '10px',
            color: 'var(--theme-elevation-600)',
            transition: 'transform 0.2s',
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
            display: 'inline-block'
          }}>
            ▶
          </span>
          <span>{labelText as React.ReactNode}</span>
        </label>

        {!isCollapsed && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--theme-elevation-200)',
            }}>
              <CodeMirrorEditor
                language={path === 'embedCss' ? 'css' : 'html'}
                value={localVal}
                onChange={setLocalVal}
              />
            </div>

            {errors.length > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                  <AlertTriangle size={15} />
                  <span>シンタックスエラーを検出しました ({errors.length}件)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {errors.map((err, index) => (
                    <div key={index} style={{ fontSize: '12px', color: 'var(--theme-elevation-800)', fontFamily: 'monospace' }}>
                      <span style={{ color: '#ef4444', fontWeight: 'bold', marginRight: '8px' }}>Line {err.line}:</span>
                      <span>{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // MOBILE VIEW
  return (
    <div style={{ marginBottom: '1.5rem', padding: '0 4px' }}>
      <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
        {labelText as React.ReactNode}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '12px',
          background: 'var(--theme-success-500)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        &#x270E; フルスクリーンでエディタを開く
      </button>

      {isOpen && (
        <div
          ref={containerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 9999999,
            background: 'var(--theme-bg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--theme-elevation-100)',
            borderBottom: '1px solid var(--theme-elevation-200)',
            flexShrink: 0
          }}>
            <button
              type="button"
              onClick={() => {
                setValue(localVal)
                setIsOpen(false)
              }}
              style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--theme-elevation-400)', borderRadius: '4px' }}
            >
              閉じる (反映)
            </button>

            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{labelText as React.ReactNode}</span>

            <button
              type="button"
              onClick={async () => {
                setValue(localVal)
                setIsOpen(false)
                setTimeout(() => submit(), 100)
              }}
              style={{
                padding: '8px 16px',
                background: 'var(--theme-success-500)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              保存して閉じる
            </button>
          </div>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              lineHeight: '1.2',
              letterSpacing: '-0.5px',
              fontFamily: 'monospace',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'var(--theme-bg)',
              color: 'var(--theme-text)',
              overflowY: 'scroll' as const,
              overscrollBehavior: 'contain' as const,
              minHeight: 0
            }}
          />
        </div>
      )}
    </div>
  )
}
