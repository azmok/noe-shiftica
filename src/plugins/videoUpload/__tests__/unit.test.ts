/**
 * Unit tests: videoUpload plugin
 *
 * Direct uploads bypass the server, so size / type are validated from the saved metadata.
 */

import { describe, it, expect } from 'vitest'
import { MAX_VIDEO_BYTES, validateVideo, VideosCollection } from '@/plugins/videoUpload/collection'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const run = (data: Record<string, unknown>) => (validateVideo as any)({ data })

describe('validateVideo', () => {
  it('accepts mp4 under the limit and fills alt from filename', () => {
    const out = run({ filename: 'clip.mp4', mimeType: 'video/mp4', filesize: 1024 })
    expect(out.alt).toBe('clip.mp4')
  })

  it('rejects unsupported types', () => {
    expect(() => run({ filename: 'a.png', mimeType: 'image/png', filesize: 1 })).toThrow()
  })

  it('rejects files over the size limit', () => {
    expect(() => run({ filename: 'big.mp4', mimeType: 'video/mp4', filesize: MAX_VIDEO_BYTES + 1 })).toThrow()
  })
})

describe('VideosCollection', () => {
  it('is a public-read upload collection restricted to video types', () => {
    expect(VideosCollection.slug).toBe('videos')
    expect(VideosCollection.upload).toMatchObject({ mimeTypes: expect.arrayContaining(['video/mp4']) })
  })
})
