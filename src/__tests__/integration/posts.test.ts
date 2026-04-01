/**
 * Integration tests: Article (Posts) DB operations
 *
 * Tests Task 2 requirements:
 *   - Create new article (draft) → 201, returns document
 *   - Update existing article (title, status) → 200, updated values reflected
 *   - Cleanup: delete the test article after each run
 *   - Unauthorized create → 401
 *
 * Requires: dev server running (pnpm dev) + test user created (pnpm test:setup)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { loginAsAdmin, bearer, BASE_URL } from './helpers'

const TEST_SLUG = `vitest-test-post-${Date.now()}`
const TEST_TITLE = '[Vitest] テスト記事'
const UPDATED_TITLE = '[Vitest] テスト記事 (更新済み)'

// Minimal valid Lexical document for the required `content` richText field
const EMPTY_LEXICAL_CONTENT = {
  root: {
    children: [
      {
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'test', type: 'text', version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
}

describe('Posts API — Article CRUD operations', () => {
  let token: string
  let createdId: string | number

  beforeAll(async () => {
    token = await loginAsAdmin()
  })

  afterAll(async () => {
    // Always delete the test article to keep the DB clean
    if (createdId) {
      await fetch(`${BASE_URL}/api/posts/${createdId}`, {
        method: 'DELETE',
        headers: bearer(token),
      }).catch(() => {})
    }
  })

  // ------------------------------------------------------------------
  // Create
  // ------------------------------------------------------------------

  it('creates a new draft article and returns status 201', async () => {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...bearer(token),
      },
      body: JSON.stringify({
        title: TEST_TITLE,
        slug: TEST_SLUG,
        _status: 'draft',
        content: EMPTY_LEXICAL_CONTENT,
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.doc).toBeDefined()
    expect(body.doc.id).toBeDefined()
    expect(body.doc.title).toBe(TEST_TITLE)
    expect(body.doc.slug).toBe(TEST_SLUG)
    expect(body.doc._status ?? body.doc.status).toBe('draft')

    createdId = body.doc.id
  })

  it('returns the created article by ID', async () => {
    expect(createdId, 'Create test must pass first').toBeTruthy()

    const res = await fetch(`${BASE_URL}/api/posts/${createdId}?draft=true`, {
      headers: bearer(token),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(createdId)
    expect(body.title).toBe(TEST_TITLE)
  })

  // ------------------------------------------------------------------
  // Update
  // ------------------------------------------------------------------

  it('updates the article title via PATCH and returns the updated document', async () => {
    expect(createdId, 'Create test must pass first').toBeTruthy()

    const res = await fetch(`${BASE_URL}/api/posts/${createdId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...bearer(token),
      },
      body: JSON.stringify({ title: UPDATED_TITLE }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.doc.title).toBe(UPDATED_TITLE)
  })

  it('reflects the updated title when fetching by ID', async () => {
    expect(createdId, 'Update test must pass first').toBeTruthy()

    const res = await fetch(`${BASE_URL}/api/posts/${createdId}?draft=true`, {
      headers: bearer(token),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe(UPDATED_TITLE)
  })

  it('updates article status from draft to published', async () => {
    expect(createdId, 'Create test must pass first').toBeTruthy()

    const res = await fetch(`${BASE_URL}/api/posts/${createdId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...bearer(token),
      },
      body: JSON.stringify({ _status: 'published' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    const status = body.doc._status ?? body.doc.status
    expect(status).toBe('published')
  })

  // ------------------------------------------------------------------
  // Cleanup (also tests delete)
  // ------------------------------------------------------------------

  it('deletes the test article and returns status 200', async () => {
    expect(createdId, 'Create test must pass first').toBeTruthy()

    const res = await fetch(`${BASE_URL}/api/posts/${createdId}`, {
      method: 'DELETE',
      headers: bearer(token),
    })

    expect(res.status).toBe(200)
    createdId = '' // Prevent afterAll double-delete

    // Verify it no longer exists
    const checkRes = await fetch(`${BASE_URL}/api/posts/${createdId || '999999999'}`, {
      headers: bearer(token),
    })
    expect(checkRes.status).toBe(404)
  })

  // ------------------------------------------------------------------
  // Auth guard
  // ------------------------------------------------------------------

  it('returns 403 when creating an article without authentication', async () => {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized test', slug: 'unauth-test' }),
    })

    expect(res.status).toBe(403)
  })
})
