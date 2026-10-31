/**
 * Unit tests: videoEmbed plugin
 *
 * Video uploads render as an inline <video>; everything else is left to the base converter.
 */

import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { videoUrl, withVideoEmbed } from '@/plugins/videoEmbed/converter'

const URL_MP4 = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/clip.mp4?alt=media&'
const video = { url: URL_MP4, mimeType: 'video/mp4', alt: 'デモ', filename: 'clip.mp4' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base = () => React.createElement('span', null, 'base')

const render = (value: unknown) => {
  const converter = withVideoEmbed(base) as (args: unknown) => React.ReactNode
  const out = converter({ node: { type: 'upload', value }, childIndex: 0, converters: {}, nodesToJSX: () => [], parent: {} })
  return renderToStaticMarkup(React.createElement(React.Fragment, null, out))
}

describe('videoUrl', () => {
  it('returns the url for populated video uploads only', () => {
    expect(videoUrl(video)).toBe(URL_MP4)
    expect(videoUrl({ ...video, mimeType: 'image/png' })).toBeNull()
    expect(videoUrl(42)).toBeNull()
    expect(videoUrl({ ...video, url: null })).toBeNull()
  })
})

describe('withVideoEmbed', () => {
  it('renders a video player with metadata preload', () => {
    const html = render(video)
    expect(html).toContain('<video')
    expect(html).toContain('controls')
    expect(html).toContain('preload="metadata"')
    expect(html).toContain('type="video/mp4"')
  })

  it('delegates non-video uploads to the base converter', () => {
    expect(render({ ...video, mimeType: 'image/png' })).toBe('<span>base</span>')
    expect(render(42)).toBe('<span>base</span>')
  })
})
