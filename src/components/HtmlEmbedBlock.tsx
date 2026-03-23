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
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    shadow.innerHTML = `${embedCss ?? ''}${bodyHtml}`
  }, [bodyHtml, embedCss])

  return <div ref={hostRef} aria-label={title} />
}
