import type { PayloadRequest } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { imageEndpoints } from '../manager/imageEndpoints'
import { decryptSecret, encryptSecret, settingsGlobal } from '../manager/settings'

const key = 'sk-test-placeholder-123456789abcd'
const image = Buffer.from('RIFF0000WEBPtest').toString('base64')
const handler = (path: string, method: string) =>
  imageEndpoints.find((endpoint) => endpoint.path === path && endpoint.method === method)!.handler

describe('MPM image generation', () => {
  beforeEach(() => vi.stubEnv('PAYLOAD_SECRET', 'mpm-image-test'))
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  function request(body: object, overrides: Partial<PayloadRequest> = {}) {
    const findGlobal = vi.fn(async () => ({
      openaiKeyEncrypted: encryptSecret(key),
      openaiKeyHint: '…abcd',
    }))
    const updateGlobal = vi.fn(async () => undefined)
    const req = {
      user: { id: 1, collection: 'users' },
      headers: new Headers({ 'Content-Type': 'application/json', 'X-MPM-Request': '1' }),
      text: async () => JSON.stringify(body),
      payload: { findGlobal, updateGlobal },
      ...overrides,
    } as unknown as PayloadRequest
    return { req, updateGlobal }
  }

  it('saves through the global hook, which strips plaintext and masks the key', async () => {
    const { req, updateGlobal } = request({ key })
    const result = await handler('/mpm/image-settings', 'post')(req)
    expect(result.status).toBe(200)
    expect(await result.json()).toEqual({ configured: true, hint: '…abcd', source: 'settings' })
    expect(updateGlobal).toHaveBeenCalledWith(expect.objectContaining({
      data: { openaiKey: key },
      overrideAccess: false,
    }))

    const hook = settingsGlobal.hooks!.beforeChange![0]!
    const data = await hook({ data: { openaiKey: key } } as Parameters<typeof hook>[0])
    expect(data.openaiKey).toBeUndefined()
    expect(decryptSecret(data.openaiKeyEncrypted)).toBe(key)
    expect(data.openaiKeyHint).toBe('…abcd')
  })

  it('rejects users without an admin session and cross-site requests', async () => {
    const generate = handler('/mpm/images', 'post')
    expect((await generate(request({}, { user: null }).req)).status).toBe(401)
    expect((await generate(request({}, { headers: new Headers({
      'Content-Type': 'application/json', 'X-MPM-Request': '1', 'Sec-Fetch-Site': 'cross-site',
    }) }).req)).status).toBe(403)
  })

  it('uses the previous image for edits and keeps upstream errors private', async () => {
    const upstream = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(Response.json({ data: [{ b64_json: image }] }))
      .mockResolvedValueOnce(Response.json({ error: { message: key } }, { status: 401 }))
    vi.stubGlobal('fetch', upstream)
    const generate = handler('/mpm/images', 'post')
    const base = { kind: 'hero', prompt: 'A blue sky', context: 'Article excerpt' }

    const created = await generate(request(base).req)
    expect(await created.json()).toEqual({ image })
    expect(upstream.mock.calls[0]?.[0]).toBe('https://api.openai.com/v1/images/generations')
    const edited = await generate(request({ ...base, previous: image }).req)
    expect(upstream.mock.calls[1]?.[0]).toBe('https://api.openai.com/v1/images/edits')
    const form = upstream.mock.calls[1]?.[1].body as FormData
    expect(form.get('image')).toBeInstanceOf(Blob)
    expect(edited.status).toBe(401)
    expect(await edited.text()).not.toContain(key)
  })
})
