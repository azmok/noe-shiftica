'use client'

/**
 * SharedCodeMirror.tsx
 *
 * 管理画面のコードエディタを CodeMirror 6（@uiw/react-codemirror）で統一するための
 * 共有コンポーネント。
 *
 * 経緯: Monaco エディタは本管理画面では「矢印キーでのカーソル移動」が効かない不具合が
 * あった（コピー/ペーストは可）。一方、埋め込みHTMLファイル編集で使っている CodeMirror は
 * 矢印・コピペとも完全に動作する。そこで全コードエディタを CodeMirror に統一する。
 *
 * HTML / CSS / JavaScript / JSON のシンタックスハイライトに対応し、VS Code テーマで
 * Payload のライト/ダークに追従する。SSR 不可のため dynamic import で遅延ロードする。
 */

import React from 'react'
import dynamic from 'next/dynamic'
import type { Extension } from '@uiw/react-codemirror'

export type CodeLanguage = 'html' | 'css' | 'javascript' | 'json'

export interface SharedCodeMirrorProps {
  language: CodeLanguage
  value: string
  onChange: (value: string) => void
  /** 'dark' | 'light' — Payload のテーマに合わせる */
  theme?: 'dark' | 'light'
  /** 例: '100%'（親が高さを持つ場合）や '320px'。'auto' で内容に合わせて伸縮（内部スクロールなし） */
  height?: string
  minHeight?: string
  /** 長い行を画面幅で折り返す（横スクロールを無くす）。デフォルト false */
  lineWrapping?: boolean
  onFocus?: () => void
  onBlur?: () => void
}

const Inner = dynamic(
  async () => {
    const [
      { default: CM, EditorView },
      { html },
      { css },
      { javascript },
      { json },
      { vscodeDarkInit, vscodeLightInit },
    ] = await Promise.all([
      import('@uiw/react-codemirror'),
      import('@codemirror/lang-html'),
      import('@codemirror/lang-css'),
      import('@codemirror/lang-javascript'),
      import('@codemirror/lang-json'),
      import('@uiw/codemirror-theme-vscode'),
    ])

    // ネオンライムのアクセントに合わせた選択ハイライト（埋め込みHTMLエディタと統一）
    const darkTheme = vscodeDarkInit({
      settings: { selection: '#e2ff3d3a', selectionMatch: '#e2ff3d24' },
    })
    const lightTheme = vscodeLightInit({
      settings: { selection: '#e2ff3d55', selectionMatch: '#e2ff3d33' },
    })

    const languageExtension = (language: CodeLanguage) => {
      switch (language) {
        case 'css':
          return css()
        case 'javascript':
          return javascript()
        case 'json':
          return json()
        case 'html':
        default:
          return html()
      }
    }

    const Core: React.FC<SharedCodeMirrorProps> = ({
      language,
      value,
      onChange,
      theme = 'dark',
      height = '100%',
      minHeight,
      lineWrapping = false,
      onFocus,
      onBlur,
    }) => {
      const extensions = React.useMemo(() => {
        const ext: Extension[] = [languageExtension(language)]
        if (lineWrapping) ext.push(EditorView.lineWrapping)
        return ext
      }, [language, lineWrapping])
      // height='auto' のときは固定高さを与えず、内容に合わせて伸縮させる（内部スクロールなし）
      const autoHeight = height === 'auto'
      return (
        <CM
          value={value}
          onChange={(val) => onChange(val)}
          extensions={extensions}
          theme={theme === 'light' ? lightTheme : darkTheme}
          height={autoHeight ? undefined : height}
          minHeight={minHeight}
          onFocus={onFocus}
          onBlur={onBlur}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
          }}
          style={{ fontSize: '14px', ...(autoHeight ? {} : { height: '100%' }) }}
        />
      )
    }

    return Core
  },
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '100%',
          minHeight: '120px',
          background: 'var(--theme-elevation-50, #1e1e1e)',
        }}
      />
    ),
  },
) as React.ComponentType<SharedCodeMirrorProps>

export const SharedCodeMirror: React.FC<SharedCodeMirrorProps> = (props) => <Inner {...props} />

export default SharedCodeMirror
