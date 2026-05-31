'use client'

/**
 * PanelResizerProvider
 *
 * Injects draggable resize handles into the Payload CMS admin 3-panel layout:
 *   1. Between the left Nav sidebar and the editor wrap          → drag to change --nav-width
 *   2. Between the editor panel and the live-preview panel       → drag to change --oje-editor-w
 *
 * Behaviour:
 *  - Only activates when window.innerWidth >= 1024px (PC / tablet landscape).
 *  - Uses PointerEvents so it works on both mouse and touch (Apple Pencil, tablet).
 *  - A MutationObserver watches the DOM so handles are auto-added/removed when
 *    Payload's live-preview mode is toggled or when routes change.
 *  - CSS is injected as a <style> tag; all DOM side-effects are fully cleaned up
 *    when the React component unmounts.
 */

import React, { useEffect } from 'react'

/* ─── Constants ──────────────────────────────────────────────── */
const MIN_WIDE = 1024      // px – below this, handles are hidden
const EDIT_ID  = 'oje-panel-resize-editor'
const CSS_ID   = 'oje-panel-resizer-css'

/* ─── Injected styles for the drag handles ───────────────────── */
const HANDLE_CSS = `
  /* oje-panel-handle – a thin invisible strip that becomes a lime glow when active */
  .oje-panel-handle {
    flex-shrink: 0;
    width: 8px;
    min-height: 100%;
    cursor: col-resize;
    position: relative;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    transition: background 180ms ease;
    /* tooltip */
    --_tip: "↔";
  }

  /* The visible pill indicator */
  .oje-panel-handle::after {
    content: '';
    display: block;
    width: 3px;
    height: 40px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.10);
    transition: height 200ms ease, background 200ms ease, box-shadow 200ms ease;
    pointer-events: none;
  }

  .oje-panel-handle:hover::after,
  .oje-panel-handle[data-dragging]::after {
    height: 88px;
    background: rgba(132, 204, 22, 0.90);   /* lime accent */
    box-shadow: 0 0 10px 2px rgba(132, 204, 22, 0.45);
  }

  /* Full-width tinted backdrop while dragging */
  .oje-panel-handle[data-dragging] {
    background: rgba(132, 204, 22, 0.05);
  }

  /* Prevent text selection in the whole page while dragging */
  body[data-oje-dragging] {
    cursor: col-resize !important;
    user-select: none !important;
  }

  /* Force all iframes to ignore pointer events during active drag,
     ensuring even dynamically re-created iframes do not swallow drag events. */
  body[data-oje-dragging] iframe {
    pointer-events: none !important;
  }
`

/* ─── Helper: build one drag handle ─────────────────────────── */
function buildHandle(
  id: string,
  getStartWidth: () => number,
  onDelta: (dx: number, startWidth: number) => void,
): HTMLElement {
  const el = document.createElement('div')
  el.id = id
  el.className = 'oje-panel-handle'
  el.setAttribute('aria-hidden', 'true')

  let startX = 0
  let startW = 0
  let activePointerId: number | null = null

  const onMove = (e: PointerEvent) => {
    if (activePointerId !== null && e.pointerId === activePointerId) {
      onDelta(e.clientX - startX, startW)
    }
  }

  const onUp = (e: PointerEvent) => {
    if (activePointerId !== null && e.pointerId === activePointerId) {
      try {
        el.releasePointerCapture(e.pointerId)
      } catch (err) {
        console.error('[PanelResizer] Error releasing pointer capture:', err)
      }
      activePointerId = null
      el.removeAttribute('data-dragging')
      document.body.removeAttribute('data-oje-dragging')
      
      // Enable mouse events on all iframes again
      document.querySelectorAll('iframe').forEach(iframe => {
        iframe.style.pointerEvents = ''
      })

      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    startX = e.clientX
    startW = getStartWidth()
    activePointerId = e.pointerId
    
    try {
      el.setPointerCapture(e.pointerId)
    } catch (err) {
      console.error('[PanelResizer] Error setting pointer capture:', err)
    }
    
    el.setAttribute('data-dragging', '')
    document.body.setAttribute('data-oje-dragging', '')

    // Disable mouse events on all iframes during drag (fallback)
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.style.pointerEvents = 'none'
    })

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
  })

  return el
}

