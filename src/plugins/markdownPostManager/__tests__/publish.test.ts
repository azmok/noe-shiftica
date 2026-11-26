import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { describe, expect, it } from 'vitest'
import { allowedPath } from '../manager/endpoints'

const source = fs.readFileSync(path.resolve('public/mpm-app/store.js'), 'utf8')
const MD = 'dev/a/a.md'
const BRANCH = 'draft/a'
const DRAFT = '---\ntitle: A\nstatus: draft\n---\nbody\n'
const PUBLISHED = DRAFT.replace('draft', 'published')

type Files = Record<string, string>
const tree = (files: Files) =>
  Object.entries(files).map(([p, text]) => ({ path: p, type: 'blob', mode: '100644', sha: 's:' + text }))

/** GitHub の代わり。書き込みは writes に残す */
function setup(opts: { main: Files; draft?: Files; base?: Files; movedHead?: boolean }) {
  const writes: { method: string; path: string; body: any }[] = []
  const trees: Record<string, Files> = { M: opts.main, D: opts.draft ?? {}, B: opts.base ?? opts.main }
  let mainReads = 0
  const fetchMock = async (url: string, init: any) => {
    const full = new URL('http://x' + url).searchParams.get('path') ?? ''
    if (!full.startsWith('/repos/azmok/noe-posts/git/blobs/') && !allowedPath(full, 'azmok/noe-posts')) return new Response('{}', { status: 403 })
    const p = decodeURIComponent(full).replace('/repos/azmok/noe-posts', '')
    const body = init.body ? JSON.parse(init.body) : undefined
    const ok = (json: unknown) => new Response(JSON.stringify(json), { status: 200 })
    if (init.method !== 'GET') writes.push({ method: init.method, path: p, body })
    if (p.startsWith('/branches')) return ok(opts.draft ? [{ name: 'main' }, { name: BRANCH }] : [{ name: 'main' }])
    if (p === '/git/ref/heads/main') return ok({ object: { sha: opts.movedHead && mainReads++ > 0 ? 'M2' : 'M' } })
    if (p === '/git/ref/heads/' + BRANCH) return ok({ object: { sha: 'D' } })
    if (p === '/compare/M...D') return ok({ merge_base_commit: { sha: 'B' } })
    if (p.startsWith('/git/trees/')) return ok({ tree: tree(trees[p.split('/')[3].split('?')[0]]) })
    if (p === '/git/blobs') return ok({ sha: 's:' + Buffer.from(body.content, 'base64').toString('utf8') })
    if (p.startsWith('/git/blobs/')) return ok({ content: Buffer.from(p.slice('/git/blobs/s:'.length), 'utf8').toString('base64') })
    if (p.startsWith('/git/commits/')) return ok({ tree: { sha: 'T' } })
    if (p === '/git/trees') return ok({ sha: 'T2' })
    if (p === '/git/commits') return ok({ sha: 'C2' })
    if (p === '/git/refs/heads/main') return ok({})
    return new Response(JSON.stringify({ message: 'unexpected ' + p }), { status: 500 })
  }
  const window: any = {}
  vm.runInNewContext(source, {
    window, fetch: fetchMock, location: { pathname: '/mpm-app/index.html', hostname: 'x' }, localStorage: { getItem: () => null },
    TextEncoder, TextDecoder, Uint8Array, atob, btoa, encodeURIComponent, decodeURI, setTimeout,
  })
  return { store: window.NoeStore, writes }
}
const committed = (writes: any[]) => {
  const t = writes.find((w) => w.path === '/git/trees')
  return t && Object.fromEntries(t.body.tree.map((n: any) => [n.path, n.sha]))
}
const touchedMain = (writes: any[]) => writes.some((w) => w.method === 'PATCH')

describe('store.publish', () => {
  it('puts only this article on main, in one commit, without forcing', async () => {
    const { store, writes } = setup({
      main: { 'dev/other/other.md': 'x' },
      draft: { [MD]: DRAFT, 'dev/a/1.png': 'img', 'dev/other/other.md': 'changed' },
      base: { 'dev/other/other.md': 'x' },
    })
    const r = await store.publish(MD, DRAFT, PUBLISHED)
    expect(r.sha).toBe('C2')
    expect(committed(writes)).toEqual({ [MD]: 's:' + PUBLISHED, 'dev/a/1.png': 's:img' })
    expect(writes.find((w) => w.method === 'PATCH')!.body).toEqual({ sha: 'C2' })
    expect(writes.some((w) => w.method === 'DELETE')).toBe(false)
  })

  it('publishes an article that only exists on main', async () => {
    const { store, writes } = setup({ main: { [MD]: DRAFT } })
    await store.publish(MD, DRAFT, PUBLISHED)
    expect(committed(writes)).toEqual({ [MD]: 's:' + PUBLISHED })
  })

  it('writes LF so that publish.yml can read the status', async () => {
    const crlf = DRAFT.replace(/\n/g, '\r\n')
    const { store, writes } = setup({ main: { [MD]: crlf } })
    await store.publish(MD, DRAFT, PUBLISHED.replace(/\n/g, '\r\n'))
    expect(committed(writes)).toEqual({ [MD]: 's:' + PUBLISHED })
  })

  it('keeps files that only changed on main', async () => {
    const { store, writes } = setup({
      main: { [MD]: 'old', 'dev/a/1.png': 'new' },
      draft: { [MD]: DRAFT, 'dev/a/1.png': 'img' },
      base: { [MD]: 'old', 'dev/a/1.png': 'img' },
    })
    await store.publish(MD, DRAFT, PUBLISHED)
    expect(committed(writes)).toEqual({ [MD]: 's:' + PUBLISHED })
  })

  it.each([
    ['article edited on both sides', { main: { [MD]: 'm' }, draft: { [MD]: DRAFT }, base: { [MD]: 'o' } }, 'main の方でも'],
    ['article already removed from main', { main: {}, draft: { [MD]: DRAFT }, base: { [MD]: DRAFT } }, 'main の方でも'],
    ['GitHub differs from what was confirmed', { main: {}, draft: { [MD]: DRAFT + 'x' }, base: {} }, '開いたあとに'],
    ['article not found', { main: {} }, '見つかりません'],
    ['main moved meanwhile', { main: { [MD]: DRAFT }, movedHead: true }, '先に更新'],
  ])('stops when: %s', async (_name, opts, message) => {
    const { store, writes } = setup(opts as any)
    await expect(store.publish(MD, DRAFT, PUBLISHED)).rejects.toThrow(message)
    expect(touchedMain(writes)).toBe(false)
  })

  it('stops when the same content is already published', async () => {
    const { store, writes } = setup({ main: { [MD]: PUBLISHED } })
    await expect(store.publish(MD, PUBLISHED, PUBLISHED)).rejects.toThrow('もう公開')
    expect(touchedMain(writes)).toBe(false)
  })

  it.each(['dev/a.md', 'dev/_fin/a/a.md', 'dev/a/b.md', ''])('refuses the path %j', async (p) => {
    const { store, writes } = setup({ main: {} })
    await expect(store.publish(p, DRAFT, PUBLISHED)).rejects.toThrow('公開できるのは')
    expect(writes).toEqual([])
  })

  it.each(['', DRAFT, 'body\nstatus: published\n'])('refuses text that is not marked published: %j', async (text) => {
    const { store, writes } = setup({ main: { [MD]: DRAFT } })
    await expect(store.publish(MD, DRAFT, text)).rejects.toThrow('status')
    expect(writes).toEqual([])
  })
})
