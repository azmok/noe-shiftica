import { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

type ArticleCollection = 'posts' | 'tech-posts'

// Wrapped in React cache() so generateMetadata and the page share one query per render.
// Throws on DB errors; callers decide whether to fall back or preserve the stale cache.
export const findPublishedPost = cache(async <C extends ArticleCollection>(collection: C, slug: string, depth: number) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection,
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    depth,
    limit: 1,
    overrideAccess: true,
    draft: false,
  })
  return result.docs[0] ?? null
})

// Only title and slug are rendered for neighbours, so the article bodies are not fetched.
export async function findAdjacentPosts<C extends ArticleCollection>(collection: C, publishedAt: string) {
  const payload = await getPayload({ config: configPromise })
  const neighbour = (older: boolean) =>
    payload.find({
      collection,
      where: {
        publishedAt: older ? { less_than: publishedAt } : { greater_than: publishedAt },
        _status: { equals: 'published' },
      },
      sort: older ? '-publishedAt' : 'publishedAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
      select: { title: true, slug: true },
    })
  const [prev, next] = await Promise.all([neighbour(true), neighbour(false)])
  return { prevPost: prev.docs[0] ?? null, nextPost: next.docs[0] ?? null }
}
