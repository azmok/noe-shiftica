'use client'

/**
 * MediaRenameField
 *
 * media コレクションのファイル名を変更するための UI フィールド。
 * Payload の `filename` は通常アップロード時に確定し編集不可だが、本コンポーネントは
 * 専用エンドポイント（POST /api/media/:id/rename）を呼び、GCS 上の元ファイルと全サイズ
 * 派生ファイルをリネーム（copy + delete）したうえで filename / sizes メタデータを更新する。
 *
 * リネームはサーバー側で即時確定（永続化）されるため、成功後はフォーム状態へも反映する。
 */

import React, { useState } from 'react'
import { useDocumentInfo, useForm, useFormFields } from '@payloadcms/ui'

const splitExt = (filename: string): { base: string; ext: string } => {
  const dotIdx = filename.lastIndexOf('.')
  if (dotIdx < 0) return { base: filename, ext: '' }
  return { base: filename.slice(0, dotIdx), ext: filename.slice(dotIdx) }
}

export const MediaRenameField: React.FC = () => {
  const { id } = useDocumentInfo()
  const filenameField = useFormFields(([fields]) => fields.filename)
  const currentFilename = (filenameField?.value as string) || ''
  const { dispatchFields } = useForm()

  const { ext } = splitExt(currentFilename)

  const [draft, setDraft] = useState(() => splitExt(currentFilename).base)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Keep the input in sync with the current base name when the document loads/changes.
  // React-recommended "adjust state during render" pattern (no effect needed).
  const [syncedFilename, setSyncedFilename] = useState(currentFilename)
  if (currentFilename !== syncedFilename) {
    setSyncedFilename(currentFilename)
    setDraft(splitExt(currentFilename).base)
  }

  // Only meaningful once a file has been uploaded (document exists with a filename).
  if (!id || !currentFilename) return null

  const trimmed = draft.trim()
  const unchanged = trimmed === splitExt(currentFilename).base || trimmed === ''

  const handleRename = async () => {
    if (busy || unchanged) return
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      const res = await fetch(`/api/media/${id}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'リネームに失敗しました')
      }

      // Reflect the persisted change into form state.
      if (data.filename) {
        dispatchFields({ type: 'UPDATE', path: 'filename', value: data.filename })
      }
      if (data.sizes) {
        dispatchFields({ type: 'UPDATE', path: 'sizes', value: data.sizes })
      }
      if (data.url) {
        dispatchFields({ type: 'UPDATE', path: 'url', value: data.url })
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <label className="field-label">ファイル名の変更</label>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '4px',
            overflow: 'hidden',
            background: 'var(--theme-input-bg, var(--theme-elevation-50))',
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setDone(false)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleRename()
              }
            }}
            disabled={busy}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--theme-text)',
              padding: '0.5rem 0.65rem',
              fontSize: '13px',
            }}
            placeholder="新しいファイル名"
          />
          {ext && (
            <span
              style={{
                padding: '0 0.65rem',
                fontSize: '13px',
                color: 'var(--theme-elevation-500)',
                borderLeft: '1px solid var(--theme-elevation-150)',
                whiteSpace: 'nowrap',
              }}
            >
              {ext}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            handleRename()
          }}
          disabled={busy || unchanged}
          style={{
            padding: '0 1rem',
            background: unchanged ? 'var(--theme-elevation-150)' : 'var(--theme-success-400)',
            color: unchanged ? 'var(--theme-elevation-500)' : '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: busy || unchanged ? 'default' : 'pointer',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          {busy ? '変更中…' : '変更'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--theme-error-500, #ff6b6b)' }}>
          {error}
        </div>
      )}
      {done && !error && (
        <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--theme-success-500, #22c55e)' }}>
          ファイル名を変更しました（保存済み）。
        </div>
      )}
      <div
        className="field-description"
        style={{ marginTop: '6px', fontSize: '12px', color: 'var(--theme-elevation-500)' }}
      >
        ストレージ上の元ファイルと全サイズの派生ファイルもまとめてリネームされ、即時保存されます。
      </div>
    </div>
  )
}

export default MediaRenameField
