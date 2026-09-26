import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { IncrementalCache } from 'next/dist/server/lib/incremental-cache'
import FileSystemCache from 'next/dist/server/lib/incremental-cache/file-system-cache'

type StoredObject = { data: Buffer; generation: number }

const gcs = vi.hoisted(() => {
  const objects = new Map<string, StoredObject>()
  let nextGeneration = 1
  let failAll = false

  const httpError = (code: number) => Object.assign(new Error(`HTTP ${code}`), { code })
  const tick = () => new Promise((resolve) => setImmediate(resolve))

  const file = (name: string, options?: { generation?: number }) => ({
    async download() {
      await tick()
      if (failAll) throw httpError(503)
      const stored = objects.get(name)
      if (!stored) throw httpError(404)
      if (options?.generation !== undefined && Number(options.generation) !== stored.generation) throw httpError(404)
      return [stored.data]
    },
    async getMetadata() {
      await tick()
      if (failAll) throw httpError(503)
      const stored = objects.get(name)
      if (!stored) throw httpError(404)
      return [{ generation: String(stored.generation) }]
    },
    async save(data: string, opts?: { preconditionOpts?: { ifGenerationMatch?: number } }) {
      await tick()
      if (failAll) throw httpError(503)
      const expected = opts?.preconditionOpts?.ifGenerationMatch
      if (expected !== undefined && (objects.get(name)?.generation ?? 0) !== expected) throw httpError(412)
      objects.set(name, { data: Buffer.from(data), generation: nextGeneration++ })
    },
  })

  return {
    objects,
    file,
    setFailAll: (value: boolean) => {
      failAll = value
    },
    reset: () => {
      objects.clear()
      nextGeneration = 1
      failAll = false
    },
  }
})

vi.mock('@google-cloud/storage', () => ({
  Storage: class {
    bucket() {
      return { file: gcs.file }
    }
  },
}))

const BLOG_TAGS = '_N_T_/layout,_N_T_/(frontend)/layout,_N_T_/(frontend)/blog/layout,_N_T_/(frontend)/blog/page,_N_T_/blog'

let serverDistDir: string
let GcsCacheHandler: typeof import('../../../cache-handler.mjs').default

beforeAll(async () => {
  const distDir = mkdtempSync(path.join(tmpdir(), 'isr-cache-'))
  writeFileSync(path.join(distDir, 'BUILD_ID'), 'test-build')
  serverDistDir = path.join(distDir, 'server')
  mkdirSync(serverDistDir)
  GcsCacheHandler = (await import('../../../cache-handler.mjs')).default
})

