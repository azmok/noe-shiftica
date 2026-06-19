'use client'

/**
 * HostingEditor.tsx
 *
 * 「HTMLホスティング」コレクションの編集 UI。
 * HTML / CSS / JS を3つのタブに分けた Monaco エディタで編集できる。
 * 加えて「HTMLファイルをアップロード」ボタンで 1枚の HTML を取り込み、
 * parseHtmlFile() で3要素へ分解して各エディタへ流し込む。
 *
 * このコンポーネントは `html` フィールドの Field コンポーネントとして登録し、
 * 兄弟フィールド `css` / `js` は useField で直接バインドする。
 */

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import { Upload, Code2, Eye } from 'lucide-react'
import { parseHtmlFile } from '../lib/parseHtml'
import { assembleHtmlDocument } from '../lib/assemble'
import { SharedCodeMirror, type CodeLanguage } from '@/components/admin/SharedCodeMirror'

type TabKey = 'html' | 'css' | 'js'

const TABS: { key: TabKey; label: string; language: CodeLanguage }[] = [
  { key: 'html', label: 'HTML', language: 'html' },
  { key: 'css', label: 'CSS', language: 'css' },
  { key: 'js', label: 'JavaScript', language: 'javascript' },
]

export const HostingEditor: React.FC<TextFieldClientProps> = (props) => {
  const { path } = props
  // path は 'html' フィールド。css / js は兄弟パスにバインド。
  const htmlField = useField<string>({ path: path || 'html' })
  const cssField = useField<string>({ path: 'css' })
  const jsField = useField<string>({ path: 'js' })

  const fields: Record<TabKey, { value: string | undefined; setValue: (v: string) => void }> = {
    html: htmlField,
    css: cssField,
    js: jsField,
  }

  const [active, setActive] = useState<TabKey>('html')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showPreview, setShowPreview] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Payload のテーマに追従
  useEffect(() => {
    const updateTheme = () => {
      const t = document.documentElement.getAttribute('data-theme') || 'dark'
      setTheme(t === 'light' ? 'light' : 'dark')
    }
    updateTheme()
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    })
    return () => observer.disconnect()
  }, [])

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      // 同じファイルを連続選択しても onChange が発火するよう値をクリア
      e.target.value = ''
      if (!file) return

      try {
        const raw = await file.text()
        const parsed = parseHtmlFile(raw)
        htmlField.setValue(parsed.html)
        cssField.setValue(parsed.css)
        jsField.setValue(parsed.js)
        setUploadMsg(
          `「${file.name}」を読み込みました（HTML ${parsed.html.length} / CSS ${parsed.css.length} / JS ${parsed.js.length} 文字）`,
        )
        setActive('html')
      } catch (err) {
        console.error('HTML upload failed:', err)
        setUploadMsg('ファイルの読み込みに失敗しました。')
      }
    },
    [htmlField, cssField, jsField],
  )

  const previewSrcDoc = showPreview
    ? assembleHtmlDocument({
        html: htmlField.value || '',
        css: cssField.value || '',
        js: jsField.value || '',
      })
    : ''

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      {/* ツールバー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '8px',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}>
          <Code2 size={16} />
          ソースコード
        </span>

        <div style={{ flex: 1 }} />

        <input
          ref={fileInputRef}
          type="file"
          accept="text/html,.html,.htm"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: 'pointer',
            background: 'var(--theme-elevation-150, #2a2a2a)',
            color: 'var(--theme-text, #e0e0e0)',
            border: '1px solid var(--theme-elevation-300, #555)',
          }}
        >
          <Upload size={14} />
          HTMLファイルをアップロード
        </button>

        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: 'pointer',
            background: showPreview ? 'var(--theme-success-500, #4caf50)' : 'var(--theme-elevation-150, #2a2a2a)',
            color: showPreview ? '#fff' : 'var(--theme-text, #e0e0e0)',
            border: '1px solid var(--theme-elevation-300, #555)',
          }}
        >
          <Eye size={14} />
          プレビュー
        </button>
      </div>

      {uploadMsg && (
        <div
          style={{
            marginBottom: '8px',
            fontSize: '12px',
            color: 'var(--theme-success-600, #4caf50)',
          }}
        >
          {uploadMsg}
        </div>
      )}

      {/* タブ */}
      <div style={{ display: 'flex', gap: '2px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: '1px solid var(--theme-elevation-150, #444)',
              borderBottom: 'none',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              background:
                active === tab.key ? 'var(--theme-elevation-50, #1a1a1a)' : 'var(--theme-elevation-100, #222)',
              color:
                active === tab.key ? 'var(--theme-text, #fff)' : 'var(--theme-elevation-600, #999)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* エディタ本体（全タブを常時マウントし、非表示で保持してフォーカス/履歴を維持） */}
      <div
        style={{
          border: '1px solid var(--theme-elevation-150, #444)',
          borderRadius: '0 6px 6px 6px',
          overflow: 'hidden',
          background: 'var(--theme-elevation-50, #1a1a1a)',
        }}
      >
        {TABS.map((tab) => (
          <div
            key={tab.key}
            style={{ display: active === tab.key ? 'block' : 'none' }}
          >
            <SharedCodeMirror
              language={tab.language}
              theme={theme}
              value={fields[tab.key].value || ''}
              onChange={(val) => fields[tab.key].setValue(val || '')}
              height="auto"
              minHeight="200px"
              lineWrapping
            />
          </div>
        ))}
      </div>

      {/* ライブプレビュー（sandbox 付き iframe） */}
      {showPreview && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--theme-elevation-600)', marginBottom: '4px' }}>
            プレビュー（保存内容と同じ組み立て結果）
          </div>
          <iframe
            title="hosting-preview"
            srcDoc={previewSrcDoc}
            sandbox="allow-scripts allow-same-origin"
            style={{
              width: '100%',
              height: '480px',
              border: '1px solid var(--theme-elevation-150, #444)',
              borderRadius: '6px',
              background: '#fff',
            }}
          />
        </div>
      )}
    </div>
  )
}
