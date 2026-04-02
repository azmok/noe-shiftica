/**
 * Unit tests: markdownImport plugin
 *
 * Covers:
 *   - handleConvertMarkdown  — frontmatter parsing, lexical conversion, error handling
 *   - handleTranslateSlug    — slug generation, empty/whitespace title, error handling
 *   - beforeValidateMarkdown — placeholder injection logic
 *   - markdownImportPlugin   — endpoint registration, field injection, hook composition
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Hoist mocks before any imports ---

const mockSanitizeServerEditorConfig = vi.hoisted(() => vi.fn())
const mockConvertMarkdownToLexical = vi.hoisted(() => vi.fn())
vi.mock('@payloadcms/richtext-lexical', () => ({
    sanitizeServerEditorConfig: mockSanitizeServerEditorConfig,
    convertMarkdownToLexical: mockConvertMarkdownToLexical,
}))

const mockTranslateToSlug = vi.hoisted(() => vi.fn())
vi.mock('@/lib/translateToSlug', () => ({
    translateToSlug: mockTranslateToSlug,
}))

import {
    handleConvertMarkdown,
    handleTranslateSlug,
    beforeValidateMarkdown,
    markdownImportPlugin,
} from '@/plugins/markdownImport'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConvertReq(body: string, editorConfig: any = {}) {
    return {
        text: async () => body,
        payload: { config: { editor: editorConfig } },
    }
}

function makeSlugReq(title: string) {
    return {
        url: `http://localhost:3000/api/translate-slug?title=${encodeURIComponent(title)}`,
    }
}

function makePluginConfig(extraPostProps: any = {}) {
    return {
        endpoints: [] as any[],
        collections: [
            {
                slug: 'posts',
                fields: [{ name: 'title', type: 'text' }],
                ...extraPostProps,
            },
            { slug: 'media', fields: [] },
        ],
    }
}

const MOCK_SANITIZED_CONFIG = { type: 'sanitized-editor' }
const MOCK_LEXICAL = { root: { type: 'root', children: [], direction: 'ltr', format: '', indent: 0, version: 1 } }

// ---------------------------------------------------------------------------
// handleConvertMarkdown
// ---------------------------------------------------------------------------

describe('handleConvertMarkdown', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockSanitizeServerEditorConfig.mockResolvedValue(MOCK_SANITIZED_CONFIG)
        mockConvertMarkdownToLexical.mockReturnValue(MOCK_LEXICAL)
    })

    it('parses frontmatter fields and returns lexical data', async () => {
        const markdown = `---
title: My Post
description: A test post
---

# Hello World

This is the body.`

        const res = await handleConvertMarkdown(makeConvertReq(markdown))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.frontmatter.title).toBe('My Post')
        expect(data.frontmatter.description).toBe('A test post')
        expect(data.lexical).toEqual(MOCK_LEXICAL)
    })

    it('handles markdown without frontmatter (returns empty frontmatter)', async () => {
        const markdown = `# Plain Heading\n\nJust content.`
        const res = await handleConvertMarkdown(makeConvertReq(markdown))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.frontmatter).toEqual({})
        expect(data.lexical).toEqual(MOCK_LEXICAL)
    })

    it('passes the markdown body (not frontmatter) to convertMarkdownToLexical', async () => {
        const markdown = `---\ntitle: T\n---\n\nBody content here.`
        await handleConvertMarkdown(makeConvertReq(markdown))

        expect(mockConvertMarkdownToLexical).toHaveBeenCalledWith({
            editorConfig: MOCK_SANITIZED_CONFIG,
            markdown: '\nBody content here.',
        })
    })

    it('strips leading whitespace before frontmatter parsing', async () => {
        const markdown = `   \n---\ntitle: Trimmed\n---\nContent.`
        const res = await handleConvertMarkdown(makeConvertReq(markdown))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.frontmatter.title).toBe('Trimmed')
    })

    it('handles empty body (returns empty frontmatter and lexical)', async () => {
        const res = await handleConvertMarkdown(makeConvertReq(''))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.frontmatter).toEqual({})
        expect(data.lexical).toEqual(MOCK_LEXICAL)
    })

    it('returns 500 when sanitizeServerEditorConfig throws', async () => {
        mockSanitizeServerEditorConfig.mockRejectedValue(new Error('Config error'))
        const res = await handleConvertMarkdown(makeConvertReq('# Hello'))
        expect(res.status).toBe(500)

        const data = await res.json()
        expect(data.error).toBe('Failed to convert markdown')
    })

    it('returns 500 when convertMarkdownToLexical throws', async () => {
        mockConvertMarkdownToLexical.mockImplementation(() => { throw new Error('Lexical error') })
        const res = await handleConvertMarkdown(makeConvertReq('# Hello'))
        expect(res.status).toBe(500)

        const data = await res.json()
        expect(data.error).toBe('Failed to convert markdown')
    })
})

// ---------------------------------------------------------------------------
// handleTranslateSlug
// ---------------------------------------------------------------------------

describe('handleTranslateSlug', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns slug for a non-empty title', async () => {
        mockTranslateToSlug.mockResolvedValue('my-test-post')
        const res = await handleTranslateSlug(makeSlugReq('My Test Post'))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.slug).toBe('my-test-post')
        expect(mockTranslateToSlug).toHaveBeenCalledWith('My Test Post')
    })

    it('returns empty slug without calling translateToSlug for empty title', async () => {
        const res = await handleTranslateSlug(makeSlugReq(''))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.slug).toBe('')
        expect(mockTranslateToSlug).not.toHaveBeenCalled()
    })

    it('returns empty slug for whitespace-only title', async () => {
        const res = await handleTranslateSlug(makeSlugReq('   '))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.slug).toBe('')
        expect(mockTranslateToSlug).not.toHaveBeenCalled()
    })

    it('returns 500 when translateToSlug throws', async () => {
        mockTranslateToSlug.mockRejectedValue(new Error('Translation failed'))
        const res = await handleTranslateSlug(makeSlugReq('Some Title'))
        expect(res.status).toBe(500)

        const data = await res.json()
        expect(data.error).toBe('Failed to translate slug')
    })
})

// ---------------------------------------------------------------------------
// beforeValidateMarkdown
// ---------------------------------------------------------------------------

describe('beforeValidateMarkdown', () => {
    it('returns data unchanged when content has text and htmlEmbed is also present', async () => {
        const originalContent = {
            root: {
                children: [{ children: [{ text: 'Hello World' }] }],
            },
        }
        const data = { content: originalContent, htmlEmbed: '<p>HTML</p>' }
        const result = await beforeValidateMarkdown({ data })

        // content must be the same object reference — not replaced
        expect(result.content).toBe(originalContent)
    })

    it('injects NBSP placeholder when content has no text but htmlEmbed exists', async () => {
        const data = {
            content: {
                root: { children: [{ children: [{ text: '' }] }] },
            },
            htmlEmbed: '<p>HTML embed content</p>',
        }
        const result = await beforeValidateMarkdown({ data })

        expect(result.content.root.type).toBe('root')
        expect(result.content.root.children[0].type).toBe('paragraph')
        expect(result.content.root.children[0].children[0].text).toBe('\u00A0')
    })

    it('injects placeholder when content is null and htmlEmbed exists', async () => {
        const data = { content: null, htmlEmbed: '<div>Something</div>' }
        const result = await beforeValidateMarkdown({ data })

        expect(result.content).toBeDefined()
        expect(result.content.root.children[0].children[0].text).toBe('\u00A0')
    })

    it('does NOT inject placeholder when htmlEmbed is absent (content stays null)', async () => {
        const data = { content: null }
        const result = await beforeValidateMarkdown({ data })

        expect(result.content).toBeNull()
    })

    it('does NOT inject placeholder when both content and htmlEmbed are absent', async () => {
        const data = { title: 'No content or embed' }
        const result = await beforeValidateMarkdown({ data })

        expect(result.content).toBeUndefined()
    })

    it('handles missing args.data gracefully (returns empty object)', async () => {
        const result = await beforeValidateMarkdown({})
        expect(result).toEqual({})
    })

    it('handles undefined args gracefully (returns empty object)', async () => {
        const result = await beforeValidateMarkdown(undefined)
        expect(result).toEqual({})
    })

    it('placeholder content has correct Lexical node structure', async () => {
        const data = { content: null, htmlEmbed: '<p>embed</p>' }
        const result = await beforeValidateMarkdown({ data })

        const root = result.content.root
        expect(root.direction).toBe('ltr')
        expect(root.format).toBe('')
        expect(root.indent).toBe(0)
        expect(root.version).toBe(1)

        const para = root.children[0]
        expect(para.type).toBe('paragraph')
        expect(para.direction).toBe('ltr')
        expect(para.version).toBe(1)

        const textNode = para.children[0]
        expect(textNode.type).toBe('text')
        expect(textNode.version).toBe(1)
        expect(textNode.mode).toBe('normal')
        expect(textNode.detail).toBe(0)
        expect(textNode.format).toBe(0)
    })
})

// ---------------------------------------------------------------------------
// markdownImportPlugin
// ---------------------------------------------------------------------------

describe('markdownImportPlugin', () => {
    it('adds /convert-markdown and /translate-slug endpoints', () => {
        const config = makePluginConfig()
        const plugin = markdownImportPlugin()
        const result = plugin(config as any) as any

        const paths = result.endpoints.map((e: any) => e.path)
        expect(paths).toContain('/convert-markdown')
        expect(paths).toContain('/translate-slug')
    })

    it('registers /convert-markdown as POST and /translate-slug as GET', () => {
        const config = makePluginConfig()
        const plugin = markdownImportPlugin()
        const result = plugin(config as any) as any

        const convertEndpoint = result.endpoints.find((e: any) => e.path === '/convert-markdown')
        const slugEndpoint = result.endpoints.find((e: any) => e.path === '/translate-slug')

        expect(convertEndpoint.method).toBe('post')
        expect(slugEndpoint.method).toBe('get')
    })

    it('wires the exported handler functions (not anonymous closures)', () => {
        const config = makePluginConfig()
        const plugin = markdownImportPlugin()
        const result = plugin(config as any) as any

        const convertEndpoint = result.endpoints.find((e: any) => e.path === '/convert-markdown')
        const slugEndpoint = result.endpoints.find((e: any) => e.path === '/translate-slug')

        expect(convertEndpoint.handler).toBe(handleConvertMarkdown)
        expect(slugEndpoint.handler).toBe(handleTranslateSlug)
    })

    it('preserves pre-existing endpoints', () => {
        const config = makePluginConfig()
        config.endpoints = [{ path: '/existing', method: 'get', handler: async () => new Response() }]
        const plugin = markdownImportPlugin()
        const result = plugin(config as any) as any

        expect(result.endpoints).toHaveLength(3)
        expect(result.endpoints[0].path).toBe('/existing')
    })

    it('injects markdownImportUI as the first field in the posts collection', () => {
        const config = makePluginConfig()
        const plugin = markdownImportPlugin()
        const result = plugin(config as any) as any

        const posts = result.collections.find((c: any) => c.slug === 'posts')
        expect(posts.fields[0].name).toBe('markdownImportUI')
        expect(posts.fields[0].type).toBe('ui')
        expect(posts.fields[0].admin.position).toBe('sidebar')
    })

    it('preserves pre-existing post fields after the injected UI field', () => {
        const config = makePluginConfig()
        const plugin = markdownImportPlugin()
        const result = plugin(config as any) as any

        const posts = result.collections.find((c: any) => c.slug === 'posts')
        expect(posts.fields[1].name).toBe('title')
    })

    it('does not modify non-posts collections', () => {
        const config = makePluginConfig()
        const plugin = markdownImportPlugin()
        const result = plugin(config as any) as any

        const media = result.collections.find((c: any) => c.slug === 'media')
        expect(media.fields).toHaveLength(0)
        expect(media.hooks).toBeUndefined()
    })

    it('adds beforeValidateMarkdown hook to posts collection', () => {
        const config = makePluginConfig()
        const plugin = markdownImportPlugin()
        const result = plugin(config as any) as any

        const posts = result.collections.find((c: any) => c.slug === 'posts')
        expect(posts.hooks.beforeValidate).toHaveLength(1)
        expect(posts.hooks.beforeValidate[0]).toBe(beforeValidateMarkdown)
    })

    it('appends beforeValidateMarkdown after existing beforeValidate hooks', () => {
        const existingHook = vi.fn()
        const config = makePluginConfig({
            hooks: { beforeValidate: [existingHook] },
        })
        const plugin = markdownImportPlugin()
        const result = plugin(config as any) as any

        const posts = result.collections.find((c: any) => c.slug === 'posts')
        expect(posts.hooks.beforeValidate).toHaveLength(2)
        expect(posts.hooks.beforeValidate[0]).toBe(existingHook)
        expect(posts.hooks.beforeValidate[1]).toBe(beforeValidateMarkdown)
    })

    it('handles collections without existing hooks object', () => {
        const config = makePluginConfig()
        // Explicitly remove hooks
        delete (config.collections[0] as any).hooks
        const plugin = markdownImportPlugin()
        const result = plugin(config as any) as any

        const posts = result.collections.find((c: any) => c.slug === 'posts')
        expect(posts.hooks.beforeValidate).toHaveLength(1)
    })
})
