'use client'

import React, { useRef } from 'react'
import { useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

// Custom Field for the `html` column of the `hosted-apps` collection.
// Lets the admin either pick a local .html file (read client-side via FileReader
// into the field) or paste/edit the markup directly. The value is plain text
// persisted to the DB, so the data path is identical to a normal textarea field.
export const HostedAppHtmlField: React.FC<TextFieldClientProps> = (props) => {
  const { path, field } = props
  const { value, setValue } = useField<string>({ path })
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setValue(String(reader.result ?? ''))
    reader.readAsText(file)
    // Allow re-selecting the same file name to fire onChange again.
    e.target.value = ''
  }

  const charCount = (value ?? '').length

  return (
    <div className="field-type textarea">
      <label className="field-label">
        {(field?.label as string) ?? 'HTML本体'}
        {field?.required ? <span className="required">*</span> : null}
      </label>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          onClick={() => fileRef.current?.click()}
          style={{ margin: 0 }}
        >
          .html ファイルを読み込む
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".html,text/html"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <span style={{ fontSize: 12, opacity: 0.6 }}>{charCount.toLocaleString()} 文字</span>
      </div>

      <textarea
        className="textarea-element"
        value={value ?? ''}
        onChange={(e) => setValue(e.target.value)}
        rows={18}
        spellCheck={false}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5 }}
        placeholder="<!DOCTYPE html> ... 1枚完結のHTMLをここに貼り付け、または上のボタンでファイル読み込み"
      />

      <p className="field-description" style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
        公開後は <code>/apps/&lt;slug&gt;</code> でそのまま表示されます（head の script も含めJSが動作）。
      </p>
    </div>
  )
}
