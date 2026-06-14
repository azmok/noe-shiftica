import { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({
    config: configPromise,
  })

  // Fetch all published posts
  const posts = await payload.find({
    collection: 'posts',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 1000,
    depth: 0,
    select: {
      slug: true,
      updatedAt: true,
      customMetaData: true,
    },
  })

  // Fetch all published tech posts
  const techPosts = await payload.find({
    collection: 'tech-posts',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 1000,
    depth: 0,
    select: {
      slug: true,
      updatedAt: true,
      customMetaData: true,
    },
  })

  const baseUrl = 'https://noe-shiftica.com'

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/blog',
    '/dev',
    '/services',
    '/services/cms-content-operations',
    '/services/scenarios',
    '/hearing',
    '/privacy',
    '/terms',
    '/tokusho',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    // No reliable per-page modified date for static routes. Emitting `new Date()`
    // would stamp "now" on every request, training Google to ignore our lastmod.
    // Omitting it (lastmod is optional) is more honest than a fake timestamp.
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic blog post routes
  const postRoutes = posts.docs.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Dynamic tech post routes
  const techPostRoutes = techPosts.docs.map((post) => ({
    url: `${baseUrl}/dev/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Collect unique tags (case-insensitive) and the newest updatedAt of the posts
  // carrying each tag, so a tag listing's lastmod reflects real content changes
  // instead of "now" on every request.
  const collectTags = (docs: { customMetaData?: unknown; updatedAt?: string }[]) => {
    const tagMap = new Map<string, { label: string; lastModified: Date }>()
    for (const doc of docs) {
      const meta = doc.customMetaData as Record<string, unknown> | undefined
      if (meta && Array.isArray(meta.tags)) {
        const docDate = doc.updatedAt ? new Date(doc.updatedAt) : new Date(0)
        for (const tag of meta.tags) {
          const value = String(tag).trim()
          if (!value) continue
          const key = value.toLowerCase()
          const existing = tagMap.get(key)
          if (!existing) {
            tagMap.set(key, { label: value, lastModified: docDate })
          } else if (docDate > existing.lastModified) {
            existing.lastModified = docDate
          }
        }
      }
    }
    return [...tagMap.values()]
  }

  // Dynamic blog tag routes
  const blogTagRoutes = collectTags(posts.docs).map(({ label, lastModified }) => ({
    url: `${baseUrl}/blog/tag/${encodeURIComponent(label)}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }))

  // Dynamic tech tag routes
  const techTagRoutes = collectTags(techPosts.docs).map(({ label, lastModified }) => ({
    url: `${baseUrl}/dev/tag/${encodeURIComponent(label)}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }))

  return [
    ...staticRoutes,
    ...postRoutes,
    ...techPostRoutes,
    ...blogTagRoutes,
    ...techTagRoutes,
  ]
}

