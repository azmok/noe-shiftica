import { PayloadHandler } from 'payload'
import { enrichPostContent } from '@/lib/gemini'
import { EnrichmentRequest } from '../types'

export const aiEnrichPostHandler: PayloadHandler = async (req) => {
    try {
        console.log('[AI-ENRICH] Parsing request body...')
        const rawBody = await (req as unknown as Request).text()
        console.log('[AI-ENRICH] Raw body length:', rawBody.length)

        let title: string, content: any, htmlContent: string, testMock: boolean, options: any
        try {
            const parsed: EnrichmentRequest = JSON.parse(rawBody)
            title = parsed.title
            content = parsed.content
            htmlContent = parsed.htmlContent || ''
            testMock = !!parsed.testMock
            options = parsed.options || {}
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
            result = await enrichPostContent(title, contentStr, options)
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

        // Classify the failure into an actionable, user-facing message so the Admin UI
        // can tell the editor WHY it failed (e.g. a deleted / billing-disabled API key)
        // instead of a generic "failed" alert. `details` keeps the raw error for logs.
        let code = 'ENRICH_FAILED'
        let userMessage = 'AI最適化に失敗しました。時間をおいて再度お試しください。'
        let status = 500
        if (/API key not valid|API_KEY_INVALID/i.test(errMsg)) {
            code = 'API_KEY_INVALID'
            userMessage =
                'Gemini APIキーが無効です。キーが削除・失効したか、請求(Billing)が無効になっている可能性があります。' +
                '本番は Secret Manager、ローカルは .env.local の GEMINI_API_KEY を更新してください。'
            status = 502
        } else if (/GEMINI_API_KEY is not set/i.test(errMsg)) {
            code = 'API_KEY_MISSING'
            userMessage = 'GEMINI_API_KEY が設定されていません。サーバーの環境変数を確認してください。'
        } else if (/quota|RESOURCE_EXHAUSTED|rate ?limit|\b429\b/i.test(errMsg)) {
            code = 'QUOTA_EXCEEDED'
            userMessage = 'Gemini API の利用上限に達しました。しばらく待ってから再度お試しください。'
            status = 429
        } else if (/\b404\b|not found|not supported/i.test(errMsg)) {
            code = 'MODEL_UNAVAILABLE'
            userMessage = 'AIモデルが利用できません（モデル名の変更・提供終了の可能性）。設定を確認してください。'
            status = 502
        }

        return Response.json(
            { error: 'Failed to enrich content', code, userMessage, details: errMsg, cause: errCause },
            { status }
        )
    }
}
