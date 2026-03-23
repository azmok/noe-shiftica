'use client'

import { useRef, useEffect } from 'react'

type Props = {
  bodyHtml: string
  embedCss?: string
  title?: string
}

export function HtmlEmbedBlock({ bodyHtml, embedCss, title }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    
    // Create or reuse open shadow root
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })

    // Build the initial DOM string
    const hostCss = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 100%;
          background-color: transparent; /* fallback */
        }
        /* Force injected root to fill the screen to prevent white gaps */
        body, #uploaded-content {
          min-height: 100%;
          margin: 0;
          display: block;
        }
      </style>
    `
    // Set raw HTML first (scripts will NOT execute here)
    shadow.innerHTML = `${hostCss}\n${embedCss ?? ''}\n${bodyHtml}`

    // 1. Rewrite CSS in injected <style> tags to scope html/:root and body to #uploaded-content
    const styleTags = Array.from(shadow.querySelectorAll('style'))
    styleTags.forEach(style => {
      if (style.textContent) {
        // Replace html/:root with :host for the shadow boundary (global variables, etc.)
        style.textContent = style.textContent.replace(
          /(^|\}|;|,|\s)(html|:root)(?=\s*[,{\.#:])/gi,
          '$1:host'
        )
        // Transform 'body' into '#uploaded-content' so it targets the internal root div.
        // We DO NOT map '#uploaded-content' to ':host' here because the host's external 
        // Tailwind classes (like bg-transparent) would override the internal background color.
        style.textContent = style.textContent.replace(
          /(^|\}|;|,|\s)body(?=\s*[,{\.#:])/gi,
          '$1#uploaded-content'
        )
      }
    })

    // 2. Re-evaluate and execute scripts to allow graphs to render.
    // Browsers block <script> tags added via innerHTML. We must clone and append them manually.
    const scripts = Array.from(shadow.querySelectorAll('script'))
    
    const runScripts = async () => {
      for (const oldScript of scripts) {
        const newScript = document.createElement('script')
        
        // Copy all attributes (like src, type, async)
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value)
        })
        
        // Temporarily patch document to fallback to shadow root for specific queries during script execution.
        // This is crucial for graph libraries that blindly call document.getElementById()
        const code = oldScript.innerHTML
        if (code) {
          newScript.innerHTML = `
            (function() {
              const shadowRoot = document.currentScript ? document.currentScript.getRootNode() : null;
              const originalGetElementById = document.getElementById.bind(document);
              document.getElementById = function(id) {
                return (shadowRoot && shadowRoot.getElementById && shadowRoot.getElementById(id)) || originalGetElementById(id);
              };
              try {
                ${code}
              } catch(e) {
                console.error("Error evaluating script in Shadow DOM:", e);
              } finally {
                document.getElementById = originalGetElementById;
              }
            })();
          `
        }
        
        // Wait for external libraries (like Plotly.js / ECharts.js) to load before proceeding
        if (newScript.src) {
          await new Promise((resolve) => {
            newScript.onload = resolve
            newScript.onerror = resolve // proceed even on error to unblock others
            oldScript.replaceWith(newScript)
          })
        } else {
          // Inline scripts execute synchronously upon insertion
          oldScript.replaceWith(newScript)
        }
      }
    }
    
    // 3. Handle fragment navigation (TOC links) inside Shadow DOM.
    // Standard browser fragment navigation doesn't work across Shadow DOM boundaries.
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (target && target.hash && target.origin === window.location.origin) {
        const id = target.hash.slice(1)
        const element = shadow.getElementById(id)
        if (element) {
          e.preventDefault()
          
          // Calculate the global position of the element
          // We use getBoundingClientRect() + current scroll to get the absolute document position
          const rect = element.getBoundingClientRect()
          const scrollTarget = window.pageYOffset + rect.top - 100 // 100px offset for sticky header

          window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
          })
          
          // Update URL hash without triggering browser's default jump
          window.history.pushState(null, '', target.hash)
        }
      }
    }

    shadow.addEventListener('click', handleLinkClick as EventListener)

    runScripts()

    return () => {
      shadow.removeEventListener('click', handleLinkClick as EventListener)
    }

  }, [bodyHtml, embedCss])

  return (
    <div 
      ref={hostRef} 
      id="uploaded-content"
      aria-label={title || 'Embedded Content'} 
      className="w-full rounded-2xl bg-transparent"
    />
  )
}

