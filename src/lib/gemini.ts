import { GoogleGenerativeAI } from '@google/generative-ai'

// CRITICAL: We move the client initialization inside a helper function.
// This ensures that process.env.GEMINI_API_KEY is read WHEN needed, 
// avoiding race conditions during module imports.
let cachedGenAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.error('[GEMINI] CRITICAL: GEMINI_API_KEY is not set in environment variables.')
        throw new Error('GEMINI_API_KEY is not set. Please check your .env files.')
    }

    if (!cachedGenAI) {
        console.log('[GEMINI] Initializing GoogleGenerativeAI client with key (length: ' + apiKey.length + ')')
        cachedGenAI = new GoogleGenerativeAI(apiKey)
    }
    return cachedGenAI
}

export interface EnrichedContent {
    title?: string
    slug?: string
    description: string
    author?: string
    categories?: any[]
    tags?: string[]
    seo_title: string
    seo_description: string
    canonical?: string
    noindex: boolean
    og_title: string
    og_image?: string
    updatedAt: string
    [key: string]: any // Support for unknown fields
}

export async function enrichPostContent(title: string, content: string): Promise<EnrichedContent> {
    console.log(`[AI-ENRICH] Starting enrichment for: "${title}"`)
    
    // Available models (2026-03):
    // Stable: gemini-2.5-flash
    const modelName = 'gemini-2.5-flash'
    
    const genAI = getGenAI()
    const model = genAI.getGenerativeModel({ model: modelName })

    const prompt = `
    You are an expert SEO and content strategist. 
    Based on the following blog post title and content, generate structured metadata.
    
    TITLE: ${title}
    CONTENT: ${content}
    
    Please provide the following in JSON format:
    1. description: A concise summary/description for the blog post (approx 150 characters).
    2. seo_title: SEO Title (max 60 characters).
    3. seo_description: SEO Description (max 160 characters).
    4. og_title: OpenGraph Title.
    5. og_image: A suggested image description or URL-ready keyword for the OG image.
    6. tags: A list of 5-10 relevant tags.
    7. categories: A list of 1-3 relevant internal categories (e.g. Technology, Design, Business).
    8. canonical: A suggested canonical URL suffix (the slug).
    9. noindex: Boolean, set to false unless the content is low quality or duplicate.
    10. slug: An English URL-friendly slug based on the title.
    
    The response must be a valid JSON object with the following structure:
    {
      "title": "${title}",
      "slug": "...",
      "description": "...",
      "seo_title": "...",
      "seo_description": "...",
      "og_title": "...",
      "og_image": "...",
      "tags": ["...", "..."],
      "categories": ["...", "..."],
      "canonical": "...",
      "noindex": false
    }
    
    Response MUST be valid JSON only, no markdown formatting.
  `

    try {
        console.log(`[AI-ENRICH] Sending prompt to Gemini (${modelName})...`)
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        console.log('[AI-ENRICH] Raw response received.')

        // Attempt to parse JSON, cleaning up any potential markdown code blocks
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanJson)

        const enrichedByAi = {
            ...parsed,
            description: parsed.description || '',
            seo_title: parsed.seo_title || title,
            seo_description: parsed.seo_description || parsed.description || '',
            og_title: parsed.og_title || parsed.seo_title || title,
            noindex: parsed.noindex ?? false,
            updatedAt: new Date().toISOString(),
        }

        console.log('[AI-ENRICH] Enrichment complete:', {
            title: enrichedByAi.title,
            keys: Object.keys(enrichedByAi)
        })

        return enrichedByAi
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to enrich content with AI: ${message}`)
    }
}
