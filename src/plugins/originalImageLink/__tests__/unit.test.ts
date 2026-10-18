/**
 * Unit tests: originalImageLink plugin
 *
 * Body images (Lexical upload nodes) are wrapped in a link to the original
 * Media file that opens in a new tab; anything else renders unchanged.
 */

import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { originalImageUrl, withOriginalImageLink } from '@/plugins/originalImageLink/converter'

const ORIGINAL = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/photo.png?alt=media&'

const image = {
  url: ORIGINAL,
  mimeType: 'image/png',
  alt: '図1',
  filename: 'photo.png',
  sizes: { medium: { url: 'https://example.com/photo-800.webp' } },
}

// Stand-in for the default converter: renders the medium variant
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base = ({ node }: any) =>
  typeof node.value === 'object' ? React.createElement('img', { src: node.value.sizes?.medium?.url ?? node.value.url }) : null

const render = (value: unknown) => {
  const converter = withOriginalImageLink(base) as (args: unknown) => React.ReactNode
  const out = converter({ node: { type: 'upload', value }, childIndex: 0, converters: {}, nodesToJSX: () => [], parent: {} })
  return out === null || out === undefined ? out : renderToStaticMarkup(React.createElement(React.Fragment, null, out))
}

describe('originalImageUrl', () => {
  it('returns the original url for populated image uploads only', () => {
    expect(originalImageUrl(image)).toBe(ORIGINAL)
    expect(originalImageUrl({ ...image, mimeType: 'application/pdf' })).toBeNull()
    expect(originalImageUrl(42)).toBeNull()
    expect(originalImageUrl({ ...image, url: null })).toBeNull()
  })
})

describe('withOriginalImageLink', () => {
  it('wraps the rendered image in a new-tab link to the original file', () => {
    const html = render(image)!
    expect(html).toContain(`href="${ORIGINAL.replace(/&/g, '&amp;')}"`)
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('aria-label="図1（原寸画像を新しいタブで開く）"')
    // the displayed image is still the variant chosen by the base converter
    expect(html).toContain('src="https://example.com/photo-800.webp"')
  })

  it('leaves non-image uploads as rendered by the base converter', () => {
    const html = render({ ...image, mimeType: 'application/pdf' })!
    expect(html).toContain('<img src="https://example.com/photo-800.webp"/>')
    expect(html).not.toContain('<a ')
  })

  it('renders nothing when the upload is not populated', () => {
    expect(render(42)).toBeNull()
  })
})
