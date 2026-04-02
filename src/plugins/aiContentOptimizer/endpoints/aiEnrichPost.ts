import { PayloadHandler } from 'payload'
import { enrichPostContent } from '@/lib/gemini'
import { EnrichmentRequest } from '../types'

export const aiEnrichPostHandler: PayloadHandler = async (req) => {
    try {
        console.log('[AI-ENRICH] Parsing request body...')
        const rawBody = await (req as unknown as Request).text()
        console.log('[AI-ENRICH] Raw body length:', rawBody.length)

        let title: string, content: any, htmlContent: string, testMock: boolean
        try {
            const parsed: EnrichmentRequest = JSON.parse(rawBody)
            title = parsed.title
            content = parsed.content
            htmlContent = parsed.htmlContent || ''
            testMock = !!parsed.testMock
        } catch (parseErr) {
            console.error('[AI-ENRICH] Failed to parse request body as JSON:', rawBody.substring(0, 200))
            return Response.json({ error: 'Invalid JSON body', details: String(parseErr) }, { status: 400 })
        }

        console.group('[AI-ENRICH] Request for:', title)
        
        let result
        if (testMock && process.env.NODE_ENV !== 'production') {
            console.log('[AI-ENRICH] TEST MOCK MODE: Returning dummy enrichment data.')
            result = {
                title,
                slug: 'mock-slug-' + Date.now(),
                description: 'Mocked enrichment for testing.',
                categories: ['Test Integration Category', 'Another Test Cat'],
                seo_title: 'Mock SEO Title',
                seo_description: 'Mock SEO Desc',
                og_title: 'Mock OG Title',
                tags: ['integration', 'test'],
                noindex: false,
            }
        } else {
            let contentStr = ''
            if (htmlContent) {
                // Strip HTML for Gemini analysis to reduce token usage and improve focus
                contentStr = htmlContent
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 8000)
                console.log(`[AI-ENRICH] Using HTML embed content (${contentStr.length} chars)`)
            } else {
                contentStr = JSON.stringify(content)
            }

            console.log('[AI-ENRICH] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY)
            result = await enrichPostContent(title, contentStr)
        }

        // Resolve Categories (names → IDs, create if missing)
        if (result.categories && Array.isArray(result.categories)) {
            console.log('[AI-ENRICH] Resolving categories:', result.categories)
            const categoryIds = []

            for (const catName of result.categories) {
                const existing = await req.payload.find({
                    collection: 'categories',
                    where: { name: { equals: catName } },
                    limit: 1,
                })

                if (existing.docs.length > 0) {
                    categoryIds.push(existing.docs[0].id)
                } else {
                    console.log(`[AI-ENRICH] Creating new category: ${catName}`)
                    const newCat = await req.payload.create({
                        collection: 'categories',
                        data: { name: catName },
                    })
                    categoryIds.push(newCat.id)
                }
            }
            result.categories = categoryIds
        }

        console.log('[AI-ENRICH] AI analysis complete')
        console.groupEnd()

        return Response.json(result)
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        const errCause = error instanceof Error && error.cause ? String(error.cause) : undefined
        console.error('[AI-ENRICH] Error:', errMsg)
        return Response.json(
            { error: 'Failed to enrich content', details: errMsg, cause: errCause },
            { status: 500 }
        )
    }
}
