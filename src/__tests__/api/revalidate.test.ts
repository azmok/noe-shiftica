import { describe, it, expect, vi, beforeEach } from 'vitest'

// Must be hoisted before route import
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { POST } from '@/app/api/revalidate/route'
import { revalidatePath } from 'next/cache'

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
  process.env.REVALIDATE_SECRET = 'test-secret-abc'
})

describe('POST /api/revalidate', () => {
  it('returns 401 when secret is missing', async () => {
    const res = await POST(makeRequest({ slug: 'some-post' }) as any)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid token')
  })

  it('returns 401 when secret is wrong', async () => {
    const res = await POST(makeRequest({ secret: 'wrong-secret' }) as any)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid token')
  })

  it('revalidates /blog only when no slug provided', async () => {
    const res = await POST(makeRequest({ secret: 'test-secret-abc' }) as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.revalidated).toBe(true)
    expect(body.paths).toEqual(['/blog'])
    expect(revalidatePath).toHaveBeenCalledWith('/blog')
    expect(revalidatePath).toHaveBeenCalledTimes(1)
  })

  it('revalidates /blog and /blog/[slug] when slug is provided', async () => {
    const res = await POST(
      makeRequest({ secret: 'test-secret-abc', slug: 'my-post' }) as any
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.revalidated).toBe(true)
    expect(body.paths).toEqual(['/blog', '/blog/my-post'])
    expect(revalidatePath).toHaveBeenCalledWith('/blog')
    expect(revalidatePath).toHaveBeenCalledWith('/blog/my-post')
    expect(revalidatePath).toHaveBeenCalledTimes(2)
  })

  it('does not call revalidatePath for non-string slug', async () => {
    const res = await POST(
      makeRequest({ secret: 'test-secret-abc', slug: 42 }) as any
    )
    expect(res.status).toBe(200)
    // revalidatePath is only called for /blog, not /blog/42
    expect(revalidatePath).toHaveBeenCalledWith('/blog')
    expect(revalidatePath).toHaveBeenCalledTimes(1)
  })

  it('handles malformed JSON body gracefully (returns 401)', async () => {
    const req = new Request('http://localhost/api/revalidate', {
      method: 'POST',
      body: 'not-json',
    })
    // Malformed body → secret is undefined → treated as invalid token
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })
})
