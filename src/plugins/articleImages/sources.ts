/**
 * Pure helpers for rendering a Media upload inside an article body.
 * Kept free of React so they can be unit-tested in the node environment.
 */

/** Payload `media` imageSizes used for the body srcset (see src/collections/Media.ts). */
export const SRCSET_SIZE_NAMES = ['thumbnail', 'medium', 'large'] as const

/**
 * Rendered width of the body image, per breakpoint (PostArticle layout):
 *  - lg+: desktop column `max-w-[872px]` minus `lg:px-12` → ~776px
 *  - md:  same column with `px-6`, inside `md:px-4` → viewport - ~80px
 *  - mobile: full width
 */
export const ARTICLE_IMAGE_SIZES = '(min-width: 1024px) 776px, (min-width: 768px) calc(100vw - 80px), 100vw'

type SizeData = { url?: string | null; width?: number | null } | null | undefined

export type MediaDoc = {
  url?: string | null
  alt?: string | null
  mimeType?: string | null
  filename?: string | null
  width?: number | null
  height?: number | null
  sizes?: Record<string, SizeData> | null
}

export type ArticleImageSources = {
  /** Fallback src for browsers without srcset support. */
  src: string
  srcSet: string
  /** The stored original — opened in a new tab on click. */
  originalUrl: string
  width?: number
  height?: number
}

/**
 * Builds a width-descriptor srcset from the pre-generated WebP variants plus the original,
 * so the browser picks the smallest file that covers the rendered width × DPR.
 * Returns null when the doc has no usable URL.
 */
export const buildImageSources = (doc: MediaDoc): ArticleImageSources | null => {
  const originalUrl = doc.url
  if (!originalUrl) return null

  const originalWidth = doc.width ?? undefined
  const candidates = new Map<number, string>()

  for (const name of SRCSET_SIZE_NAMES) {
    const size = doc.sizes?.[name]
    if (!size?.url || !size.width) continue
    // A variant as wide as the original adds nothing over the original itself.
    if (originalWidth && size.width >= originalWidth) continue
    candidates.set(size.width, size.url)
  }
  if (originalWidth) candidates.set(originalWidth, originalUrl)

  const entries = [...candidates.entries()].sort(([a], [b]) => a - b)
  const srcSet = entries.map(([w, url]) => `${url} ${w}w`).join(', ')
  const fallback = doc.sizes?.medium?.url || originalUrl

  return {
    src: fallback,
    srcSet,
    originalUrl,
    width: originalWidth,
    height: doc.height ?? undefined,
  }
}
