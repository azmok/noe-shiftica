import { describe, it, expect, vi, beforeEach } from 'vitest'

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
)
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('next/headers', () => ({ headers: async () => new Headers({ cookie: 'payload-token=x' }) }))

import { loginRedirectUrl, requirePreviewUser } from '../index'

const payloadWith = (user: unknown) => ({ auth: vi.fn(async () => ({ user })) }) as never

beforeEach(() => vi.clearAllMocks())

describe('requirePreviewUser', () => {
  it('builds a login URL that returns to the preview page', () => {
    expect(loginRedirectUrl('/dev/hello world/preview')).toBe('/admin/login?redirect=%2Fdev%2Fhello%20world%2Fpreview')
  })

  it('redirects anonymous visitors to the login page', async () => {
    await expect(requirePreviewUser(payloadWith(null), '/dev/x/preview')).rejects.toThrow(
      'REDIRECT:/admin/login?redirect=%2Fdev%2Fx%2Fpreview',
    )
  })

  it('lets a logged-in admin user through', async () => {
    await expect(requirePreviewUser(payloadWith({ collection: 'users', id: 1 }), '/dev/x/preview')).resolves.toBeUndefined()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('does not accept an api-client as a viewer', async () => {
    await expect(requirePreviewUser(payloadWith({ collection: 'api-clients', id: 2, enabled: true }), '/dev/x/preview')).rejects.toThrow('REDIRECT:')
  })
})
