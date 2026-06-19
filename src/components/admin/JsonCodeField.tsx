'use client'

/**
 * JsonCodeField.tsx
 *
 * Payload の `type: 'json'` フィールド用カスタム Field コンポーネント。
 *
 * 標準の JSON フィールド（Monaco ベースの CodeEditor）は本管理画面で
 *   - 矢印キーでのカーソル移動が効かない
 *   - 入力のたびに高さを動的再計算 → 狭いサイドバーでカットすると表示が崩壊する
 * という不具合があった。そこで全コードエディタと同じく CodeMirror（SharedCodeMirror）に
 * 統一し、固定高さ＋内部スクロールで安定動作させる。
 *
 * JSON として妥当なときだけフォーム値へ反映し、無効なときは編集テキストを保持して警告する。
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'
import type { JSONFieldClientProps } from 'payload'
import { SharedCodeMirror } from './SharedCodeMirror'

const EDITOR_HEIGHT = 320

/** 任意の値を整形済み JSON 文字列にする（null/undefined は空文字） */
function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export const JsonCodeField: React.FC<JSONFieldClientProps> = (props) => {
  const { path, field } = props
  const { value, setValue } = useField<unknown>({ path })

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [text, setText] = useState<string>(() => stringifyValue(value))
  const [error, setError] = useState<string | null>(null)
  // ユーザーが編集中（フォーカス中）かどうか。外部更新で入力を上書きしないために使う
  const focusedRef = useRef(false)

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

  // 外部（Markdownインポート等）からの値変更をエディタへ反映。
  // ただしユーザーが編集中（フォーカス中）は上書きしない。
  useEffect(() => {
    if (focusedRef.current) return
    const next = stringifyValue(value)
    setText((prev) => (prev === next ? prev : next))
    setError(null)
  }, [value])

  const handleChange = useCallback(
    (next: string) => {
      setText(next)

      if (next.trim() === '') {
        setError(null)
        setValue(undefined)
        return
      }
      try {
        const parsed = JSON.parse(next)
        setError(null)
        setValue(parsed)
      } catch {
        // 無効な JSON のときはフォーム値を更新せず、最後に妥当だった値を保持
        setError('JSON として無効です（保存値は最後に妥当だった内容のままです）')
      }
    },
    [setValue],
  )

  const label =
    (typeof field?.label === 'string' && field.label) || field?.name || path
  const description =
    typeof field?.admin?.description === 'string' ? field.admin.description : null

  return (
    <div className="field-type json-field" style={{ marginBottom: '1.5rem' }}>
      <div className="field-label" style={{ marginBottom: '6px' }}>
        {label}
      </div>

      <div
        style={{
          height: `${EDITOR_HEIGHT}px`,
          border: '1px solid var(--theme-elevation-150, #444)',
          borderRadius: '4px',
          overflow: 'hidden',
          background: 'var(--theme-elevation-50, #1e1e1e)',
        }}
      >
        <SharedCodeMirror
          language="json"
          value={text}
          onChange={handleChange}
          theme={theme}
          height="100%"
          onFocus={() => {
            focusedRef.current = true
          }}
          onBlur={() => {
            focusedRef.current = false
          }}
        />
      </div>

      {error && (
        <div style={{ marginTop: '6px', fontSize: '12px', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {description && (
        <div
          className="field-description"
          style={{ marginTop: '6px', fontSize: '12px', color: 'var(--theme-elevation-500)' }}
        >
          {description}
        </div>
      )}
    </div>
  )
}

export default JsonCodeField
