/**
 * feature.client.tsx
 *
 * PayloadCMS v3 クライアント側 Feature 定義。
 * ツールバーボタンの登録と、Plugin の差し込みを行う。
 */

'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useState, useEffect } from 'react'

import { html as beautifyHtml } from 'js-beautify'

import { HtmlSourceViewer, HtmlSourceViewerToolbarButton } from './HtmlSourceViewer'
import { htmlToLexical, lexicalToHtml } from './conversion'

function formatHtml(raw: string): string {
  return beautifyHtml(raw, {
    indent_size: 2,
    wrap_line_length: 120,
    preserve_newlines: false,
  })
}

// ----------------------------------------------------------------
// ツールバーボタンのラッパー
// ----------------------------------------------------------------

function HtmlSourceViewerToolbarItem() {
  const [editor] = useLexicalComposerContext()
  const [isSourceMode, setIsSourceMode] = useState(false)

  // 同期用イベントリスナー (OverlayPlugin からのトグル同期)
  useEffect(() => {
    const handleSync = (e: Event) => {
      const { active } = (e as CustomEvent).detail
      setIsSourceMode(active)
    }
    window.addEventListener('htmlsourceviewer:sync', handleSync)
    return () => window.removeEventListener('htmlsourceviewer:sync', handleSync)
  }, [])

  const handleToggle = useCallback(() => {
    const nextMode = !isSourceMode
    if (nextMode) {
      // Rich → Source
      // console.group('[HtmlSourceViewer] ══ Toolbar toggle → SOURCE ══')
      const html = lexicalToHtml(editor)
      window.dispatchEvent(
        new CustomEvent('htmlsourceviewer:enter', { detail: { html } }),
      )
      // console.log('[HtmlSourceViewer] dispatched htmlsourceviewer:enter')
      // console.groupEnd()
    } else {
      // Source → Rich
      // console.group('[HtmlSourceViewer] ══ Toolbar toggle → RICH TEXT ══')
      window.dispatchEvent(new CustomEvent('htmlsourceviewer:exit'))
      // console.log('[HtmlSourceViewer] dispatched htmlsourceviewer:exit')
      // console.groupEnd()
    }
    setIsSourceMode(nextMode)
  }, [editor, isSourceMode])

  return (
    <HtmlSourceViewerToolbarButton isSourceMode={isSourceMode} onToggle={handleToggle} />
  )
}

// ----------------------------------------------------------------
// Feature-local Plugin (エディタ DOM に overlay する)
// ----------------------------------------------------------------

function HtmlSourceViewerOverlayPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isSourceMode, setIsSourceMode] = useState(false)
  const [htmlValue, setHtmlValue] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  // Dynamically hide the visual WYSIWYG editor container when in HTML source mode,
  // making Monaco Editor completely replace the editor view.
  useEffect(() => {
    const rootEl = editor.getRootElement()
    if (!rootEl) return

    const scroller = rootEl.closest('.editor-scroller') as HTMLElement
    if (!scroller) return

    if (isSourceMode) {
      scroller.style.display = 'none'
    } else {
      scroller.style.display = ''
    }

    return () => {
      scroller.style.display = ''
    }
  }, [editor, isSourceMode])

  useEffect(() => {
    function onEnter(e: Event) {
      const { html } = (e as CustomEvent<{ html: string }>).detail
      setHtmlValue(formatHtml(html))
      setParseError(null)
      setIsSourceMode(true)
      // ツールバーボタンと状態を同期
      window.dispatchEvent(new CustomEvent('htmlsourceviewer:sync', { detail: { active: true } }))
    }

    function onExit() {
      // console.group('[HtmlSourceViewer] ══ overlayPlugin onExit ══')
      setParseError(null)
      try {
        editor.update(() => {
          htmlToLexical(editor, htmlValue)
        })
        setIsSourceMode(false)
        window.dispatchEvent(new CustomEvent('htmlsourceviewer:sync', { detail: { active: false } }))
        // console.log('[HtmlSourceViewer] editor state replaced successfully')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[HtmlSourceViewer] re-parse failed:', err)
        setParseError(msg)
      }
      // console.groupEnd()
    }

    window.addEventListener('htmlsourceviewer:enter', onEnter as EventListener)
    window.addEventListener('htmlsourceviewer:exit', onExit)
    return () => {
      window.removeEventListener('htmlsourceviewer:enter', onEnter as EventListener)
      window.removeEventListener('htmlsourceviewer:exit', onExit)
    }
  }, [editor, htmlValue])

  return (
    <HtmlSourceViewer
      isSourceMode={isSourceMode}
      htmlValue={htmlValue}
      onHtmlChange={setHtmlValue}
      parseError={parseError}
    />
  )
}

// ----------------------------------------------------------------
// Client Feature Export
// ----------------------------------------------------------------

export const HtmlSourceViewerFeatureClient = createClientFeature({
  plugins: [
    {
      Component: HtmlSourceViewerOverlayPlugin,
      position: 'bottom',
    },
  ],

  toolbarFixed: {
    groups: [
      {
        key: 'htmlSourceViewerGroup',
        type: 'buttons',
        items: [
          {
            Component: HtmlSourceViewerToolbarItem,
            key: 'htmlSourceViewerButton',
          },
        ],
      },
    ],
  },
})
