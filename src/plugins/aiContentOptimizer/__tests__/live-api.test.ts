/**
 * ⚠️  LIVE API TEST — Calls the real Gemini API
 *
 * Requires:
 *   GEMINI_API_KEY set in .env or .env.local
 *
 * If the key is absent, the test is automatically skipped via
 * describe.runIf(process.env.GEMINI_API_KEY).
 *
 * Run with:
 *   pnpm test:live
 */

import dotenv from 'dotenv'
import path from 'path'

// Load env files before describe.runIf evaluates process.env.GEMINI_API_KEY
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

import { describe, it, expect } from 'vitest'
import { enrichPostContent } from '@/lib/gemini'

describe.runIf(process.env.GEMINI_API_KEY)(
    'enrichPostContent — Real Gemini API smoke test',
    () => {
        it(
            'receives and parses a valid response from the Gemini API',
            async () => {
                const testTitle = 'Designing Modern Web Applications with AI'
                const testContent = `
                AI is transforming how we build and interact with the web.
                From automated content generation to intelligent UI components,
                the possibilities are endless for developers.
            `

                console.log('[LIVE-API] Calling real Gemini API...')
                const result = await enrichPostContent(testTitle, testContent)
                console.log('[LIVE-API] Result received:', result.seo_title)

                // Structure checks
                expect(result).toBeDefined()
                expect(typeof result.title).toBe('string')
                expect(typeof result.slug).toBe('string')
                expect(typeof result.seo_title).toBe('string')
                expect(typeof result.seo_description).toBe('string')

                // Data consistency
                expect(Array.isArray(result.tags)).toBe(true)
                expect(Array.isArray(result.categories)).toBe(true)

                // Non-empty values
                expect(result.slug?.length).toBeGreaterThan(0)
                expect(result.description?.length).toBeGreaterThan(0)
            },
            30_000,
        )
    },
)
