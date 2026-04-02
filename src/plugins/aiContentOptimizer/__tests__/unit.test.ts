import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiEnrichPostHandler } from '../endpoints/aiEnrichPost'

// Mock Gemini enrichment function
const mockEnrichPostContent = vi.hoisted(() => vi.fn())
vi.mock('@/lib/gemini', () => ({
    enrichPostContent: mockEnrichPostContent,
}))

const mockPayload = {
    find: vi.fn(),
    create: vi.fn(),
}

const makeReq = (body: string) => ({
    text: async () => body,
    payload: mockPayload,
} as any)

describe('aiEnrichPostHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns 400 if JSON is invalid', async () => {
        const req = makeReq('invalid-json')
        const res = await aiEnrichPostHandler(req)
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBe('Invalid JSON body')
    })

    it('successfully enriches content and resolves categories', async () => {
        // 1. Mock Gemini result
        mockEnrichPostContent.mockResolvedValue({
            title: 'Test Post',
            slug: 'test-post',
            description: 'AI generated desc',
            categories: ['Tech', 'News'], // Names returned by AI
            seo_title: 'SEO Title',
            seo_description: 'SEO Desc',
            og_title: 'OG Title',
            noindex: false,
        })

        // 2. Mock Payload category resolution
        // First call: 'Tech' exists
        mockPayload.find.mockResolvedValueOnce({
            docs: [{ id: 'cat-id-tech', name: 'Tech' }],
        })
        // Second call: 'News' does not exist
        mockPayload.find.mockResolvedValueOnce({
            docs: [],
        })
        // Mock creation of 'News'
        mockPayload.create.mockResolvedValue({
            id: 'cat-id-news',
            name: 'News',
        })

        const req = makeReq(JSON.stringify({
            title: 'Test Post',
            content: { root: {} },
        }))

        const res = await aiEnrichPostHandler(req)
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.title).toBe('Test Post')
        // Check if categories were converted from names to IDs
        expect(data.categories).toEqual(['cat-id-tech', 'cat-id-news'])

        expect(mockPayload.find).toHaveBeenCalledTimes(2)
        expect(mockPayload.create).toHaveBeenCalledTimes(1)
        expect(mockPayload.create).toHaveBeenCalledWith({
            collection: 'categories',
            data: { name: 'News' },
        })
    })

    it('returns 500 if Gemini enrichment fails', async () => {
        mockEnrichPostContent.mockRejectedValue(new Error('Gemini API Error'))

        const req = makeReq(JSON.stringify({
            title: 'Test Post',
            content: { root: {} },
        }))

        const res = await aiEnrichPostHandler(req)
        expect(res.status).toBe(500)
        const data = await res.json()
        expect(data.error).toBe('Failed to enrich content')
        expect(data.details).toBe('Gemini API Error')
    })
})
