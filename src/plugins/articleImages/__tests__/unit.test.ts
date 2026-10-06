/**
 * Unit tests: articleImages plugin — srcset construction and the upload converter markup.
 */
import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildImageSources } from '../sources'
import { articleImageConverters } from '../converter'

const url = (name: string) => `https://cdn.example/${name}`

describe('buildImageSources', () => {
    it('orders variants + original by width as a w-descriptor srcset', () => {
        const result = buildImageSources({
            url: url('orig.webp'),
            width: 2752,
            height: 1536,
            sizes: {
                adminList: { url: url('admin.webp'), width: 100 },
                large: { url: url('large.webp'), width: 1920 },
                thumbnail: { url: url('thumb.webp'), width: 400 },
                medium: { url: url('medium.webp'), width: 800 },
                og: { url: url('og.jpg'), width: 1200 },
            },
        })
        expect(result).toEqual({
            src: url('medium.webp'),
            srcSet: `${url('thumb.webp')} 400w, ${url('medium.webp')} 800w, ${url('large.webp')} 1920w, ${url('orig.webp')} 2752w`,
            originalUrl: url('orig.webp'),
            width: 2752,
            height: 1536,
        })
    })

    it('drops variants that are missing or not narrower than the original', () => {
        const result = buildImageSources({
            url: url('orig.png'),
            width: 800,
            height: 600,
            sizes: {
                thumbnail: { url: url('thumb.webp'), width: 400 },
                medium: { url: url('medium.webp'), width: 800 },
                large: { url: null, width: null },
            },
        })
        expect(result?.srcSet).toBe(`${url('thumb.webp')} 400w, ${url('orig.png')} 800w`)
    })

    it('falls back to the original when there are no sizes', () => {
        const result = buildImageSources({ url: url('orig.webp'), width: 640, height: 480 })
        expect(result?.src).toBe(url('orig.webp'))
        expect(result?.srcSet).toBe(`${url('orig.webp')} 640w`)
    })

    it('returns null without a URL', () => {
        expect(buildImageSources({ url: null })).toBeNull()
    })
})

describe('articleImageConverters.upload', () => {
    const render = (value: unknown) => {
        const upload = articleImageConverters.upload as (args: { node: unknown }) => React.ReactNode
        return renderToStaticMarkup(
            React.createElement(React.Fragment, null, upload({ node: { type: 'upload', relationTo: 'media', fields: {}, value } })),
        )
    }

    it('renders a lazy srcset image linked to the original in a new tab', () => {
        const html = render({
            url: url('orig.webp'), mimeType: 'image/webp', alt: 'diagram', width: 2000, height: 1000,
            sizes: { medium: { url: url('medium.webp'), width: 800 } },
        })
        expect(html).toContain(`href="${url('orig.webp')}"`)
        expect(html).toContain('target="_blank"')
        expect(html).toContain('rel="noopener noreferrer"')
        expect(html).toContain(`srcSet="${url('medium.webp')} 800w, ${url('orig.webp')} 2000w"`)
        expect(html).toContain('loading="lazy"')
        expect(html).toContain('alt="diagram"')
    })

    it('renders nothing for an unpopulated relation', () => {
        expect(render(42)).toBe('')
    })
})
