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

import { HtmlSourcePlugin, HtmlSourceToolbarButton } from './HtmlSourcePlugin'
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

function HtmlSourceToolbarItem() {
  const [editor] = useLexicalComposerContext()
  const [isSourceMode, setIsSourceMode] = useState(false)

  // 同期用イベントリスナー (OverlayPlugin からのトグル同期)
  useEffect(() => {
    const handleSync = (e: Event) => {
      const { active } = (e as CustomEvent).detail
      setIsSourceMode(active)
    }
    window.addEventListener('htmlsource:sync', handleSync)
    return () => window.removeEventListener('htmlsource:sync', handleSync)
  }, [])

  const handleToggle = useCallback(() => {
    const nextMode = !isSourceMode
    if (nextMode) {
      // Rich → Source
      console.group('[HtmlSource] ══ Toolbar toggle → SOURCE ══')
      const html = lexicalToHtml(editor)
      window.dispatchEvent(
        new CustomEvent('htmlsource:enter', { detail: { html } }),
      )
      console.log('[HtmlSource] dispatched htmlsource:enter')
      console.groupEnd()
    } else {
      // Source → Rich
      console.group('[HtmlSource] ══ Toolbar toggle → RICH TEXT ══')
      window.dispatchEvent(new CustomEvent('htmlsource:exit'))
      console.log('[HtmlSource] dispatched htmlsource:exit')
      console.groupEnd()
    }
    setIsSourceMode(nextMode)
  }, [editor, isSourceMode])

  return (
    <HtmlSourceToolbarButton isSourceMode={isSourceMode} onToggle={handleToggle} />
  )
}

// ----------------------------------------------------------------
// Feature-local Plugin (エディタ DOM に overlay する)
// ----------------------------------------------------------------

function HtmlSourceOverlayPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isSourceMode, setIsSourceMode] = useState(false)
  const [htmlValue, setHtmlValue] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  useEffect(() => {
    function onEnter(e: Event) {
      const { html } = (e as CustomEvent<{ html: string }>).detail
      setHtmlValue(formatHtml(html))
      setParseError(null)
      setIsSourceMode(true)
      // ツールバーボタンと状態を同期
      window.dispatchEvent(new CustomEvent('htmlsource:sync', { detail: { active: true } }))
    }

    function onExit() {
      console.group('[HtmlSource] ══ overlayPlugin onExit ══')
      setParseError(null)
      try {
        editor.update(() => {
          htmlToLexical(editor, htmlValue)
        })
        setIsSourceMode(false)
        window.dispatchEvent(new CustomEvent('htmlsource:sync', { detail: { active: false } }))
        console.log('[HtmlSource] editor state replaced successfully')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[HtmlSource] re-parse failed:', err)
        setParseError(msg)
      }
      console.groupEnd()
    }

    window.addEventListener('htmlsource:enter', onEnter as EventListener)
    window.addEventListener('htmlsource:exit', onExit)
    return () => {
      window.removeEventListener('htmlsource:enter', onEnter as EventListener)
      window.removeEventListener('htmlsource:exit', onExit)
    }
  }, [editor, htmlValue])

  return (
    <HtmlSourcePlugin
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

export const HtmlSourceFeatureClient = createClientFeature({
  plugins: [
    {
      Component: HtmlSourceOverlayPlugin,
      position: 'bottom',
    },
  ],

  toolbarFixed: {
    groups: [
      {
        key: 'htmlSourceGroup',
        type: 'buttons',
        items: [
          {
            Component: HtmlSourceToolbarItem,
            key: 'htmlSourceButton',
          },
        ],
      },
    ],
  },
})
