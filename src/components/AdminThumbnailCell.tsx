'use client'

import React from 'react'

/**
 * AdminThumbnailCell
 *
 * Replaces Payload's built-in Thumbnail component in the media list view.
 *
 * Problem with Payload's default:
 *   - Uses a `new Image()` probe inside useEffect — fires asynchronously even
 *     for browser-cached images. This always shows ShimmerEffect briefly before
 *     the actual image appears, even on revisit.
 *
 * Fix:
 *   - Dual-layer cache (in-memory Set + sessionStorage) — same pattern as GcsImage.
 *   - If the URL is already known-loaded, initializes opacity at 1 so the image
 *     renders at full opacity on the very first React render.
 *   - Only runs the async probe (opacity 0 → 1 transition) on the very first visit.
 */

// Shares the same cache as GcsImage so frontend page visits pre-warm the admin cache.
const SESSION_KEY = 'gcs_loaded_urls'
const memoryCache = new Set<string>()

/**
 * Converts a Firebase Storage URL to a Next.js image optimizer URL.
 * - WebP conversion (next.config.ts: formats: ["image/webp"])
 * - Resizes to 96px (matches imageSizes: [96] in next.config.ts)
 * - 1-year server-side cache (minimumCacheTTL: 31536000)
 * Also handles full-size fallback URLs (old uploads without adminList variant).
 */
function toOptimizedUrl(url: string): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=96&q=75`
}

function isUrlCached(url: string): boolean {
  if (typeof window === 'undefined') return false
  if (memoryCache.has(url)) return true
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) return false
    return (JSON.parse(stored) as string[]).includes(url)
  } catch {
    return false
  }
}

function markUrlAsLoaded(url: string): void {
  memoryCache.add(url)
  if (typeof window === 'undefined') return
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    const arr: string[] = stored ? JSON.parse(stored) : []
    if (!arr.includes(url)) {
      arr.push(url)
      const trimmed = arr.length > 200 ? arr.slice(-200) : arr
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(trimmed))
    }
  } catch {
    // private mode / quota exceeded — ignore
  }
}

export const AdminThumbnailCell: React.FC<{
  cellData?: string
  rowData?: Record<string, unknown>
}> = ({ cellData: filename, rowData }) => {
  const sizes = rowData?.sizes as Record<string, { url?: string }> | undefined
  const thumbUrl: string | undefined =
    sizes?.adminList?.url ?? (rowData?.url as string | undefined)

  // Route through Next.js image optimizer: WebP conversion + 96px resize + 1yr cache.
  const optimizedUrl = React.useMemo(
    () => (thumbUrl ? toOptimizedUrl(thumbUrl) : undefined),
    [thumbUrl],
  )

  // Initialize from cache so cached images start at opacity:1 on the first render.
  const initCached = React.useMemo(
    () => (optimizedUrl ? isUrlCached(optimizedUrl) : false),
    [optimizedUrl],
  )
  const [loaded, setLoaded] = React.useState(initCached)

  // Sync in case optimizedUrl changes after mount (e.g. SSR → client hydration).
  React.useEffect(() => {
    if (optimizedUrl && isUrlCached(optimizedUrl)) {
      setLoaded(true)
    }
  }, [optimizedUrl])

  if (!filename) return null

  if (!optimizedUrl) {
    return <span style={{ fontSize: '13px' }}>{filename}</span>
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          flexShrink: 0,
          borderRadius: '3px',
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--theme-elevation-100)',
        }}
      >
        <img
          src={optimizedUrl}
          alt={filename}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.2s ease-out',
          }}
          onLoad={() => {
            markUrlAsLoaded(optimizedUrl)
            setLoaded(true)
          }}
        />
      </div>
      <span
        style={{
          fontSize: '13px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '200px',
        }}
      >
        {filename}
      </span>
    </div>
  )
}
