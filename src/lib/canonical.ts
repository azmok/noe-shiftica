import { toInternalHref } from '@/lib/articleLinks'

// Canonical URL for an article page. A post only ever lives at its own path on
// this site, so a customMetaData.canonical pointing anywhere on this site (path,
// bare slug, or absolute noe-shiftica.com URL) is ignored in favour of ownPath:
// a stale or AI-suggested slug there sends crawlers (and X's card fetcher) to a
// 404, which drops the OG image. Only an absolute URL on another host — the
// original of a cross-post — overrides it.
export function resolveCanonical(custom: unknown, ownPath: string): string {
  const value = typeof custom === 'string' ? custom.trim() : ''
  if (/^https?:\/\//i.test(value) && toInternalHref(value) === null) {
    try {
      return new URL(value).toString()
    } catch {
      return ownPath
    }
  }
  return ownPath
}
