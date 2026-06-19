import Script from 'next/script'

const SITE_URL = 'https://noe-shiftica.com'
const LOGO_URL = 'https://noe-shiftica.com/assets/NS_logo_White.jpg'
const AUTHOR_NAME = '奥村 東'

interface ArticleJsonLdProps {
  /** Article headline. */
  title: string
  /** Path the article lives under, e.g. "/whats-new/<slug>". */
  path: string
  description?: string | null
  datePublished?: string | null
  dateModified?: string | null
  /** Absolute image URL (already resolved). */
  image?: string | null
}

/**
 * Emits schema.org `Article` JSON-LD. Used by What's New article pages.
 * (Distinct from BlogPostingJsonLd, which emits `BlogPosting` for /blog & /dev.)
 */
export function ArticleJsonLd({
  title,
  path,
  description,
  datePublished,
  dateModified,
  image,
}: ArticleJsonLdProps) {
  const canonicalUrl = `${SITE_URL}${path}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Noe Shiftica',
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  }

  return (
    <Script
      id="article-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
