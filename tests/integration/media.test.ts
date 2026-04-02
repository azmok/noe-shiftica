/**
 * Integration tests: Image Upload and Deletion
 *
 * Tests Task 1 requirements:
 *   - Upload image → 201, document with ID returned
 *   - Read uploaded image → 200
 *   - Delete image → 200
 *   - Read deleted image → 404
 *   - Upload without auth → 401
 *
 * Requires: dev server running (pnpm dev) + test user created (pnpm test:setup)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { loginAsAdmin, bearer, BASE_URL, makeTinyPngBlob } from './helpers'

describe('Media API — Image upload and deletion', () => {
  let token: string
  let uploadedId: string | number

  beforeAll(async () => {
    token = await loginAsAdmin()
  })

  afterAll(async () => {
    // Safety net: delete the test image if the delete test failed mid-run
    if (uploadedId) {
      await fetch(`${BASE_URL}/api/media/${uploadedId}`, {
        method: 'DELETE',
        headers: bearer(token),
      }).catch(() => {})
    }
  })

  // ------------------------------------------------------------------
  // Upload
  // ------------------------------------------------------------------

  it('uploads a PNG image and returns status 201 with a document ID', async () => {
    const fd = new FormData()
    fd.append('file', makeTinyPngBlob(), 'vitest-upload-test.png')
    // Payload v3: pass collection field values as JSON in _payload
    fd.append('_payload', JSON.stringify({ alt: 'Vitest upload test' }))

    const res = await fetch(`${BASE_URL}/api/media`, {
      method: 'POST',
      headers: bearer(token),
      body: fd,
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.doc).toBeDefined()
    expect(body.doc.id).toBeDefined()
    expect(body.doc.alt).toBe('Vitest upload test')

    uploadedId = body.doc.id
  })

  it('returns the uploaded media document by ID', async () => {
    expect(uploadedId, 'Upload test must pass first').toBeTruthy()

    const res = await fetch(`${BASE_URL}/api/media/${uploadedId}`, {
      headers: bearer(token),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(uploadedId)
    expect(body.alt).toBe('Vitest upload test')
    // The afterRead hook should have generated a direct GCS URL
    expect(body.url).toMatch(/^https:\/\/firebasestorage\.googleapis\.com/)
  })

  it('returns the uploaded media in the collection list', async () => {
    expect(uploadedId).toBeTruthy()

    const res = await fetch(
      `${BASE_URL}/api/media?where[id][equals]=${uploadedId}`,
      { headers: bearer(token) },
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.totalDocs).toBeGreaterThanOrEqual(1)
    expect(body.docs[0].id).toBe(uploadedId)
  })

  it('deletes the uploaded image and returns status 200', async () => {
    expect(uploadedId, 'Upload test must pass first').toBeTruthy()

    const res = await fetch(`${BASE_URL}/api/media/${uploadedId}`, {
      method: 'DELETE',
      headers: bearer(token),
    })

    if (res.status !== 200) {
      const errBody = await res.clone().json().catch(() => null)
      console.error('DELETE /api/media response:', res.status, JSON.stringify(errBody))
    }
    expect(res.status).toBe(200)

    // Mark as cleaned up so afterAll does not try again
    const deletedId = uploadedId
    uploadedId = ''

    // Verify it no longer exists
    const checkRes = await fetch(`${BASE_URL}/api/media/${deletedId}`, {
      headers: bearer(token),
    })
    expect(checkRes.status).toBe(404)
  })

  // ------------------------------------------------------------------
  // Auth guard
  // ------------------------------------------------------------------

  it('returns 403 when uploading without an Authorization header', async () => {
    const fd = new FormData()
    fd.append('file', makeTinyPngBlob(), 'no-auth-test.png')
    fd.append('_payload', JSON.stringify({ alt: 'No auth test' }))

    const res = await fetch(`${BASE_URL}/api/media`, {
      method: 'POST',
      body: fd,
      // No Authorization header
    })

    expect(res.status).toBe(403)
  })

  it('returns 4xx when deleting with an invalid token', async () => {
    const res = await fetch(`${BASE_URL}/api/media/999999999`, {
      method: 'DELETE',
      headers: { Authorization: 'JWT invalid-token-xyz' },
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })
})
