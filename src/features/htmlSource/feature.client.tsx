/**
 * feature.client.tsx
 *
 * PayloadCMS v3 クライアント側 Feature 定義。
 * ツールバーボタンの登録と、Plugin の差し込みを行う。
 *
 * "use client" ディレクティブが必要。
 */

'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useState } from 'react'

import { HtmlSourcePlugin, HtmlSourceToolbarButton } from './HtmlSourcePlugin'
import { htmlToLexical, lexicalToHtml } from './conversion'

// ----------------------------------------------------------------
// ツールバーボタンのラッパー
// (Payload の ToolbarGroup に登録できる形式に合わせる)
// ----------------------------------------------------------------

/**
 * Payload v3 の toolbar item コンポーネント。
 * `ClientFeature` の `toolbarFixed` または `toolbarInline` に渡す。
 */
function HtmlSourceToolbarItem() {
  const [editor] = useLexicalComposerContext()
  const [isSourceMode, setIsSourceMode] = useState(false)

  const handleToggle = useCallback(() => {
    if (!isSourceMode) {
      // Rich → Source
      console.group('[HtmlSource] ══ Toolbar toggle → SOURCE ══')
      const html = lexicalToHtml(editor)
      // カスタムイベントで Plugin へ通知
      window.dispatchEvent(
        new CustomEvent('htmlsource:enter', { detail: { html } }),
      )
      console.log('[HtmlSource] dispatched htmlsource:enter')
      console.groupEnd()
      setIsSourceMode(true)
    } else {
      // Source → Rich
      console.group('[HtmlSource] ══ Toolbar toggle → RICH TEXT ══')
      window.dispatchEvent(new CustomEvent('htmlsource:exit'))
      console.log('[HtmlSource] dispatched htmlsource:exit')
      console.groupEnd()
      setIsSourceMode(false)
    }
  }, [editor, isSourceMode])

  return (
    <HtmlSourceToolbarButton isSourceMode={isSourceMode} onToggle={handleToggle} />
  )
}

// ----------------------------------------------------------------
// Feature-local Plugin (エディタ DOM に overlay する)
// ----------------------------------------------------------------

/**
 * エディタ本体の上に重なる Textarea オーバーレイ。
 * CustomEvent で enter/exit を受け取り表示を切り替える。
 */
function HtmlSourceOverlayPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isSourceMode, setIsSourceMode] = useState(false)
  const [htmlValue, setHtmlValue] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  // カスタムイベントのリスナー登録
  useState(() => {
    function onEnter(e: Event) {
      const { html } = (e as CustomEvent<{ html: string }>).detail
      setHtmlValue(html)
      setParseError(null)
      setIsSourceMode(true)
    }

    function onExit() {
      console.group('[HtmlSource] ══ overlayPlugin onExit ══')
      setParseError(null)
      try {
        editor.update(() => {
          htmlToLexical(editor, htmlValue)
        })
        setIsSourceMode(false)
        console.log('[HtmlSource] editor state replaced successfully')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[HtmlSource] re-parse failed:', err)
        setParseError(msg)
      }
      console.groupEnd()
    }

    window.addEventListener('htmlsource:enter', onEnter)
    window.addEventListener('htmlsource:exit', onExit)
    return () => {
      window.removeEventListener('htmlsource:enter', onEnter)
      window.removeEventListener('htmlsource:exit', onExit)
    }
  })

  if (!isSourceMode) return null

  return (
    <HtmlSourcePlugin
      onModeChange={(active) => {
        if (!active) setIsSourceMode(false)
      }}
    />
  )
}

// ----------------------------------------------------------------
// Client Feature Export
// ----------------------------------------------------------------

export const HtmlSourceFeatureClient = createClientFeature({
  plugins: [
    {
      // Lexical プラグインとして挿入
      Component: HtmlSourceOverlayPlugin,
      position: 'bottom', // エディタ内コンテンツの下側に追加
    },
  ],

  toolbarFixed: {
    groups: [
      {
        key: 'htmlSourceGroup',
        type: 'buttons',
        // ツールバー右端グループ
        items: [
          {
            ChildComponent: HtmlSourceToolbarItem,
            key: 'htmlSourceButton',
          },
        ],
      },
    ],
  },
})
