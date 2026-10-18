/**
 * Unit tests: ai-api plugin (Payload and the markdown converter are mocked)
 *
 * Covers the plugin registration, the /api/ai/posts endpoints (article-folder flow:
 * frontmatter fallback, preview-markup stripping, image upload / reuse, multiple
 * categories, publishing an existing draft, delete) and the markdown helpers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPayload = vi.hoisted(() => ({
  auth: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  findByID: vi.fn(),
  delete: vi.fn(),
}))

// Converter stub: one paragraph per non-empty, non-frontmatter line.
let convertedMarkdown = ''
const parseMarkdownToLexical = vi.hoisted(() => vi.fn())

vi.mock('@/plugins/markdownImport', () => ({ parseMarkdownToLexical }))
vi.mock('@/lib/translateToSlug', () => ({ translateToSlug: vi.fn(async () => 'translated-slug') }))

import { aiApiPlugin } from '@/plugins/ai-api'
import { aiPostsCreateHandler, aiPostsDeleteHandler } from '@/plugins/ai-api/endpoints/posts'
import { openLinksInNewTab, prepareArticleMarkdown, replaceImagePlaceholders } from '@/plugins/ai-api/markdown'

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

const convertStub = async (markdown: string) => {
  convertedMarkdown = markdown
  const body = markdown.replace(/^---[\s\S]*?---\n/, '')
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
  return { lexical: { root: { type: 'root', children } }, frontmatter: {} }
}

/** A Request shaped like the PayloadRequest that Payload passes to endpoint handlers */
const makeReq = (method: string, url: string, init: { body?: unknown; user?: unknown } = {}) => {
  const request = new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'k' },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  })
  return Object.assign(request, {
    payload: { ...mockPayload, config: { editor: {} } },
    user: init.user ?? null,
    searchParams: new URL(url).searchParams,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any
}

const post = async (body: unknown) =>
  aiPostsCreateHandler(makeReq('POST', 'http://localhost/api/ai/posts', { body }))

let existingPosts: Record<string, unknown>[] = []
let existingSize = 1234

beforeEach(() => {
  vi.clearAllMocks()
  parseMarkdownToLexical.mockImplementation(convertStub)
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

describe('aiApiPlugin', () => {
  it('registers POST / DELETE /ai/posts and the api-logs collection, keeping existing config', () => {
    const existing = { path: '/convert-markdown', method: 'post' as const, handler: vi.fn() }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = aiApiPlugin()({ collections: [{ slug: 'posts', fields: [] }], endpoints: [existing] } as any)
    expect(config.collections.map((c: { slug: string }) => c.slug)).toEqual(['posts', 'api-logs'])
    expect(config.endpoints[0]).toBe(existing)
    expect(config.endpoints.slice(1)).toEqual([
      { path: '/ai/posts', method: 'post', handler: aiPostsCreateHandler },
      { path: '/ai/posts', method: 'delete', handler: aiPostsDeleteHandler },
    ])
    const logs = config.collections[1]
    expect(logs.admin.components.beforeListTable).toEqual([
      '@/plugins/ai-api/components/ApiEndpointGuide#ApiEndpointGuide',
    ])
  })
})

describe('POST /api/ai/posts — auth', () => {
  it('normalizes x-api-key to the api-clients API-Key header', async () => {
    await post({ collection: 'tech-posts', markdown: '---\ntitle: "T"\nslug: "t"\n---\n\n本文' })
    const { headers } = mockPayload.auth.mock.calls[0][0]
    expect(headers.get('authorization')).toBe('api-clients API-Key k')
  })

  it('normalizes Authorization: Bearer as well', async () => {
    const req = makeReq('POST', 'http://localhost/api/ai/posts', {
      body: { collection: 'tech-posts', markdown: '---\ntitle: "T"\nslug: "t"\n---\n\n本文' },
    })
    req.headers.delete('x-api-key')
    req.headers.set('authorization', 'Bearer abc')
    await aiPostsCreateHandler(req)
    expect(mockPayload.auth.mock.calls[0][0].headers.get('authorization')).toBe('api-clients API-Key abc')
  })

  it('uses the user Payload already authenticated without re-authenticating', async () => {
    const req = makeReq('POST', 'http://localhost/api/ai/posts', {
      body: { collection: 'tech-posts', markdown: '---\ntitle: "T"\nslug: "t"\n---\n\n本文' },
      user: apiClient(fullPerms),
    })
    const res = await aiPostsCreateHandler(req)
    expect(res.status).toBe(201)
    expect(mockPayload.auth).not.toHaveBeenCalled()
  })

  it('returns 401 and logs it when the key is invalid', async () => {
    mockPayload.auth.mockResolvedValue({ user: null })
    const res = await post({ collection: 'tech-posts', markdown: 'x' })
    expect(res.status).toBe(401)
    expect(lastLog()).toMatchObject({ status: 'error', responseStatus: 401, clientName: '（認証失敗）' })
  })

  it('rejects a disabled API client', async () => {
    mockPayload.auth.mockResolvedValue({ user: { ...apiClient(fullPerms), enabled: false } })
    const res = await post({ collection: 'tech-posts', markdown: 'x' })
    expect(res.status).toBe(401)
  })
})

describe('POST /api/ai/posts — article folder flow', () => {
  it('converts the markdown in-process with the Payload config', async () => {
    await post({ collection: 'tech-posts', markdown: '---\ntitle: "T"\nslug: "t"\n---\n\n本文' })
    expect(parseMarkdownToLexical).toHaveBeenCalledTimes(1)
    expect(parseMarkdownToLexical.mock.calls[0][1]).toEqual({ editor: {} })
  })

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

describe('DELETE /api/ai/posts', () => {
  const del = (query: string, perms: Perms = { ...fullPerms, techPosts: { ...fullPerms.techPosts, delete: true } }) => {
    mockPayload.auth.mockResolvedValue({ user: apiClient(perms) })
    return aiPostsDeleteHandler(makeReq('DELETE', `http://localhost/api/ai/posts?${query}`))
  }

  it('deletes by slug as the caller', async () => {
    existingPosts = [{ id: 55, title: 'T', slug: 'the-article' }]
    const res = await del('slug=the-article&collection=tech-posts')
    expect(res.status).toBe(200)
    expect(mockPayload.delete).toHaveBeenCalledWith({
      collection: 'tech-posts',
      id: 55,
      user: expect.objectContaining({ name: 'クラやん' }),
      overrideAccess: false,
    })
    expect(lastLog()).toMatchObject({ action: 'delete', status: 'success' })
  })

  it('refuses without the delete permission', async () => {
    const res = await del('slug=the-article&collection=tech-posts', fullPerms)
    expect(res.status).toBe(403)
    expect(mockPayload.delete).not.toHaveBeenCalled()
  })

  it('returns 404 when the post does not exist', async () => {
    const res = await del('slug=nope&collection=tech-posts')
    expect(res.status).toBe(404)
  })
})

// --- markdown helpers ---------------------------------------------------------

const article = `---
title: "Title"
slug: "a-slug"
---

<link rel="stylesheet" href="../../../_css/md/ini.md.css" />

<h1 class="text-gradient">Title</h1>

Intro paragraph.

<!-- 書き手×読み手の2×2マトリクス図 -->
![01_writer_reader_flow](./01_writer_reader_flow.png)

<!--
multi-line
memo
-->

\`\`\`
![not-an-image](./inside-fence.png)
<h1>kept in code</h1>
\`\`\`

![](./02_no_alt.gif)

![03 encoded](./%E7%94%BB%E5%83%8F.png)

<blockquote class="twitter-tweet"><p>HTML is the new markdown.</p></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
`

describe('prepareArticleMarkdown', () => {
  const { markdown, images } = prepareArticleMarkdown(article)

  it('drops the stylesheet link, the h1, HTML comments and the widgets.js script', () => {
    expect(markdown).not.toContain('<link rel="stylesheet"')
    expect(markdown).not.toContain('<h1 class="text-gradient">')
    expect(markdown).not.toContain('<!--')
    expect(markdown).not.toContain('multi-line')
    expect(markdown).not.toContain('widgets.js')
  })

  it('keeps the X blockquote so the frontend can turn it into a card', () => {
    expect(markdown).toContain('<blockquote class="twitter-tweet">')
  })

  it('replaces image lines with placeholders (alt falls back to the file name, paths are decoded)', () => {
    expect(images).toEqual([
      { src: '01_writer_reader_flow.png', alt: '01_writer_reader_flow' },
      { src: '02_no_alt.gif', alt: '02_no_alt' },
      { src: '画像.png', alt: '03 encoded' },
    ])
    expect(markdown).toContain('MDIMAGEPLACEHOLDER0END')
    expect(markdown).toContain('MDIMAGEPLACEHOLDER2END')
  })

  it('leaves fenced code untouched', () => {
    expect(markdown).toContain('![not-an-image](./inside-fence.png)')
    expect(markdown).toContain('<h1>kept in code</h1>')
  })

  it('keeps the frontmatter for the converter', () => {
    expect(markdown.startsWith('---\ntitle: "Title"')).toBe(true)
  })
})

describe('replaceImagePlaceholders', () => {
  const paragraph = (text: string) => ({ type: 'paragraph', children: [{ type: 'text', text }] })

  it('swaps placeholder paragraphs for media upload nodes', () => {
    const lexical = {
      root: { type: 'root', children: [paragraph('Intro'), paragraph('MDIMAGEPLACEHOLDER0END')] },
    }
    replaceImagePlaceholders(lexical, [42])
    expect(lexical.root.children[0]).toEqual(paragraph('Intro'))
    expect(lexical.root.children[1]).toEqual({
      type: 'upload',
      relationTo: 'media',
      value: 42,
      fields: null,
      format: '',
      version: 3,
    })
  })

  it('throws when a placeholder has no uploaded media', () => {
    const lexical = { root: { type: 'root', children: [paragraph('MDIMAGEPLACEHOLDER3END')] } }
    expect(() => replaceImagePlaceholders(lexical, [1])).toThrow()
  })

  it('throws when a placeholder ended up inside other text', () => {
    const lexical = {
      root: { type: 'root', children: [{ type: 'list', children: [paragraph('x MDIMAGEPLACEHOLDER0END')] }] },
    }
    expect(() => replaceImagePlaceholders(lexical, [1])).toThrow()
  })
})

describe('openLinksInNewTab', () => {
  it('sets newTab on every link and autolink, keeping the other fields', () => {
    const lexical = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'link', fields: { url: 'https://example.com', linkType: 'custom', newTab: false }, children: [] },
              { type: 'text', text: 'plain' },
            ],
          },
          { type: 'list', children: [{ type: 'listitem', children: [{ type: 'autolink', fields: { url: 'https://a.b' } }] }] },
        ],
      },
    }
    openLinksInNewTab(lexical)
    const p = lexical.root.children[0] as { children: { fields?: Record<string, unknown> }[] }
    expect(p.children[0].fields).toEqual({ url: 'https://example.com', linkType: 'custom', newTab: true })
    expect(p.children[1].fields).toBeUndefined()
    const list = lexical.root.children[1] as { children: { children: { fields?: Record<string, unknown> }[] }[] }
    const auto = list.children[0].children[0]
    expect(auto.fields).toEqual({ url: 'https://a.b', newTab: true })
  })
})

