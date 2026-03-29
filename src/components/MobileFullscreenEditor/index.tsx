'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useField, useForm } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

// ---- DEBUG HELPERS ----
type DebugLine = string
const MAX_LINES = 12

function stamp() {
  return new Date().toISOString().slice(11, 23)
}

// ---- COMPONENT ----

export const MobileFullscreenEditor: React.FC<TextFieldClientProps> = (props) => {
  const { path, field } = props
  const labelText = typeof field?.label === 'string' ? field.label : path

  const { value, setValue } = useField<string>({ path: path || '' })
  const { submit } = useForm()

  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [localVal, setLocalVal] = useState(value || '')

  // Debug state
  const [debugLines, setDebugLines] = useState<DebugLine[]>(['[debug] ready'])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const addLine = useCallback((msg: string) => {
    const line = `${stamp()} ${msg}`
    console.log('[MFE-DEBUG]', line)
    setDebugLines(prev => [...prev.slice(-MAX_LINES + 1), line])
  }, [])

  // Keep local value in sync when opened
  useEffect(() => {
    setLocalVal(value || '')
  }, [value, isOpen])

  // Responsive check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // iOS Safari body scroll lock
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      addLine(`[open] body locked. scrollY=${scrollY} body.pos=${document.body.style.position} body.ov=${document.body.style.overflow}`)
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
      addLine(`[close] body unlocked`)
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isOpen, addLine])

  // Touch event debug listeners (attached when overlay is open)
  useEffect(() => {
    if (!isOpen) return

    const ta = textareaRef.current
    const ct = containerRef.current

    // --- textarea listeners ---
    const onTaStart = (e: TouchEvent) => {
      addLine(`[ta] touchstart tgT=${(e.target as HTMLElement).tagName} canc=${e.cancelable} defPrev=${e.defaultPrevented}`)
    }
    const onTaMove = (e: TouchEvent) => {
      const t = e.touches[0]
      addLine(`[ta] touchmove y=${t?.clientY.toFixed(0)} canc=${e.cancelable} defPrev=${e.defaultPrevented} scrollTop=${ta?.scrollTop?.toFixed(0)}`)
    }
    const onTaEnd = (e: TouchEvent) => {
      addLine(`[ta] touchend scrollTop=${ta?.scrollTop?.toFixed(0)}`)
    }

    // --- container listeners ---
    const onCtStart = (e: TouchEvent) => {
      addLine(`[ct] touchstart tgt=${(e.target as HTMLElement).tagName}`)
    }
    const onCtMove = (e: TouchEvent) => {
      addLine(`[ct] touchmove canc=${e.cancelable} defPrev=${e.defaultPrevented}`)
    }

    // --- window listeners (passive:false to detect preventDefault callers) ---
    const onWinMove = (e: TouchEvent) => {
      if (e.defaultPrevented) {
        addLine(`[win] touchmove ALREADY_PREVENTED tgt=${(e.target as HTMLElement)?.tagName}`)
      }
    }

    if (ta) {
      // FIX: stop touchmove from bubbling to Payload's drawer handler which calls preventDefault.
      // We must NOT call preventDefault here — that would kill native textarea scroll too.
      // non-passive is required to call stopPropagation reliably before passive listeners run.
      const stopProp = (e: TouchEvent) => {
        e.stopPropagation()
        addLine(`[FIX] stopPropagation called. defPrev=${e.defaultPrevented} scrollTop=${ta.scrollTop.toFixed(0)}`)
      }
      ta.addEventListener('touchmove', stopProp, { passive: false })

      ta.addEventListener('touchstart', onTaStart, { passive: true })
      ta.addEventListener('touchmove', onTaMove, { passive: true })
      ta.addEventListener('touchend', onTaEnd, { passive: true })
    }
    if (ct) {
      ct.addEventListener('touchstart', onCtStart, { passive: true })
      ct.addEventListener('touchmove', onCtMove, { passive: true })
    }
    window.addEventListener('touchmove', onWinMove, { passive: true })

    addLine(`[setup] listeners attached. ta=${!!ta} ct=${!!ct}`)

    return () => {
      if (ta) {
        ta.removeEventListener('touchmove', stopProp)
        ta.removeEventListener('touchstart', onTaStart)
        ta.removeEventListener('touchmove', onTaMove)
        ta.removeEventListener('touchend', onTaEnd)
      }
      if (ct) {
        ct.removeEventListener('touchstart', onCtStart)
        ct.removeEventListener('touchmove', onCtMove)
      }
      window.removeEventListener('touchmove', onWinMove)
    }
  }, [isOpen, addLine])

  // If desktop, just render a regular textarea
  if (!isMobile) {
    return (
      <div className="field-type textarea" style={{ marginBottom: '1rem' }}>
        <label className="field-label" style={{ marginBottom: '8px', display: 'block' }}>
          {labelText as React.ReactNode}
        </label>
        <div className="field-type__wrap">
          <textarea
            className="textarea-element"
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            style={{
              width: '100%',
              minHeight: '200px',
              fontFamily: 'monospace',
              padding: '8px',
              border: '1px solid var(--theme-elevation-200)',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>
    )
  }

  // MOBILE VIEW
  return (
    <div style={{ marginBottom: '1.5rem', padding: '0 4px' }}>
      <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
        {labelText as React.ReactNode}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '12px',
          background: 'var(--theme-success-500)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        &#x270E; フルスクリーンでエディタを開く
      </button>

      {isOpen && (
        <div
          ref={containerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 9999999,
            background: 'var(--theme-bg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--theme-elevation-100)',
            borderBottom: '1px solid var(--theme-elevation-200)',
            flexShrink: 0
          }}>
            <button
              type="button"
              onClick={() => {
                setValue(localVal)
                setIsOpen(false)
              }}
              style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--theme-elevation-400)', borderRadius: '4px' }}
            >
              閉じる (反映)
            </button>

            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{labelText as React.ReactNode}</span>

            <button
              type="button"
              onClick={async () => {
                setValue(localVal)
                setIsOpen(false)
                setTimeout(() => submit(), 100)
              }}
              style={{
                padding: '8px 16px',
                background: 'var(--theme-success-500)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              保存して閉じる
            </button>
          </div>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              lineHeight: '1.2',
              letterSpacing: '-0.5px',
              fontFamily: 'monospace',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'var(--theme-bg)',
              color: 'var(--theme-text)',
              overflowY: 'scroll' as const,
              overscrollBehavior: 'contain' as const,
              minHeight: 0  // Required for flex:1 children to respect overflow in Safari
            }}
          />

          {/* ===== DEBUG OVERLAY ===== */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '35vh',
              overflowY: 'scroll',
              background: 'rgba(0,0,0,0.85)',
              color: '#0f0',
              fontSize: '10px',
              fontFamily: 'monospace',
              padding: '6px 8px',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff0' }}>
              [DEBUG — remove before deploy]
            </div>
            {debugLines.map((l, i) => (
              <div key={i} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{l}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
