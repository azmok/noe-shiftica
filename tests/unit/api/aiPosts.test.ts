/**
 * Unit tests: POST /api/ai/posts (Payload and the markdown converter are mocked)
 *
 * Covers the article-folder flow: frontmatter fallback, preview-markup stripping,
 * image upload / reuse, multiple categories, and publishing an existing draft.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPayload = vi.hoisted(() => ({
  auth: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: vi.fn(async () => mockPayload) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/translateToSlug', () => ({ translateToSlug: vi.fn(async () => 'translated-slug') }))

import { POST } from '@/app/api/ai/posts/route'

type Perms = Record<string, Record<string, boolean>>

const apiClient = (permissions: Perms) => ({
  id: 7,
  collection: 'api-clients',
  name: 'クラやん',
  enabled: true,
  permissions,
})

const fullPerms: Perms = {
  techPosts: { read: true, create: true, update: true, publish: true },
  media: { read: true, create: true },
  categories: { read: true },
}

const markdown = `---
title: "記事タイトル"
slug: "the-article"
description: "説明文"
---

<link rel="stylesheet" href="../../../_css/md/ini.md.css" />

<h1 class="text-gradient">記事タイトル</h1>

本文です。

![01_new](./01_new.png)

![02_existing](./02_existing.png)
`

const tinyPng = Buffer.from('fake-png').toString('base64')

// Converter stub: one paragraph per non-empty, non-frontmatter line.
let convertedMarkdown = ''
const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
  convertedMarkdown = init.body
  const body = init.body.replace(/^---[\s\S]*?---\n/, '')
  const children = body
    .split('\n')
    .filter((l) => l.trim())
    .map((text) =>
      text.startsWith('LINK:')
        ? {
            type: 'paragraph',
            children: [{ type: 'link', fields: { url: text.slice(5).trim(), linkType: 'custom', newTab: false }, children: [] }],
          }
        : { type: 'paragraph', children: [{ type: 'text', text: text.trim() }] },
    )
  return new Response(JSON.stringify({ lexical: { root: { type: 'root', children } }, frontmatter: {} }), {
    status: 200,
  })
})

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/ai/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'k' },
    body: JSON.stringify(body),
  })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const post = async (body: unknown) => POST(makeRequest(body) as any)

let existingPosts: Record<string, unknown>[] = []
let existingSize = 1234

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  existingPosts = []
  existingSize = 1234
  mockPayload.auth.mockResolvedValue({ user: apiClient(fullPerms) })
  mockPayload.find.mockImplementation(async ({ collection, where }) => {
    if (collection === 'media') {
      return { docs: where.filename.equals === '02_existing.png' ? [{ id: 202, filesize: existingSize }] : [] }
    }
    if (collection === 'categories') {
      return { docs: where.name.equals === 'ナレッジ' ? [{ id: 100 }] : [] }
    }
    return { docs: existingPosts }
  })
  mockPayload.create.mockImplementation(async ({ collection, data }) => {
    if (collection === 'media') return { id: 101 }
    if (collection === 'api-logs') return {}
    return { id: 55, slug: data.slug, _status: data._status }
  })
  mockPayload.update.mockImplementation(async ({ id, data }) => ({ id, ...data }))
})

const createdPost = () => mockPayload.create.mock.calls.find(([a]) => a.collection === 'tech-posts')?.[0]
const lastLog = () => mockPayload.create.mock.calls.filter(([a]) => a.collection === 'api-logs').pop()?.[0].data

describe('POST /api/ai/posts — article folder flow', () => {
  it('creates a draft with frontmatter metadata, uploaded / reused images and multiple categories', async () => {
    const res = await post({
      collection: 'tech-posts',
      markdown,
      images: [{ filename: '01_new.png', data: tinyPng }],
      categories: [22, 'ナレッジ'],
      tags: ['Markdown'],
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toMatchObject({ success: true, operation: 'create', slug: 'the-article', mediaIds: [101, 202] })

    // preview-only markup never reaches the converter
    expect(convertedMarkdown).not.toContain('<h1')
    expect(convertedMarkdown).not.toContain('<link')

    // the new image is uploaded as the caller, the existing one is reused
    const mediaCreate = mockPayload.create.mock.calls.find(([a]) => a.collection === 'media')![0]
    expect(mediaCreate).toMatchObject({
      data: { alt: '01_new' },
      file: { name: '01_new.png', mimetype: 'image/png' },
      overrideAccess: false,
    })
    expect(mockPayload.create.mock.calls.filter(([a]) => a.collection === 'media')).toHaveLength(1)

    const data = createdPost()!.data
    expect(data).toMatchObject({
      title: '記事タイトル',
      slug: 'the-article',
      description: '説明文',
      categories: [22, 100],
      _status: 'draft',
    })
    const uploads = data.content.root.children.filter((n: { type: string }) => n.type === 'upload')
    expect(uploads.map((n: { value: number }) => n.value)).toEqual([101, 202])
    expect(lastLog()).toMatchObject({ status: 'success', clientName: 'クラやん' })
  })

  it('reuses a same-name media only when the sent file has the same size', async () => {
    const same = Buffer.from('same-bytes')
    existingSize = same.length
    const res = await post({
      collection: 'tech-posts',
      markdown,
      images: [
        { filename: '01_new.png', data: tinyPng },
        { filename: '02_existing.png', data: same.toString('base64') },
      ],
    })
    expect((await res.json()).mediaIds).toEqual([101, 202])
    expect(mockPayload.create.mock.calls.filter(([a]) => a.collection === 'media')).toHaveLength(1)
  })

  it('uploads a new media when a same-name file in the library is a different image', async () => {
    const res = await post({
      collection: 'tech-posts',
      markdown,
      images: [
        { filename: '01_new.png', data: tinyPng },
        { filename: '02_existing.png', data: Buffer.from('different-image').toString('base64') },
      ],
    })
    expect((await res.json()).mediaIds).toEqual([101, 101])
    expect(mockPayload.create.mock.calls.filter(([a]) => a.collection === 'media')).toHaveLength(2)
  })

  it('saves every link to open in a new tab', async () => {
    const res = await post({
      collection: 'tech-posts',
      markdown: '---\ntitle: "T"\nslug: "t"\n---\n\nLINK: https://example.com',
    })
    expect(res.status).toBe(201)
    const link = createdPost()!.data.content.root.children[0].children[0]
    expect(link).toMatchObject({ type: 'link', fields: { url: 'https://example.com', newTab: true } })
  })

  it('rejects a referenced image that was not sent', async () => {
    const res = await post({ collection: 'tech-posts', markdown, images: [] })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('01_new.png')
    expect(createdPost()).toBeUndefined()
  })

  it('rejects uploads when the key has no Media create permission', async () => {
    mockPayload.auth.mockResolvedValue({
      user: apiClient({ ...fullPerms, media: { read: true, create: false } }),
    })
    const res = await post({ collection: 'tech-posts', markdown, images: [{ filename: '01_new.png', data: tinyPng }] })
    expect(res.status).toBe(403)
    expect(createdPost()).toBeUndefined()
  })

  it('rejects unsupported image types', async () => {
    const res = await post({
      collection: 'tech-posts',
      markdown,
      images: [{ filename: 'evil.svg', data: tinyPng }],
    })
    expect(res.status).toBe(400)
  })

  it('rejects unknown category names', async () => {
    const res = await post({
      collection: 'tech-posts',
      markdown,
      images: [{ filename: '01_new.png', data: tinyPng }],
      categories: ['存在しない'],
    })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('存在しない')
  })

  it('still accepts the legacy single category', async () => {
    const res = await post({
      collection: 'tech-posts',
      markdown: '---\ntitle: "T"\nslug: "t"\n---\n\n本文',
      category: 'ナレッジ',
    })
    expect(res.status).toBe(201)
    expect(createdPost()!.data.categories).toEqual([100])
  })
})

describe('POST /api/ai/posts — publish an existing draft', () => {
  const draft = { id: 55, title: '記事タイトル', slug: 'the-article', content: { root: {} }, _status: 'draft' }

  it('publishes the latest draft as-is when only slug + status are sent', async () => {
    existingPosts = [draft]
    const res = await post({ collection: 'tech-posts', slug: 'the-article', status: 'published' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ operation: 'publish', status: 'published' })
    const update = mockPayload.update.mock.calls[0][0]
    expect(update).toMatchObject({
      collection: 'tech-posts',
      id: 55,
      data: { title: '記事タイトル', content: { root: {} }, _status: 'published' },
      overrideAccess: false,
    })
    // the draft lookup reads the latest version
    expect(mockPayload.find.mock.calls.find(([a]) => a.collection === 'tech-posts')![0]).toMatchObject({ draft: true })
  })

  it('refuses to publish without the publish permission', async () => {
    existingPosts = [draft]
    mockPayload.auth.mockResolvedValue({
      user: apiClient({ ...fullPerms, techPosts: { read: true, create: true, update: true, publish: false } }),
    })
    const res = await post({ collection: 'tech-posts', slug: 'the-article', status: 'published' })
    expect(res.status).toBe(403)
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('returns 404 when the slug does not exist', async () => {
    const res = await post({ collection: 'tech-posts', slug: 'nope', status: 'published' })
    expect(res.status).toBe(404)
  })
})
