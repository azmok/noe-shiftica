'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useField, useForm } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

export const MobileFullscreenEditor: React.FC<TextFieldClientProps> = (props) => {
  const { path, field } = props
  const labelText = typeof field?.label === 'string' ? field.label : path

  const { value, setValue } = useField<string>({ path: path || '' })
  const { submit } = useForm()

  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [localVal, setLocalVal] = useState(value || '')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // iOS Safari: stop touchmove from bubbling to Payload's drawer handler which calls preventDefault,
  // which would kill native textarea scroll. stopPropagation (not preventDefault) preserves
  // the textarea's own scroll while preventing the drawer from interfering.
  useEffect(() => {
    if (!isOpen) return
    const ta = textareaRef.current
    if (!ta) return

    const stopProp = (e: TouchEvent) => {
      e.stopPropagation()
    }
    ta.addEventListener('touchmove', stopProp, { passive: false })
    return () => ta.removeEventListener('touchmove', stopProp)
  }, [isOpen])

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
        </div>
      )}
    </div>
  )
}
