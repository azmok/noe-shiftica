/**
 * Integration tests: AI Content Optimizer — server + DB operations
 *
 * Uses testMock:true to bypass the real Gemini API.
 * Tests only category resolution and DB-write logic.
 *
 * Requires: dev server running (pnpm dev:test) + test user created (pnpm test:setup)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { loginAsAdmin, bearer, BASE_URL } from './helpers'

describe('AI Content Optimizer — Integration', () => {
    let token: string
    const TEST_CAT_NAME = 'Test Integration Category'

    beforeAll(async () => {
        token = await loginAsAdmin()
    })

    afterAll(async () => {
        // Cleanup: category cleanup is optional on the test DB branch
    })

    it('successfully returns mocked metadata and creates categories in the DB', async () => {
        const res = await fetch(`${BASE_URL}/api/ai-enrich-post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...bearer(token),
            },
            body: JSON.stringify({
                title: 'Integration Test Post',
                content: { root: { children: [] } },
                testMock: true,
            }),
        })

        expect(res.status).toBe(200)
        const body = await res.json()

        // 1. Check response structure
        expect(body.title).toBe('Integration Test Post')
        expect(body.categories).toBeDefined()
        expect(body.categories.length).toBeGreaterThan(0)

        const firstCategoryId = body.categories[0]
        expect(typeof firstCategoryId).toBe('string')

        // 2. Verify that the category actually exists in the database
        const catRes = await fetch(`${BASE_URL}/api/categories/${firstCategoryId}`, {
            headers: bearer(token),
        })

        expect(catRes.status).toBe(200)
        const catDoc = await catRes.json()
        expect(catDoc.name).toBe(TEST_CAT_NAME)
    })

    it('returns 403 when calling without authentication', async () => {
        const res = await fetch(`${BASE_URL}/api/ai-enrich-post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Unauthorized Test',
                content: {},
                testMock: true,
            }),
        })

        expect(res.status).toBe(403)
    })
})
