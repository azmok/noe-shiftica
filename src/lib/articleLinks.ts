const SITE_HOSTS = new Set(['noe-shiftica.com', 'www.noe-shiftica.com'])

// Returns a root-relative path for links that stay on this site, so they can use
// client-side navigation; null for external, protocol, and in-page (#) links.
export function toInternalHref(href: string | undefined | null): string | null {
  if (!href) return null
  const value = href.trim()
  if (value.startsWith('/') && !value.startsWith('//')) return value
  if (!/^https?:\/\//i.test(value)) return null
  try {
    const url = new URL(value)
    if (!SITE_HOSTS.has(url.hostname.toLowerCase())) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}
