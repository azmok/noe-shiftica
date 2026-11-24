'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

/** GitHub の鍵の入力欄（パスワード表示。保存済みの鍵は表示しない） */
export function TokenField({ path, field }: TextFieldClientProps) {
  const { value, setValue } = useField<string>({ path })
  const label = typeof field?.label === 'string' ? field.label : 'GitHub の鍵'
  const description = typeof field?.admin?.description === 'string' ? field.admin.description : ''
  return (
    <div className="field-type text" style={{ marginBottom: 24 }}>
      <label className="field-label" htmlFor={`field-${path}`}>
        {label}
      </label>
      <input
        id={`field-${path}`}
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={value ?? ''}
        placeholder={typeof field?.admin?.placeholder === 'string' ? field.admin.placeholder : ''}
        onChange={(e) => setValue(e.target.value)}
        style={{ width: '100%' }}
      />
      {description && <div className="field-description" style={{ marginTop: 6 }}>{description}</div>}
    </div>
  )
}

export default TokenField
