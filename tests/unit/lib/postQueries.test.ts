import { describe, it, expect, vi, beforeEach } from 'vitest'

const payload = vi.hoisted(() => ({ find: vi.fn() }))

vi.mock('payload', () => ({ getPayload: async () => payload }))
vi.mock('@payload-config', () => ({ default: {} }))

import { findAdjacentPosts, findPublishedPost } from '@/lib/postQueries'

beforeEach(() => {
  payload.find.mockReset()
})

describe('findAdjacentPosts', () => {
  it('queries the previous and next post at the same time', async () => {
    const pending: Array<(value: unknown) => void> = []
    payload.find.mockImplementation(() => new Promise((resolve) => pending.push(resolve)))

    const result = findAdjacentPosts('posts', '2026-09-01T00:00:00.000Z')
    await vi.waitFor(() => expect(payload.find).toHaveBeenCalledTimes(2))

    pending[0]({ docs: [{ id: 1, title: 'Older', slug: 'older' }] })
    pending[1]({ docs: [{ id: 3, title: 'Newer', slug: 'newer' }] })
    expect(await result).toEqual({
      prevPost: { id: 1, title: 'Older', slug: 'older' },
      nextPost: { id: 3, title: 'Newer', slug: 'newer' },
    })
  })

  it('fetches only the fields the navigation renders', async () => {
    payload.find.mockResolvedValue({ docs: [] })
    await findAdjacentPosts('tech-posts', '2026-09-01T00:00:00.000Z')

    for (const [args] of payload.find.mock.calls) {
      expect(args).toMatchObject({ collection: 'tech-posts', select: { title: true, slug: true }, limit: 1 })
    }
    const [[older], [newer]] = payload.find.mock.calls
    expect(older).toMatchObject({ sort: '-publishedAt', where: { publishedAt: { less_than: '2026-09-01T00:00:00.000Z' } } })
    expect(newer).toMatchObject({ sort: 'publishedAt', where: { publishedAt: { greater_than: '2026-09-01T00:00:00.000Z' } } })
  })

  it('returns null neighbours at the ends of the list', async () => {
    payload.find.mockResolvedValue({ docs: [] })
    expect(await findAdjacentPosts('posts', '2026-09-01T00:00:00.000Z')).toEqual({ prevPost: null, nextPost: null })
  })
})

describe('findPublishedPost', () => {
  it('looks up a published post by slug', async () => {
    payload.find.mockResolvedValue({ docs: [{ id: 7, slug: 'hello' }] })

    expect(await findPublishedPost('posts', 'hello', 1)).toEqual({ id: 7, slug: 'hello' })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'posts',
        where: { slug: { equals: 'hello' }, _status: { equals: 'published' } },
        depth: 1,
        draft: false,
        overrideAccess: true,
      }),
    )
  })

  it('returns null when nothing matches and rethrows DB errors', async () => {
    payload.find.mockResolvedValueOnce({ docs: [] })
    expect(await findPublishedPost('posts', 'missing', 1)).toBeNull()

    payload.find.mockRejectedValueOnce(new Error('db down'))
    await expect(findPublishedPost('posts', 'down', 1)).rejects.toThrow('db down')
  })
})
