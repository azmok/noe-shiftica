'use client'

/**
 * ImageCompressionProvider
 *
 * Global Payload admin provider that intercepts all fetch() calls to /api/media
 * and re-encodes large JPEG/PNG/WebP uploads as high-quality WebP (see shouldCompress)
 * before they are sent to the server.
 *
 * This runs entirely in the browser — no server changes needed. Resolution is kept,
 * so files get smaller (faster uploads to Cloud Run) without visible quality loss.
 *
 * A fixed progress bar overlay is shown during compression so the user knows
 * something is happening instead of looking at a frozen UI.
 */

import React, { useEffect, useRef, useState } from 'react'

// --- Suppress Hydration Mismatch Warnings globally in Admin area ---
// This prevents browser extensions (e.g. Google Analytics Opt-out, editor bridges) 
// from polluting the console with un-actionable server/client HTML attribute mismatches.
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = function patchedConsoleError(...args) {
    const firstArg = args[0]
    if (
      typeof firstArg === 'string' &&
      (firstArg.includes('Hydration') ||
        firstArg.includes('hydrated') ||
        firstArg.includes('did not match') ||
        firstArg.includes('attribute') ||
        firstArg.includes('suppressHydrationWarning') ||
        firstArg.includes('mismatch'))
    ) {
      return
    }
    originalError.apply(console, args)
  }
}

// Quality-first policy (2026-10). The old rule squeezed everything over 1 MB down to
// 0.9 MB; a PNG cannot lower its quality, so the library shrank its RESOLUTION instead
// and article images were already blurry at the original. Now:
//  - JPEG/PNG/WebP are re-encoded as WebP q0.9 (visually lossless, PNG → ~1/3–1/5 size)
//  - resolution is kept (only capped at 3840px on the long edge)
//  - the result is used only if it is actually smaller
// Anything else (GIF/SVG/AVIF/HEIC…) is uploaded untouched.
const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PNG_MIN_BYTES = 300 * 1024 // PNGs above this are worth converting to WebP
const OTHER_MIN_BYTES = 1.5 * 1024 * 1024 // JPEG/WebP are already compact below this
const MAX_EDGE_PX = 3840
const WEBP_QUALITY = 0.9
const PROGRESS_EVENT = 'noe:upload-compress-progress'

function shouldCompress(file: File): boolean {
  if (!COMPRESSIBLE_TYPES.includes(file.type)) return false
  return file.size > (file.type === 'image/png' ? PNG_MIN_BYTES : OTHER_MIN_BYTES)
}

function toWebpName(name: string): string {
  return /\.[^./\\]+$/.test(name) ? name.replace(/\.[^./\\]+$/, '.webp') : `${name}.webp`
}

type ProgressDetail =
  | { state: 'start'; percent: 0; filename: string }
  | { state: 'progress'; percent: number; filename: string }
  | { state: 'done'; percent: 100; filename: string }
  | { state: 'error'; percent: 0; filename: string }

function emit(detail: ProgressDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail }))
  }
}

