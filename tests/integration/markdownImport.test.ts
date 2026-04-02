/**
 * Integration tests: markdownImport plugin endpoints
 *
 * Tests the two custom Payload endpoints added by markdownImportPlugin:
 *   - POST /api/convert-markdown  — parses frontmatter + converts body to Lexical
 *   - GET  /api/translate-slug    — translates a title to a URL-safe English slug
 *
 * Prerequisites (see CLAUDE.md §8-B):
 *   pnpm dev:test   (Terminal 1)
 *   pnpm test:integration (Terminal 2)
 *
 * Note: these endpoints are unauthenticated — no token is required.
 */

import { describe, it, expect } from 'vitest'
import { BASE_URL } from './helpers'

// ---------------------------------------------------------------------------
// POST /api/convert-markdown
// ---------------------------------------------------------------------------

describe('markdownImport — POST /api/convert-markdown', () => {
    it('returns 200 with parsed frontmatter and lexical for markdown with frontmatter', async () => {
        const markdown = `---
title: Integration Test Post
description: A test description for integration
---

# Hello World

This is the **body** content.`

        const res = await fetch(`${BASE_URL}/api/convert-markdown`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: markdown,
        })

        expect(res.status).toBe(200)
        const data = await res.json()

        expect(data.frontmatter).toBeDefined()
        expect(data.frontmatter.title).toBe('Integration Test Post')
        expect(data.frontmatter.description).toBe('A test description for integration')

        expect(data.lexical).toBeDefined()
        expect(data.lexical.root).toBeDefined()
        expect(data.lexical.root.type).toBe('root')
        expect(Array.isArray(data.lexical.root.children)).toBe(true)
    })

    it('returns 200 with empty frontmatter for markdown without front matter block', async () => {
        const markdown = `# Plain Markdown\n\nJust content, no frontmatter.`

        const res = await fetch(`${BASE_URL}/api/convert-markdown`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: markdown,
        })

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.frontmatter).toEqual({})
        expect(data.lexical).toBeDefined()
        expect(data.lexical.root.type).toBe('root')
    })

    it('returns 200 and handles empty body gracefully', async () => {
        const res = await fetch(`${BASE_URL}/api/convert-markdown`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: '',
        })

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.frontmatter).toEqual({})
        expect(data.lexical).toBeDefined()
    })

    it('strips leading whitespace before parsing', async () => {
        const markdown = `   \n---\ntitle: Whitespace Test\n---\n\nContent here.`

        const res = await fetch(`${BASE_URL}/api/convert-markdown`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: markdown,
        })

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.frontmatter.title).toBe('Whitespace Test')
    })

    it('includes all frontmatter fields in the response', async () => {
        const markdown = `---
title: Full Frontmatter
description: Full desc
customField: custom value
tags:
  - tag1
  - tag2
---

Body text.`

        const res = await fetch(`${BASE_URL}/api/convert-markdown`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: markdown,
        })

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.frontmatter.title).toBe('Full Frontmatter')
        expect(data.frontmatter.description).toBe('Full desc')
        expect(data.frontmatter.customField).toBe('custom value')
        expect(data.frontmatter.tags).toEqual(['tag1', 'tag2'])
    })
})

// ---------------------------------------------------------------------------
// GET /api/translate-slug
// ---------------------------------------------------------------------------

describe('markdownImport — GET /api/translate-slug', () => {
    it('returns a kebab-case slug for an English title', async () => {
        const res = await fetch(
            `${BASE_URL}/api/translate-slug?title=${encodeURIComponent('Hello World Post')}`,
        )

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.slug).toBe('hello-world-post')
    })

    it('returns empty slug for empty title', async () => {
        const res = await fetch(`${BASE_URL}/api/translate-slug?title=`)

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.slug).toBe('')
    })

    it('returns empty slug when title param is omitted', async () => {
        const res = await fetch(`${BASE_URL}/api/translate-slug`)

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.slug).toBe('')
    })

    it('returns empty slug for whitespace-only title', async () => {
        const res = await fetch(
            `${BASE_URL}/api/translate-slug?title=${encodeURIComponent('   ')}`,
        )

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.slug).toBe('')
    })

    it('lowercases and strips special characters from slug', async () => {
        const res = await fetch(
            `${BASE_URL}/api/translate-slug?title=${encodeURIComponent('My Cool Blog Post!')}`,
        )

        expect(res.status).toBe(200)
        const data = await res.json()
        // slug must be lowercase, alphanumeric with hyphens only
        expect(data.slug).toMatch(/^[a-z0-9-]+$/)
        expect(data.slug).toBe('my-cool-blog-post')
    })
})
