import { describe, it, expect } from 'vitest'
import { customAssetsPlugin } from '@/plugins/customAssets'

describe('customAssetsPlugin', () => {
  it('appends customCss / customJs to the listed collections only', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = customAssetsPlugin({ collections: ['posts', 'tech-posts'] })({
      collections: [
        { slug: 'posts', fields: [{ name: 'title', type: 'text' }] },
        { slug: 'tech-posts', fields: [{ name: 'title', type: 'text' }] },
        { slug: 'media', fields: [{ name: 'alt', type: 'text' }] },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const names = (slug: string) =>
      config.collections.find((c: { slug: string }) => c.slug === slug).fields.map((f: { name: string }) => f.name)
    expect(names('posts')).toEqual(['title', 'customCss', 'customJs'])
    expect(names('tech-posts')).toEqual(['title', 'customCss', 'customJs'])
    expect(names('media')).toEqual(['alt'])
  })

  it('keeps the field shape the DB columns rely on (textarea, same names)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = customAssetsPlugin({ collections: ['posts'] })({ collections: [{ slug: 'posts', fields: [] }] } as any)
    expect(config.collections[0].fields.map((f: { name: string; type: string }) => [f.name, f.type])).toEqual([
      ['customCss', 'textarea'],
      ['customJs', 'textarea'],
    ])
  })
})
