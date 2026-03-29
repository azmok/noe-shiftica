import { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

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
    },
  })

  const baseUrl = 'https://noe-shiftica.com'

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/blog',
    '/services',
    '/contact',
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

  return [...staticRoutes, ...postRoutes]
}
