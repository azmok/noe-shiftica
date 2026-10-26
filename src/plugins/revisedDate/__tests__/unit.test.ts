import { describe, it, expect } from 'vitest'
import { displayedUpdate, revisedDatePlugin } from '@/plugins/revisedDate'

describe('revisedDatePlugin', () => {
  it('appends revisedAt (date) to the listed collections only', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = revisedDatePlugin({ collections: ['posts', 'tech-posts'] })({
      collections: [
        { slug: 'posts', fields: [{ name: 'title', type: 'text' }] },
        { slug: 'tech-posts', fields: [{ name: 'title', type: 'text' }] },
        { slug: 'media', fields: [{ name: 'alt', type: 'text' }] },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const fields = (slug: string) =>
      config.collections
        .find((c: { slug: string }) => c.slug === slug)
        .fields.map((f: { name: string; type: string }) => [f.name, f.type])
    expect(fields('posts')).toEqual([['title', 'text'], ['revisedAt', 'date']])
    expect(fields('tech-posts')).toEqual([['title', 'text'], ['revisedAt', 'date']])
    expect(fields('media')).toEqual([['alt', 'text']])
  })
})

describe('displayedUpdate', () => {
  const publishedAt = '2026-03-10T00:00:00.000Z'

  it('prefers revisedAt as a date-only value', () => {
    expect(displayedUpdate({ revisedAt: '2026-10-26T00:00:00.000Z', updatedAt: '2026-10-27T03:00:00.000Z', publishedAt })).toEqual({
      value: '2026-10-26T00:00:00.000Z',
      dateOnly: true,
    })
  })

  it('falls back to updatedAt when it is after publishedAt', () => {
    expect(displayedUpdate({ revisedAt: null, updatedAt: '2026-03-29T08:27:39.349Z', publishedAt })).toEqual({
      value: '2026-03-29T08:27:39.349Z',
      dateOnly: false,
    })
  })

  it('shows nothing when there is no later update', () => {
    expect(displayedUpdate({ updatedAt: publishedAt, publishedAt })).toBeNull()
    expect(displayedUpdate({})).toBeNull()
  })
})
