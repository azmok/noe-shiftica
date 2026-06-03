import Script from 'next/script'

const SITE_URL = 'https://noe-shiftica.com'
const LOGO_URL = 'https://noe-shiftica.com/assets/NS_logo_White.jpg'
// Display name only — the author's email is intentionally NOT exposed in public JSON-LD.
const AUTHOR_NAME = '奥村 東'

interface MediaLike {
  url?: string | null
}

interface BlogPostingPost {
  title?: string | null
  slug?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  ogImage?: string | null
  coverImage?: unknown
  heroImage?: unknown
}

interface BlogPostingJsonLdProps {
  post: BlogPostingPost
  /** Route prefix the article lives under, e.g. "/blog" or "/dev". */
  basePath: '/blog' | '/dev'
}

/** Ensures a media path is an absolute URL (schema.org requires absolute URLs). */
function toAbsoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Resolves the featured image: ogImage (absolute) > coverImage.url > heroImage.url. */
function resolveImageUrl(post: BlogPostingPost): string | undefined {
  if (post.ogImage && /^https?:\/\//.test(post.ogImage)) {
    return post.ogImage
  }
  for (const candidate of [post.coverImage, post.heroImage]) {
    if (candidate && typeof candidate === 'object') {
      const url = (candidate as MediaLike).url
      if (typeof url === 'string' && url.length > 0) {
        return toAbsoluteUrl(url)
      }
    }
  }
  return undefined
}

export function BlogPostingJsonLd({ post, basePath }: BlogPostingJsonLdProps) {
  const canonicalUrl = `${SITE_URL}${basePath}/${post.slug ?? ''}`
  const image = resolveImageUrl(post)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title ?? '',
    ...(image ? { image } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    'author': {
      '@type': 'Person',
      'name': AUTHOR_NAME,
    },
    'publisher': {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      'name': 'Noe Shiftica',
      'logo': {
        '@type': 'ImageObject',
        'url': LOGO_URL,
      },
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  }

  return (
    <Script
      id="blog-posting-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
