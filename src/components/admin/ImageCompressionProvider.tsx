'use client'

/**
 * ImageCompressionProvider
 *
 * Global Payload admin provider that intercepts all fetch() calls to /api/media
 * and compresses images exceeding MAX_SIZE_BYTES before they are sent to the server.
 *
 * This runs entirely in the browser — no server changes needed.
 * Large uploads (e.g. 8MB RAW) are compressed to under 1MB before transmission,
 * dramatically reducing upload time on Firebase App Hosting (Cloud Run).
 *
 * A fixed progress bar overlay is shown during compression so the user knows
 * something is happening instead of looking at a frozen UI.
 */

import React, { useEffect, useRef, useState } from 'react'

const MAX_SIZE_BYTES = 1 * 1024 * 1024 // 1 MB
const PROGRESS_EVENT = 'noe:upload-compress-progress'

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

      const isMediaPost =
        init?.method?.toUpperCase() === 'POST' &&
        url.includes('/api/media') &&
        init?.body instanceof FormData

      if (isMediaPost) {
        const fd = init!.body as FormData
        // Payload uses "file" as the field name for upload collections
        const file = (fd.get('file') ?? fd.get('_file')) as File | null

        if (file && file.type.startsWith('image/') && file.size > MAX_SIZE_BYTES) {
          emit({ state: 'start', percent: 0, filename: file.name })
          try {
            const { default: compress } = await import('browser-image-compression')
            const compressed = await compress(file, {
              maxSizeMB: 0.9,
              maxWidthOrHeight: 3840,
              useWebWorker: true,
              onProgress: (p: number) =>
                emit({ state: 'progress', percent: p, filename: file.name }),
            })
            const replaced = new File([compressed], file.name, {
              type: compressed.type || file.type,
            })
            // Replace in FormData (try both field names to be safe)
            fd.delete('file')
            fd.delete('_file')
            fd.set('file', replaced)
            console.info(
              `[Upload] Compressed "${file.name}": ` +
              `${Math.round(file.size / 1024)}KB → ${Math.round(replaced.size / 1024)}KB`,
            )
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

  // --- Live Preview drag-and-drop resize logic ---
  useEffect(() => {
    if (typeof window === 'undefined') return

    let resizerInstance: HTMLDivElement | null = null
    let activeIframe: HTMLIFrameElement | null = null
    let lastWidth: string | null = null
    // Guard flag to prevent MutationObserver infinite loop:
    // insertBefore() inside updateResizer() itself triggers the observer.
    let isUpdating = false
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const mountResizer = () => {
      const iframe = document.querySelector('iframe')
      if (!iframe) return

      // Already mounted for this exact iframe — nothing to do
      if (resizerInstance && activeIframe === iframe && resizerInstance.isConnected) return

      let current: HTMLElement | null = iframe
      let previewContainer: HTMLElement | null = null
      let editorContainer: HTMLElement | null = null
      let splitParent: HTMLElement | null = null

      while (current && current !== document.body) {
        const parent: HTMLElement | null = current.parentElement
        if (!parent) break

        const siblings = Array.from(parent.children) as HTMLElement[]
        const formEl = siblings.find(
          (el) =>
            el.tagName === 'FORM' ||
            el.classList.contains('form') ||
            el.querySelector('form') !== null
        )

        if (formEl && formEl !== current) {
          previewContainer = current
          editorContainer = formEl
          splitParent = parent
          break
        }
        current = parent
      }

      if (!splitParent || !editorContainer || !previewContainer) return

      // Remove stale resizer from a previous mount cycle
      if (resizerInstance && resizerInstance.isConnected) {
        resizerInstance.remove()
      }

      const resizer = document.createElement('div')
      resizer.className = 'custom-live-preview-resizer'

      resizer.style.width = '10px'
      resizer.style.cursor = 'col-resize'
      resizer.style.backgroundColor = 'var(--theme-elevation-100, #1a1a1a)'
      resizer.style.borderLeft = '1px solid var(--theme-elevation-200, #333)'
      resizer.style.borderRight = '1px solid var(--theme-elevation-200, #333)'
      resizer.style.flexShrink = '0'
      resizer.style.zIndex = '9999'
      resizer.style.position = 'relative'
      resizer.style.transition = 'background-color 0.2s, width 0.1s'

      const grip = document.createElement('div')
      grip.style.position = 'absolute'
      grip.style.top = '50%'
      grip.style.left = '50%'
      grip.style.transform = 'translate(-50%, -50%)'
      grip.style.width = '2px'
      grip.style.height = '30px'
      grip.style.borderRadius = '1px'
      grip.style.backgroundColor = 'var(--theme-elevation-400, #666)'
      resizer.appendChild(grip)

      splitParent.style.display = 'flex'
      splitParent.style.flexDirection = 'row'
      editorContainer.style.flexShrink = '0'

      const initialWidth = lastWidth || '50%'
      editorContainer.style.width = initialWidth
      editorContainer.style.flexBasis = initialWidth

      previewContainer.style.flexGrow = '1'
      previewContainer.style.flexShrink = '1'
      previewContainer.style.width = 'auto'

      // Set guard BEFORE DOM mutation so observer doesn't re-enter
      isUpdating = true
      splitParent.insertBefore(resizer, previewContainer)
      isUpdating = false

      resizerInstance = resizer
      activeIframe = iframe

      let isDragging = false
      let startX = 0
      let startWidth = 0

      const onMouseDown = (e: MouseEvent | TouchEvent) => {
        isDragging = true
        startX = 'clientX' in e ? e.clientX : e.touches[0].clientX
        startWidth = editorContainer!.getBoundingClientRect().width

        iframe.style.pointerEvents = 'none'
        resizer.style.backgroundColor = 'var(--theme-primary-500, #22c55e)'
        grip.style.backgroundColor = 'white'
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'

        const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
          if (!isDragging) return
          const clientX = 'clientX' in moveEvent ? moveEvent.clientX : moveEvent.touches[0].clientX
          const deltaX = clientX - startX
          const maxAllowedWidth = window.innerWidth - 300
          const newWidth = Math.max(300, Math.min(maxAllowedWidth, startWidth + deltaX))

          const finalWidthStr = `${newWidth}px`
          editorContainer!.style.width = finalWidthStr
          editorContainer!.style.flexBasis = finalWidthStr
          lastWidth = finalWidthStr
        }

        const onMouseUp = () => {
          isDragging = false
          iframe.style.pointerEvents = ''
          resizer.style.backgroundColor = 'var(--theme-elevation-100, #1a1a1a)'
          grip.style.backgroundColor = 'var(--theme-elevation-400, #666)'
          document.body.style.cursor = ''
          document.body.style.userSelect = ''

          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
          document.removeEventListener('touchmove', onMouseMove)
          document.removeEventListener('touchend', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        document.addEventListener('touchmove', onMouseMove, { passive: false })
        document.addEventListener('touchend', onMouseUp)
      }

      resizer.addEventListener('mousedown', onMouseDown)
      resizer.addEventListener('touchstart', onMouseDown)

      resizer.addEventListener('mouseenter', () => {
        if (!isDragging) {
          resizer.style.backgroundColor = 'var(--theme-primary-400, #4ade80)'
          grip.style.backgroundColor = 'white'
        }
      })
      resizer.addEventListener('mouseleave', () => {
        if (!isDragging) {
          resizer.style.backgroundColor = 'var(--theme-elevation-100, #1a1a1a)'
          grip.style.backgroundColor = 'var(--theme-elevation-400, #666)'
        }
      })
    }

    const unmountResizer = () => {
      if (resizerInstance && resizerInstance.isConnected) {
        resizerInstance.remove()
      }
      resizerInstance = null
      activeIframe = null
    }

    // Called on resize/orientationchange only — authoritative landscape check
    const onOrientationChange = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches
      if (isLandscape) {
        mountResizer()
      } else {
        unmountResizer()
      }
    }

    // MutationObserver: only mounts the resizer, never unmounts on transient changes.
    // Debounced to avoid thrashing on rapid DOM mutations during Payload tab transitions.
    const observer = new MutationObserver(() => {
      // Skip if we ourselves just mutated the DOM
      if (isUpdating) return

      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const isLandscape = window.matchMedia('(orientation: landscape)').matches
        if (isLandscape) {
          mountResizer()
        }
      }, 100)
    })
    observer.observe(document.body, { childList: true, subtree: true })

    window.addEventListener('resize', onOrientationChange)
    window.addEventListener('orientationchange', onOrientationChange)

    // Initial mount
    onOrientationChange()

    return () => {
      observer.disconnect()
      if (debounceTimer) clearTimeout(debounceTimer)
      window.removeEventListener('resize', onOrientationChange)
      window.removeEventListener('orientationchange', onOrientationChange)
      unmountResizer()
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
