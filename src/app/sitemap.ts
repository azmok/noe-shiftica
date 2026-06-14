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
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
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

  // Collect unique tags (case-insensitive) from a set of docs
  const collectTags = (docs: { customMetaData?: unknown }[]) => {
    const tagMap = new Map<string, string>()
    for (const doc of docs) {
      const meta = doc.customMetaData as Record<string, unknown> | undefined
      if (meta && Array.isArray(meta.tags)) {
        for (const tag of meta.tags) {
          const value = String(tag).trim()
          if (value) tagMap.set(value.toLowerCase(), value)
        }
      }
    }
    return [...tagMap.values()]
  }

  // Dynamic blog tag routes
  const blogTagRoutes = collectTags(posts.docs).map((tag) => ({
    url: `${baseUrl}/blog/tag/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }))

  // Dynamic tech tag routes
  const techTagRoutes = collectTags(techPosts.docs).map((tag) => ({
    url: `${baseUrl}/dev/tag/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
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

