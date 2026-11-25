import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { decryptSecret, encryptSecret, parseRepo, settingsGlobal } from '../manager/settings'
import { allowedPath, managerEndpoints } from '../manager/endpoints'

process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'test-secret'

describe('parseRepo', () => {
  it('accepts the usual GitHub URL forms', () => {
    expect(parseRepo('https://github.com/azmok/noe-posts.git')).toBe('azmok/noe-posts')
    expect(parseRepo('https://github.com/azmok/noe-posts')).toBe('azmok/noe-posts')
    expect(parseRepo('git@github.com:azmok/noe-posts.git')).toBe('azmok/noe-posts')
    expect(parseRepo('azmok/noe-posts')).toBe('azmok/noe-posts')
    expect(parseRepo('https://gitlab.com/a/b')).toBeNull()
    expect(parseRepo('')).toBeNull()
  })
})

describe('token encryption', () => {
  it('round-trips and never stores the plain token', () => {
    const enc = encryptSecret('github_pat_secret123')
    expect(enc).not.toContain('github_pat')
    expect(decryptSecret(enc)).toBe('github_pat_secret123')
    expect(encryptSecret('x')).not.toBe(encryptSecret('x'))
  })
  it('settings hook encrypts a new token, keeps the old one when empty', () => {
    const hook = settingsGlobal.hooks!.beforeChange![0] as any
    const withToken = hook({ data: { repoUrl: ' azmok/noe-posts ', token: 'github_pat_abcd1234' } })
    expect(withToken.token).toBeUndefined()
    expect(decryptSecret(withToken.tokenEncrypted)).toBe('github_pat_abcd1234')
    expect(withToken.tokenHint).toBe('…1234')
    expect(withToken.repoUrl).toBe('azmok/noe-posts')
    const without = hook({ data: { repoUrl: 'azmok/noe-posts', token: '' } })
    expect(without.tokenEncrypted).toBeUndefined()
  })
  it('hides the encrypted token from API reads', () => {
    const f: any = settingsGlobal.fields.find((x: any) => x.name === 'tokenEncrypted')
    expect(f.access.read()).toBe(false)
    const t: any = settingsGlobal.fields.find((x: any) => x.name === 'token')
    expect(t.virtual).toBe(true)
  })
})

describe('GitHub proxy', () => {
  it('only allows paths inside the configured repository', () => {
    expect(allowedPath('/repos/azmok/noe-posts', 'azmok/noe-posts')).toBe(true)
    expect(allowedPath('/repos/azmok/noe-posts/contents/dev/a.md?ref=main', 'azmok/noe-posts')).toBe(true)
    expect(allowedPath('/repos/azmok/noe-posts-evil/contents', 'azmok/noe-posts')).toBe(false)
    expect(allowedPath('/repos/azmok/other', 'azmok/noe-posts')).toBe(false)
    expect(allowedPath('/user', 'azmok/noe-posts')).toBe(false)
    expect(allowedPath('/repos/azmok/noe-posts/../other', 'azmok/noe-posts')).toBe(false)
    expect(allowedPath('https://evil.test/x', 'azmok/noe-posts')).toBe(false)
  })

  const enc = () => encryptSecret('tok-123')
  const reqOf = (over: any = {}) =>
    ({
      user: { collection: 'users' },
      method: 'GET',
      url: 'http://site.test/api/mpm/github?path=' + encodeURIComponent('/repos/azmok/noe-posts/contents/a.md'),
      headers: new Headers({ accept: 'application/vnd.github.raw' }),
      payload: { findGlobal: vi.fn(async () => ({ repoUrl: 'https://github.com/azmok/noe-posts.git', tokenEncrypted: enc(), tokenHint: '…-123' })) },
      ...over,
    }) as any
  const proxy = managerEndpoints.find((e) => e.path === '/mpm/github' && e.method === 'get')!.handler
  const config = managerEndpoints.find((e) => e.path === '/mpm/config')!.handler

  let fetchMock: any
  beforeEach(() => {
    fetchMock = vi.fn(async () => new Response('hello', { status: 200, headers: { 'content-type': 'text/plain' } }))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('adds the token on the server and passes the body through', async () => {
    const res = await proxy(reqOf())
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('hello')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/repos/azmok/noe-posts/contents/a.md')
    expect(init.headers.Authorization).toBe('Bearer tok-123')
    expect(init.headers.Accept).toBe('application/vnd.github.raw')
  })
  it('refuses anonymous callers, other repositories, and missing settings', async () => {
    expect((await proxy(reqOf({ user: null }))).status).toBe(401)
    expect((await proxy(reqOf({ user: { collection: 'api-clients' } }))).status).toBe(401)
    expect((await proxy(reqOf({ url: 'http://site.test/api/mpm/github?path=' + encodeURIComponent('/repos/x/y') }))).status).toBe(403)
    expect((await proxy(reqOf({ payload: { findGlobal: async () => ({ repoUrl: 'azmok/noe-posts' }) } }))).status).toBe(412)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('config tells the app the repository and whether a token exists, never the token itself', async () => {
    const body = await (await config(reqOf())).json()
    expect(body).toEqual({ repo: 'azmok/noe-posts', hasToken: true, tokenHint: '…-123', settingsUrl: '/admin/globals/markdown-post-manager-settings' })
    expect(JSON.stringify(body)).not.toContain('tok-123')
  })
})
