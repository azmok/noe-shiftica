'use client'

import React from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'

export function PreviewViewClient({ initialData }: { initialData: any }) {
  const { data } = useLivePreview({
    initialData,
    serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    depth: 0,
  })

  return (
    // position:fixed + z-index:9999 covers the Payload admin chrome within the iframe
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a0f', overflowY: 'auto' }}>
      <div style={{ padding: '2rem', minHeight: '100%', position: 'relative' }}>
        {/* background blobs */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: 'rgba(226,255,61,0.06)', filter: 'blur(120px)' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '30%', height: '30%', borderRadius: '50%', background: 'rgba(226,255,61,0.03)', filter: 'blur(100px)' }} />
        </div>

        <div style={{ maxWidth: '56rem', margin: '0 auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2rem', padding: '2rem 3rem', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', position: 'relative', zIndex: 1 }}>
          {data?.embedCss && (
            <div dangerouslySetInnerHTML={{ __html: data.embedCss }} />
          )}
          {data?.bodyHtml ? (
            <div dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
          ) : (
            <div style={{ color: 'rgba(148,163,184,0.6)', fontStyle: 'italic', textAlign: 'center', padding: '5rem 0' }}>
              HTMLコンテンツが空、またはアップロードされていません。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
