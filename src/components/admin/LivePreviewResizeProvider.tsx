'use client'

import React, { useEffect } from 'react'

/**
 * LivePreviewResizeProvider
 * 
 * Global Payload admin provider that enables drag-and-drop resizing 
 * between the Text Editor and the Live Preview iframe.
 * 
 * Requirements:
 * 1. PC View: Drag-and-drop splitter allows free resizing.
 * 2. Mobile/Tablet:
 *    - Portrait: Keep default behavior (no splitter/resize UI).
 *    - Landscape: Enable the drag-and-drop splitter to adjust preview screen size.
 * 
 * Implementation Strategy:
 * - Uses a MutationObserver to dynamically detect the Live Preview iframe when it mounts.
 * - Structurally traverses up the DOM to find the parent split-container and editor column.
 * - Injects a custom vertical drag splitter (.custom-live-preview-resizer).
 * - Adapts dynamically to resize and orientationchange events using window.matchMedia.
 */
export function LivePreviewResizeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    let resizerInstance: HTMLDivElement | null = null
    let activeIframe: HTMLIFrameElement | null = null
    let lastWidth: string | null = null // Keep last resized width to persist during sub-tab switches

    const updateResizer = () => {
      const iframe = document.querySelector('iframe')
      // orientation: landscape matches all PC views and landscape tablet/mobile viewports.
      const isLandscape = window.matchMedia('(orientation: landscape)').matches

      if (iframe && isLandscape) {
        // Skip if already applied to the current active iframe
        if (resizerInstance && activeIframe === iframe) return

        // 1. Locate the split layout components structurally:
        // We find the parent container that contains both the editor (form/editor-wrapper) and the preview column.
        let current: HTMLElement | null = iframe
        let previewContainer: HTMLElement | null = null
        let editorContainer: HTMLElement | null = null
        let splitParent: HTMLElement | null = null

        while (current && current !== document.body) {
          const parent = current.parentElement
          if (!parent) break

          const siblings = Array.from(parent.children) as HTMLElement[]
          
          // Structurally identify the editor column (usually has <form> inside it, or is the form itself)
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

        if (splitParent && editorContainer && previewContainer) {
          // Clean up any stale resizer instance
          if (resizerInstance) {
            resizerInstance.remove()
          }

          // 2. Create the custom drag-splitter element
          const resizer = document.createElement('div')
          resizer.className = 'custom-live-preview-resizer'
          
          // Splitter basic aesthetics (sleek dark glass border, matching Payload theme)
          resizer.style.width = '10px'
          resizer.style.cursor = 'col-resize'
          resizer.style.backgroundColor = 'var(--theme-elevation-100, #1a1a1a)'
          resizer.style.borderLeft = '1px solid var(--theme-elevation-200, #333)'
          resizer.style.borderRight = '1px solid var(--theme-elevation-200, #333)'
          resizer.style.flexShrink = '0'
          resizer.style.zIndex = '9999'
          resizer.style.position = 'relative'
          resizer.style.transition = 'background-color 0.2s, width 0.1s'

          // Inner grip element (gives visual hint for dragging)
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

          // 3. Establish flex layouts on the parent and columns
          splitParent.style.display = 'flex'
          splitParent.style.flexDirection = 'row'
          
          editorContainer.style.flexShrink = '0'
          
          // Apply last width if available, otherwise default to a balanced 50% split
          const initialWidth = lastWidth || '50%'
          editorContainer.style.width = initialWidth
          editorContainer.style.flexBasis = initialWidth

          previewContainer.style.flexGrow = '1'
          previewContainer.style.flexShrink = '1'
          previewContainer.style.width = 'auto'

          // 4. Inject the resizer between Editor and Preview containers
          splitParent.insertBefore(resizer, previewContainer)
          resizerInstance = resizer
          activeIframe = iframe

          // 5. Drag mechanics implementation
          let isDragging = false
          let startX = 0
          let startWidth = 0

          const onMouseDown = (e: MouseEvent | TouchEvent) => {
            isDragging = true
            startX = 'clientX' in e ? e.clientX : e.touches[0].clientX
            startWidth = editorContainer!.getBoundingClientRect().width

            // Prevent iframe from swallowing drag/mousemove events
            iframe.style.pointerEvents = 'none'
            
            // Hover state feedback
            resizer.style.backgroundColor = 'var(--theme-primary-500, #22c55e)'
            grip.style.backgroundColor = 'white'
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'

            const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
              if (!isDragging) return
              const clientX = 'clientX' in moveEvent ? moveEvent.clientX : moveEvent.touches[0].clientX
              const deltaX = clientX - startX
              
              // Set bounds: Minimum 300px, maximum layout minus 300px
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

          // Accent hover styling
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
      } else {
        // Portrait or no iframe active -> remove resizer and restore default CSS sizing
        if (resizerInstance) {
          resizerInstance.remove()
          resizerInstance = null
          activeIframe = null
        }

        // Search and clear any custom flex layouts applied to the document forms
        const forms = document.querySelectorAll('form')
        forms.forEach((f) => {
          const formEl = (f.closest('.form') as HTMLElement) || f
          if (formEl) {
            formEl.style.width = ''
            formEl.style.flexBasis = ''
          }
        })
      }
    }

    // 6. Set up reactive lifecycle listeners:
    // MutationObserver guarantees we catch iframe mount/unmount instantly on tab changes
    const observer = new MutationObserver(() => {
      updateResizer()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    // Handles viewport orientation rotations and size changes seamlessly
    window.addEventListener('resize', updateResizer)
    window.addEventListener('orientationchange', updateResizer)

    // Initial pass
    updateResizer()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateResizer)
      window.removeEventListener('orientationchange', updateResizer)
      if (resizerInstance) {
        resizerInstance.remove()
      }
    }
  }, [])

  return <>{children}</>
}
