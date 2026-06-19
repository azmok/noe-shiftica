'use client'

/**
 * TagsField
 *
 * 記事の「タグ」を GUI で編集する UI フィールド。
 * タグはフロント（/blog/tag/[tag]・記事下部の #タグ 表示・sitemap.ts）が参照している
 * `customMetaData.tags`（文字列配列）にそのまま保存する。既存データと完全互換で、
 * 保存先スキーマは変更しない。
 *
 * 同じ `customMetaData` パスを JsonCodeField も編集するため、双方が同一フォーム値を
 * 共有する。チップ追加/削除は customMetaData オブジェクトの tags のみを差し替える。
 */

import React, { useCallback, useMemo, useState } from 'react'
import { useField } from '@payloadcms/ui'

type Meta = Record<string, unknown>

export const TagsField: React.FC = () => {
  const { value, setValue } = useField<Meta | null>({ path: 'customMetaData' })

  const tags = useMemo<string[]>(() => {
    const t = (value as Meta | null)?.tags
    return Array.isArray(t) ? t.map((x) => String(x)) : []
  }, [value])

  const [input, setInput] = useState('')

  const writeTags = useCallback(
    (next: string[]) => {
      const base = (value && typeof value === 'object' ? value : {}) as Meta
      // tags が空になったらキー自体を残す（[]）。他のメタデータは保持する。
      setValue({ ...base, tags: next })
    },
    [value, setValue],
  )

  const addTag = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return
      // 大文字小文字を無視した重複チェック
      if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        setInput('')
        return
      }
      writeTags([...tags, trimmed])
      setInput('')
    },
    [tags, writeTags],
  )

  const removeTag = useCallback(
    (tag: string) => {
      writeTags(tags.filter((t) => t !== tag))
    },
    [tags, writeTags],
  )

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <label className="field-label">タグ</label>

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--theme-elevation-100)',
                border: '1px solid var(--theme-elevation-200)',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              #{tag}
              <button
                type="button"
                aria-label={`${tag} を削除`}
                onClick={() => removeTag(tag)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 2px',
                  lineHeight: 1,
                  color: 'var(--theme-text)',
                  opacity: 0.6,
                  fontSize: '14px',
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        className="field-type__input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addTag(input)
          } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
            // 空入力で Backspace → 末尾タグを削除
            removeTag(tags[tags.length - 1])
          }
        }}
        onBlur={() => {
          if (input.trim()) addTag(input)
        }}
        placeholder="タグを入力して Enter"
      />

      <div
        className="field-description"
        style={{ marginTop: '6px', fontSize: '12px', color: 'var(--theme-elevation-500)' }}
      >
        記事に紐づくタグです（/blog/tag/… のタグページに使われます）。
      </div>
    </div>
  )
}

export default TagsField
