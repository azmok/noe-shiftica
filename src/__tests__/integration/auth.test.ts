/**
 * Integration tests: Login / Authentication flow
 *
 * Tests Task 3 requirements:
 *   - Successful login returns 200 + JWT token
 *   - Wrong password returns 401
 *   - Non-existent user returns 401
 *   - Empty body returns 4xx
 *
 * Requires: dev server running (pnpm dev) + test user created (pnpm test:setup)
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { BASE_URL, TEST_EMAIL, loginAsAdmin } from './helpers'

const password = () => process.env.TEST_ADMIN_PASSWORD ?? 'not-set'

describe('POST /api/users/login — authentication flow', () => {
  it('returns 200 and a non-empty JWT token for valid credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: password() }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.token).toBeTypeOf('string')
    expect(body.token.length).toBeGreaterThan(20)
    expect(body.user).toBeDefined()
    expect(body.user.email).toBe(TEST_EMAIL)
  })

  it('returns 401 for a correct email but wrong password', async () => {
    const res = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: 'completely-wrong-password' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 for a non-existent email address', async () => {
    const res = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ghost-user-does-not-exist@example.com',
        password: 'anything',
      }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 4xx when body is empty', async () => {
    const res = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })

  it('ME endpoint returns the authenticated user', async () => {
    const token = await loginAsAdmin()
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `JWT ${token}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user?.email).toBe(TEST_EMAIL)
  })
})
