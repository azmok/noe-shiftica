import { describe, it, expect } from 'vitest'
import type { Access, CollectionConfig, Config } from 'payload'
import { apiClientsPlugin, wrapAccess, wrapCollection } from '../index'
import {
  canAccess,
  hasApiClientPermission,
  isActiveUser,
  summarizePermissions,
  type ApiClientUser,
} from '../permissions'

const human = { id: 1, email: 'admin@example.com', collection: 'users' }

function client(overrides: Partial<ApiClientUser> = {}): ApiClientUser {
  return {
    id: 7,
    collection: 'api-clients',
    name: 'クラやん',
    enabled: true,
    permissions: {
      posts: { read: true, create: true, update: true, delete: false, publish: false },
      media: { create: true },
    },
    ...overrides,
  }
}

// Minimal AccessArgs stand-in
function args(user: unknown, data?: Record<string, unknown>) {
  return { req: { user }, data } as unknown as Parameters<Access>[0]
}

describe('hasApiClientPermission', () => {
  it('allows only the checked operations', () => {
    const c = client()
    expect(hasApiClientPermission(c, 'posts', 'create')).toBe(true)
    expect(hasApiClientPermission(c, 'posts', 'update')).toBe(true)
    expect(hasApiClientPermission(c, 'posts', 'delete')).toBe(false)
    expect(hasApiClientPermission(c, 'posts', 'publish')).toBe(false)
    expect(hasApiClientPermission(c, 'media', 'create')).toBe(true)
    expect(hasApiClientPermission(c, 'media', 'read')).toBe(false)
  })

  it('denies collections outside the managed list', () => {
    const c = client({ permissions: { users: { read: true } } as never })
    expect(hasApiClientPermission(c, 'users', 'read')).toBe(false)
    expect(hasApiClientPermission(c, 'api-clients', 'update')).toBe(false)
    expect(hasApiClientPermission(c, 'passkeys', 'read')).toBe(false)
  })

  it('ignores publish on collections without drafts', () => {
    const c = client({ permissions: { media: { publish: true } } })
    expect(hasApiClientPermission(c, 'media', 'publish')).toBe(false)
  })

  it('denies everything when the client is disabled', () => {
    expect(hasApiClientPermission(client({ enabled: false }), 'posts', 'create')).toBe(false)
  })
})

describe('canAccess / isActiveUser', () => {
  it('always allows human admins', () => {
    expect(canAccess(human, 'posts', 'delete')).toBe(true)
    expect(isActiveUser(human)).toBe(true)
  })

  it('denies anonymous callers', () => {
    expect(canAccess(null, 'posts', 'read')).toBe(false)
    expect(isActiveUser(undefined)).toBe(false)
  })

  it('treats a disabled client as inactive', () => {
    expect(isActiveUser(client())).toBe(true)
    expect(isActiveUser(client({ enabled: false }))).toBe(false)
  })
})

describe('summarizePermissions', () => {
  it('lists the allowed operations per collection', () => {
    expect(summarizePermissions(client().permissions)).toBe(
      'General Posts: 閲覧・作成・編集 / Media: 作成',
    )
  })

  it('reports no permissions', () => {
    expect(summarizePermissions(null)).toBe('権限なし')
  })
})

describe('wrapAccess', () => {
  const allowAll: Access = () => true

  it('leaves humans and anonymous users to the original access', () => {
    const denyAnon: Access = ({ req }) => Boolean(req.user)
    const wrapped = wrapAccess('posts', 'delete', denyAnon)
    expect(wrapped(args(human))).toBe(true)
    expect(wrapped(args(null))).toBe(false)
  })

  it('blocks API clients without the permission even if the original allows everyone', () => {
    expect(wrapAccess('posts', 'delete', allowAll)(args(client()))).toBe(false)
    expect(wrapAccess('posts', 'create', allowAll)(args(client()))).toBe(true)
  })

  it('requires publish permission to save as published', () => {
    const create = wrapAccess('posts', 'create', allowAll)
    expect(create(args(client(), { _status: 'draft' }))).toBe(true)
    expect(create(args(client(), { _status: 'published' }))).toBe(false)

    const publisher = client({
      permissions: { posts: { create: true, publish: true } },
    })
    expect(create(args(publisher, { _status: 'published' }))).toBe(true)
  })

  it('always denies operations mapped to null (e.g. unlock)', () => {
    expect(wrapAccess('posts', null, allowAll)(args(client()))).toBe(false)
  })

  it('falls back to "logged in" when the collection had no access function', () => {
    expect(wrapAccess('posts', 'create', undefined)(args(null))).toBe(false)
    expect(wrapAccess('posts', 'create', undefined)(args(human))).toBe(true)
  })
})

describe('wrapCollection / apiClientsPlugin', () => {
  it('keeps public read for anonymous visitors but gates API clients', () => {
    const posts: CollectionConfig = { slug: 'posts', fields: [], access: { read: () => true } }
    const wrapped = wrapCollection(posts)
    expect(wrapped.access?.read?.(args(null))).toBe(true)
    expect(wrapped.access?.read?.(args(client({ permissions: {} })))).toBe(false)
  })

  it('registers api-clients and wraps every collection, including api-clients itself', () => {
    const config = apiClientsPlugin()({
      collections: [{ slug: 'posts', fields: [] }],
    } as unknown as Config) as Config
    const slugs = config.collections?.map((c) => c.slug)
    expect(slugs).toEqual(['posts', 'api-clients'])

    const apiClients = config.collections?.find((c) => c.slug === 'api-clients')
    // An API client can never read or edit the api-clients collection (its own permissions)
    expect(apiClients?.access?.read?.(args(client()))).toBe(false)
    expect(apiClients?.access?.update?.(args(client()))).toBe(false)
    expect(apiClients?.access?.read?.(args(human))).toBe(true)
  })
})
