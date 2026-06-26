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
    overrideAccess: true,
    select: {
      slug: true,
      updatedAt: true,
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
    overrideAccess: true,
    select: {
      slug: true,
      updatedAt: true,
    },
  })

  // Fetch all published What's New articles
  const whatsNew = await payload.find({
    collection: 'whats-new',
    where: {
      status: {
        equals: 'published',
      },
    },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
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
    '/dev',
    '/whats-new',
    '/changelog',
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

  // Dynamic What's New routes
  const whatsNewRoutes = whatsNew.docs.map((post) => ({
    url: `${baseUrl}/whats-new/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // NOTE: Tag/category listing pages (/blog/tag/*, /dev/tag/*) are intentionally
  // NOT emitted into the sitemap. They are thin, auto-generated index pages whose
  // set changes whenever an editor adds a tag, and exposing them invites Google to
  // crawl/index low-value duplicate listings. We only advertise canonical content
  // (articles) and the curated static routes above.

  return [
    ...staticRoutes,
    ...postRoutes,
    ...techPostRoutes,
    ...whatsNewRoutes,
  ]
}
