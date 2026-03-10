import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface EnrichedContent {
    description: string
    customMetaData: {
        seo_title: string
        seo_description: string
        og_title: string
        og_description: string
        keywords: string[]
    }
}

export async function enrichPostContent(title: string, content: string): Promise<EnrichedContent> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `
    You are an expert SEO and content strategist. 
    Based on the following blog post title and content, generate SEO metadata.
    
    TITLE: ${title}
    CONTENT: ${content}
    
    Please provide the following in JSON format:
    1. A concise summary/description for the blog post (approx 150 characters).
    2. SEO Title (max 60 characters).
    3. SEO Description (max 160 characters).
    4. OpenGraph Title.
    5. OpenGraph Description.
    6. A list of 5-10 relevant keywords.
    
    The response must be a valid JSON object with the following structure:
    {
      "description": "...",
      "seo_title": "...",
      "seo_description": "...",
      "og_title": "...",
      "og_description": "...",
      "keywords": ["...", "..."]
    }
    
    Response MUST be valid JSON only, no markdown formatting.
  `

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Attempt to parse JSON, cleaning up any potential markdown code blocks
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanJson)

        return {
            description: parsed.description || '',
            customMetaData: {
                seo_title: parsed.seo_title || title,
                seo_description: parsed.seo_description || parsed.description || '',
                og_title: parsed.og_title || parsed.seo_title || title,
                og_description: parsed.og_description || parsed.seo_description || '',
                keywords: parsed.keywords || [],
            },
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error)
        throw new Error('Failed to enrich content with AI')
    }
}