export function ImageCompressionProvider({ children }: { children: React.ReactNode }) {
  const [overlay, setOverlay] = useState<{ percent: number; filename: string; isError: boolean } | null>(null)
  const originalFetch = useRef<typeof window.fetch | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Progress overlay listener ---
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<ProgressDetail>).detail
      if (hideTimer.current) clearTimeout(hideTimer.current)

      if (d.state === 'done') {
        setOverlay(prev => (prev ? { ...prev, percent: 100, isError: false } : null))
        hideTimer.current = setTimeout(() => setOverlay(null), 1200)
      } else if (d.state === 'error') {
        setOverlay(prev => (prev ? { ...prev, isError: true } : null))
        hideTimer.current = setTimeout(() => setOverlay(null), 2500)
      } else {
        setOverlay({ percent: d.percent, filename: d.filename, isError: false })
      }
    }
    window.addEventListener(PROGRESS_EVENT, handler)
    return () => window.removeEventListener(PROGRESS_EVENT, handler)
  }, [])

  // --- Fetch interceptor ---
  useEffect(() => {
    originalFetch.current = window.fetch

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
            ? input.url
            : String(input)

      // POST = new upload, PATCH = "replace file" on an existing media doc
      const method = init?.method?.toUpperCase()
      const isMediaPost =
        (method === 'POST' || method === 'PATCH') &&
        url.includes('/api/media') &&
        init?.body instanceof FormData

      if (isMediaPost) {
        const fd = init!.body as FormData
        // Payload uses "file" as the field name for upload collections
        const file = (fd.get('file') ?? fd.get('_file')) as File | null

        if (file && shouldCompress(file)) {
          emit({ state: 'start', percent: 0, filename: file.name })
          try {
            const { default: compress } = await import('browser-image-compression')
            const compressed = await compress(file, {
              fileType: 'image/webp',
              initialQuality: WEBP_QUALITY,
              maxWidthOrHeight: MAX_EDGE_PX,
              // Never trade resolution for bytes (that was the source of the blur)
              alwaysKeepResolution: true,
              useWebWorker: true,
              onProgress: (p: number) =>
                emit({ state: 'progress', percent: p, filename: file.name }),
            })
            if (compressed.size < file.size) {
              const replaced = new File([compressed], toWebpName(file.name), {
                type: 'image/webp',
              })
              // Replace in FormData (try both field names to be safe)
              fd.delete('file')
              fd.delete('_file')
              fd.set('file', replaced)
              console.info(
                `[Upload] Re-encoded "${file.name}" → "${replaced.name}": ` +
                `${Math.round(file.size / 1024)}KB → ${Math.round(replaced.size / 1024)}KB`,
              )
            } else {
              console.info(`[Upload] Kept original "${file.name}" (WebP was not smaller)`)
            }
            emit({ state: 'done', percent: 100, filename: file.name })
          } catch (err) {
            console.warn('[Upload] Compression failed, uploading original:', err)
            emit({ state: 'error', percent: 0, filename: file.name })
          }
        }
      }

      return originalFetch.current!.call(window, input as RequestInfo, init)
    }

    return () => {
      if (originalFetch.current) window.fetch = originalFetch.current
    }
  }, [])


  return (
    <>
      {children}

      {/* Upload compression progress overlay */}
      {overlay && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: 'var(--theme-bg, #1a1a1a)',
            border: '1px solid var(--theme-elevation-200, #333)',
            borderRadius: '14px',
            padding: '14px 22px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            minWidth: '320px',
            maxWidth: '420px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '10px',
              color: overlay.isError
                ? 'var(--theme-error-500, #ef4444)'
                : 'var(--theme-text, #fff)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{overlay.isError ? '⚠️' : '🗜️'}</span>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {overlay.isError
                ? `圧縮失敗 — 元ファイルで送信: ${overlay.filename}`
                : overlay.percent >= 100
                  ? `✓ 圧縮完了: ${overlay.filename}`
                  : `圧縮中: ${overlay.filename}`}
            </span>
          </div>

          {/* Progress bar track */}
          <div
            style={{
              background: 'var(--theme-elevation-150, #2a2a2a)',
              borderRadius: '6px',
              height: '8px',
              overflow: 'hidden',
            }}
          >
            {/* Progress bar fill */}
            <div
              style={{
                height: '100%',
                width: `${overlay.percent}%`,
                background: overlay.isError
                  ? 'var(--theme-error-500, #ef4444)'
                  : 'var(--theme-success-500, #22c55e)',
                borderRadius: '6px',
                transition: 'width 0.25s ease, background 0.2s ease',
              }}
            />
          </div>

          {/* Percent label */}
          <div
            style={{
              fontSize: '11px',
              color: 'var(--theme-elevation-700, #888)',
              marginTop: '6px',
              textAlign: 'right',
            }}
          >
            {overlay.percent}%
          </div>
        </div>
      )}
    </>
  )
}