/* ─── Provider component ─────────────────────────────────────── */
export function PanelResizerProvider({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    /* -- Inject Global Image Diagnostics --------------------- */
    const globalImageErrorHandler = (e: ErrorEvent) => {
      const target = e.target as HTMLElement
      if (target && target.tagName === 'IMG') {
        const img = target as HTMLImageElement
        console.error('[Global Image Error Debug] Failed to load image:', {
          src: img.src,
          alt: img.alt,
          complete: img.complete,
          parentElement: img.parentElement?.outerHTML?.slice(0, 300)
        })
      }
    }

    const globalImageLoadHandler = (e: Event) => {
      const target = e.target as HTMLElement
      if (target && target.tagName === 'IMG') {
        const img = target as HTMLImageElement
        console.log('[Global Image Load Debug] Successfully loaded image:', {
          src: img.src,
          alt: img.alt
        })
      }
    }

    window.addEventListener('error', globalImageErrorHandler, true)
    window.addEventListener('load', globalImageLoadHandler, true)

    /* -- Inject CSS ------------------------------------------ */
    if (!document.getElementById(CSS_ID)) {
      const style = document.createElement('style')
      style.id = CSS_ID
      style.textContent = HANDLE_CSS
      document.head.appendChild(style)
    }

    let rafId: ReturnType<typeof requestAnimationFrame> | null = null
    let isHydrated = false
    let activeIframe: HTMLIFrameElement | null = null
    let activeSplitParent: HTMLElement | null = null
    let activeEditorContainer: HTMLElement | null = null
    let activePreviewContainer: HTMLElement | null = null

    /* -- Editor / Preview handle ----------------------------- */
    const addEditorHandle = () => {
      if (!isHydrated) return
      if (document.getElementById(EDIT_ID)) return

      const iframe = document.querySelector('iframe')
      if (!iframe) return

      // Structural traversal: Ascend from the preview iframe to find the split parent container 
      // containing both the editor form and the preview iframe.
      let current: HTMLElement | null = iframe
      let previewContainer: HTMLElement | null = null
      let editorContainer: HTMLElement | null = null
      let splitParent: HTMLElement | null = null

      while (current && current !== document.body) {
        const parent: HTMLElement | null = current.parentElement
        if (!parent) break

        const siblings = Array.from(parent.children) as HTMLElement[]
        
        const editorEl = siblings.find(
          (el) =>
            el.classList.contains('collection-edit__main') ||
            el.classList.contains('collection-edit__main--is-live-previewing')
        )

        if (editorEl && editorEl !== current) {
          previewContainer = current
          editorContainer = editorEl
          splitParent = parent
          break
        }
        current = parent
      }

      if (!splitParent || !editorContainer || !previewContainer) return

      // Establish flex layout properties on the parent container dynamically
      splitParent.style.display = 'flex'
      splitParent.style.flexDirection = 'row'
      editorContainer.style.flexShrink = '0'
      editorContainer.style.width = 'var(--oje-editor-w, 50%)'
      previewContainer.style.flexGrow = '1'
      previewContainer.style.flexShrink = '1'
      previewContainer.style.width = 'auto'

      activeSplitParent = splitParent
      activeEditorContainer = editorContainer
      activePreviewContainer = previewContainer

      const h = buildHandle(
        EDIT_ID,
        /* getStartWidth */ () => editorContainer.getBoundingClientRect().width,
        /* onDelta */ (dx, startW) => {
          const total  = splitParent.getBoundingClientRect().width
          const newW   = Math.max(220, Math.min(total - 220, startW + dx))
          const pct    = ((newW / total) * 100).toFixed(2)
          document.documentElement.style.setProperty('--oje-editor-w', `${pct}%`)
        },
      )
      
      activeIframe = iframe

      try {
        splitParent.insertBefore(h, previewContainer)
      } catch (err) {
        console.error('[PanelResizer] Failed to insert Editor handle:', err)
      }
    }

    const removeEditorHandle = () => {
      const existing = document.getElementById(EDIT_ID)
      if (existing) {
        existing.remove()
      }
      
      if (activeIframe) {
        activeIframe.style.pointerEvents = ''
        activeIframe = null
      }

      /* Restore layout styles dynamically applied in addEditorHandle */
      if (activeSplitParent) {
        activeSplitParent.style.display = ''
        activeSplitParent.style.flexDirection = ''
        activeSplitParent = null
      }
      if (activeEditorContainer) {
        activeEditorContainer.style.flexShrink = ''
        activeEditorContainer.style.width = ''
        activeEditorContainer = null
      }
      if (activePreviewContainer) {
        activePreviewContainer.style.flexGrow = ''
        activePreviewContainer.style.flexShrink = ''
        activePreviewContainer.style.width = ''
        activePreviewContainer = null
      }

      /* Restore layout forms back to original CSS sizing */
      const forms = document.querySelectorAll('form')
      forms.forEach((f) => {
        const formEl = (f.closest('.form') as HTMLElement) || f
        if (formEl) {
          formEl.style.width = ''
          formEl.style.flexBasis = ''
        }
      })
      document.documentElement.style.removeProperty('--oje-editor-w')
    }

    /* -- Main reconcile loop --------------------------------- */
    const reconcile = () => {
      if (!isHydrated) return

      const wide = window.innerWidth >= MIN_WIDE
      // Robust check: Active live preview always mounts an iframe in the DOM
      // Check both its existence and visual presence (width and display state)
      const iframe = document.querySelector('iframe')
      const inLivePreview = !!(
        iframe && 
        iframe.offsetParent !== null && 
        iframe.getBoundingClientRect().width > 0
      )

      if (!wide) {
        removeEditorHandle()
        return
      }

      /* Editor handle: only in live-preview mode */
      if (inLivePreview) {
        addEditorHandle()
      } else {
        removeEditorHandle()
      }
    }

    const scheduleReconcile = () => {
      if (rafId != null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => { 
        rafId = null; 
        reconcile() 
      })
    }

    /* -- Observe DOM for navigation / mode changes ----------- */
    const obs = new MutationObserver(() => {
      if (!isHydrated) return
      scheduleReconcile()
    })
    
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })

    window.addEventListener('resize', scheduleReconcile)
    
    // Delayed initial pass to ensure React's initial hydration and mounting have completed safely
    const initTimer = setTimeout(() => {
      isHydrated = true
      scheduleReconcile()
    }, 1000)

    /* -- Cleanup on unmount ---------------------------------- */
    return () => {
      clearTimeout(initTimer)
      removeEditorHandle()
      obs.disconnect()
      window.removeEventListener('resize', scheduleReconcile)
      window.removeEventListener('error', globalImageErrorHandler, true)
      window.removeEventListener('load', globalImageLoadHandler, true)
      if (rafId != null) cancelAnimationFrame(rafId)
      document.getElementById(CSS_ID)?.remove()
    }
  }, [])

  return <>{children}</>
}

