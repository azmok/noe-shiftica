/**
 * Shared helpers for integration tests.
 * All tests run against a real running server (TEST_BASE_URL, default localhost:3000).
 */

export const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
export const TEST_EMAIL = 'indexlove0815@icloud.com'

/**
 * Log in as the test admin and return the JWT token.
 * Throws a clear error if TEST_ADMIN_PASSWORD is not set or login fails.
 */
export async function loginAsAdmin(): Promise<string> {
  const password = process.env.TEST_ADMIN_PASSWORD
  if (!password) {
    throw new Error(
      'TEST_ADMIN_PASSWORD is not set.\n' +
      'Copy .env.test.example → .env.test and set the value, then run: pnpm test:setup',
    )
  }

  const res = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Login failed (${res.status}). ` +
      'Make sure the dev server is running (pnpm dev) and the test user exists (pnpm test:setup).\n' +
      `Response: ${text.slice(0, 200)}`,
    )
  }

  const data = await res.json()
  return data.token as string
}

/** Returns an Authorization header for Payload's JWT auth */
export function bearer(token: string): Record<string, string> {
  return { Authorization: `JWT ${token}` }
}

/** Minimal valid 1×1 transparent PNG (67 bytes) */
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

export function makeTinyPngBlob(): Blob {
  const bytes = Buffer.from(TINY_PNG_B64, 'base64')
  return new Blob([bytes], { type: 'image/png' })
}