beforeEach(() => {
  gcs.reset()
  vi.stubEnv('ISR_CACHE_GCS_BUCKET', 'test-bucket')
  vi.stubEnv('NEXT_PHASE', 'phase-production-server')
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-25T00:00:00Z'))
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

// Each IncrementalCache stands in for one Cloud Run container.
function container() {
  return new IncrementalCache({
    dev: false,
    fs: undefined,
    serverDistDir,
    requestHeaders: {},
    minimalMode: false,
    CurCacheHandler: GcsCacheHandler as never,
    getPrerenderManifest: () =>
      ({
        version: 4,
        routes: { '/blog': { initialRevalidateSeconds: false, srcRoute: '/blog', dataRoute: '/blog.rsc' } },
        dynamicRoutes: {},
        notFoundRoutes: [],
        preview: { previewModeId: 'test', previewModeSigningKey: 'k', previewModeEncryptionKey: 'k' },
      }) as never,
  })
}

function blogPage(html: string) {
  return {
    kind: 'APP_PAGE' as const,
    html,
    rscData: Buffer.from(`rsc:${html}`),
    headers: { 'x-next-cache-tags': BLOG_TAGS },
    status: 200,
    postponed: undefined,
    segmentData: new Map([['/_tree', Buffer.from(`tree:${html}`)]]),
  }
}

const getBlog = (cache: IncrementalCache) =>
  cache.get('/blog', { kind: 'APP_PAGE' as never, isRoutePPREnabled: false, isFallback: false })

const setBlog = (cache: IncrementalCache, html: string) =>
  cache.set('/blog', blogPage(html) as never, { cacheControl: { revalidate: false, expire: undefined }, isRoutePPREnabled: false, isFallback: false })

const advance = (ms: number) => vi.setSystemTime(Date.now() + ms)

describe('GCS ISR cache handler', () => {
  it('serves a page revalidated on one container to a brand-new container (the /blog bug)', async () => {
    const containerA = container()
    await setBlog(containerA, 'posts: A,B')

    advance(1000)
    await containerA.revalidateTag(['_N_T_/blog'])
    expect(await getBlog(containerA)).toBeNull()

    advance(1000)
    await setBlog(containerA, 'posts: A,B,C')

    // Cold start: a new container that never saw the revalidation.
    const containerC = container()
    const entry = await getBlog(containerC)
    expect((entry?.value as { html: string }).html).toBe('posts: A,B,C')
  })

  it('makes other running containers drop their copy when one container revalidates', async () => {
    const containerA = container()
    const containerB = container()
    await setBlog(containerA, 'posts: A,B')
    expect((await getBlog(containerB))?.value).toMatchObject({ html: 'posts: A,B' })

    advance(1000)
    await containerA.revalidateTag(['_N_T_/blog'])

    expect(await getBlog(containerB)).toBeNull()
  })

  it('keeps entries written after the revalidation', async () => {
    const cache = container()
    await cache.revalidateTag(['_N_T_/blog'])
    advance(1000)
    await setBlog(cache, 'fresh')

    expect((await getBlog(cache))?.value).toMatchObject({ html: 'fresh' })
  })

  it('ignores revalidations of unrelated paths', async () => {
    const cache = container()
    await setBlog(cache, 'posts: A,B')
    advance(1000)
    await cache.revalidateTag(['_N_T_/dev'])

    expect((await getBlog(cache))?.value).toMatchObject({ html: 'posts: A,B' })
  })

  it('round-trips binary RSC and segment data', async () => {
    const cache = container()
    await setBlog(cache, 'binary')

    const value = (await getBlog(cache))?.value as ReturnType<typeof blogPage>
    expect(Buffer.isBuffer(value.rscData)).toBe(true)
    expect(value.rscData.toString()).toBe('rsc:binary')
    expect(value.segmentData).toBeInstanceOf(Map)
    expect(value.segmentData.get('/_tree')?.toString()).toBe('tree:binary')
  })

  it('shares route handler output such as /sitemap.xml across containers', async () => {
    const setSitemap = (cache: IncrementalCache, xml: string) =>
      cache.set(
        '/sitemap.xml',
        {
          kind: 'APP_ROUTE',
          body: Buffer.from(xml),
          status: 200,
          headers: { 'content-type': 'application/xml', 'x-next-cache-tags': '_N_T_/layout,_N_T_/sitemap.xml/layout,_N_T_/sitemap.xml/route,_N_T_/sitemap.xml' },
        } as never,
        { cacheControl: { revalidate: false, expire: undefined }, isRoutePPREnabled: false, isFallback: false },
      )
    const getSitemap = (cache: IncrementalCache) =>
      cache.get('/sitemap.xml', { kind: 'APP_ROUTE' as never, isRoutePPREnabled: false, isFallback: false })

    const containerA = container()
    await setSitemap(containerA, '<loc>/blog/a</loc>')
    advance(1000)
    await containerA.revalidateTag(['_N_T_/sitemap.xml'])
    expect(await getSitemap(container())).toBeNull()

    advance(1000)
    await setSitemap(containerA, '<loc>/blog/a</loc><loc>/blog/c</loc>')
    const value = (await getSitemap(container()))?.value as { body: Buffer }
    expect(value.body.toString()).toBe('<loc>/blog/a</loc><loc>/blog/c</loc>')
  })

  it('does not lose either tag when two containers revalidate at the same time', async () => {
    const containerA = container()
    const containerB = container()
    await setBlog(containerA, 'posts')
    advance(1000)

    await Promise.all([containerA.revalidateTag(['_N_T_/blog']), containerB.revalidateTag(['_N_T_/dev'])])

    const manifest = JSON.parse(gcs.objects.get('_next-isr-cache/test-build/tags.json')!.data.toString())
    expect(Object.keys(manifest).sort()).toEqual(['_N_T_/blog', '_N_T_/dev'])
  })

  it('falls back to a fresh render and does not throw when GCS is unavailable', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    const cache = container()
    await setBlog(cache, 'posts')
    gcs.setFailAll(true)

    expect(await getBlog(cache)).toBeNull()
    await expect(cache.revalidateTag(['_N_T_/blog'])).resolves.toBeUndefined()
    expect(errorLog).toHaveBeenCalled()
  })

  it("falls back to Next.js' default cache when ISR_CACHE_GCS_BUCKET is not set", async () => {
    vi.stubEnv('ISR_CACHE_GCS_BUCKET', '')
    const cache = container()
    await setBlog(cache, 'posts')

    expect(cache.cacheHandler).toBeInstanceOf(FileSystemCache)
    expect(gcs.objects.size).toBe(0)
  })

  it("falls back to Next.js' default cache during next build", async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    const cache = container()
    await setBlog(cache, 'posts')

    expect(cache.cacheHandler).toBeInstanceOf(FileSystemCache)
    expect(gcs.objects.size).toBe(0)
  })
})
