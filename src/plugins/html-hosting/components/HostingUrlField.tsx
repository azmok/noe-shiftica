'use client'

/**
 * HostingUrlField.tsx
 *
 * 現在のスラッグから公開ホスティング URL（/p/<slug>）を組み立てて表示し、
 * クリップボードへコピーするボタンと、新規タブで開くリンクを提供する UI フィールド。
 */

import React, { useState } from 'react'
import { useFormFields } from '@payloadcms/ui'
import { Copy, Check, ExternalLink } from 'lucide-react'

export const HostingUrlField: React.FC = () => {
  const slug = useFormFields(([fields]) => fields?.slug?.value as string | undefined)
  const [copied, setCopied] = useState(false)

  const origin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
  const cleanSlug = (slug || '').trim()
  const url = cleanSlug ? `${origin}/p/${cleanSlug}` : ''

  const handleCopy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (err) {
      console.error('Clipboard copy failed:', err)
    }
  }

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <label className="field-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
        公開ホスティング URL
      </label>

      {url ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <code
            style={{
              flex: '1 1 280px',
              minWidth: 0,
              padding: '10px 12px',
              fontSize: '13px',
              borderRadius: '4px',
              background: 'var(--theme-elevation-50, #1a1a1a)',
              border: '1px solid var(--theme-elevation-200, #444)',
              color: 'var(--theme-text, #e0e0e0)',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {url}
          </code>

          <button
            type="button"
            onClick={handleCopy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: 'pointer',
              background: copied ? 'var(--theme-success-500, #4caf50)' : 'var(--theme-elevation-150, #2a2a2a)',
              color: copied ? '#fff' : 'var(--theme-text, #e0e0e0)',
              border: '1px solid var(--theme-elevation-300, #555)',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'コピーしました' : 'URLをコピー'}
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '4px',
              textDecoration: 'none',
              background: 'var(--theme-elevation-150, #2a2a2a)',
              color: 'var(--theme-text, #e0e0e0)',
              border: '1px solid var(--theme-elevation-300, #555)',
              whiteSpace: 'nowrap',
            }}
          >
            <ExternalLink size={14} />
            開く
          </a>
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--theme-elevation-600, #999)' }}>
          スラッグを入力すると公開 URL が発行されます。
        </p>
      )}
    </div>
  )
}
