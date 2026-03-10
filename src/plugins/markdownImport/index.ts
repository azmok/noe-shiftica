import { Plugin } from 'payload'
import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import matter from 'gray-matter'
import { sanitizeServerEditorConfig } from '@payloadcms/richtext-lexical'
import { translateToSlug } from '../../lib/translateToSlug'

export const markdownImportPlugin = (): Plugin => {
    return (config) => {
        // 1. Add custom endpoints
        const existingEndpoints = config.endpoints || []

        config.endpoints = [
            ...existingEndpoints,
            // Markdown → Lexical conversion
            {

                path: '/convert-markdown',
                method: 'post',
                handler: async (req) => {
                    try {
                        const rawBody = await (req as unknown as Request).text()

                        // Debug: Inspect the first few characters for BOM or weirdness
                        console.log('[DEBUG-API] Received raw body length:', rawBody.length);
                        console.log('[DEBUG-API] First 100 characters:', JSON.stringify(rawBody.substring(0, 100)));

                        // Parse frontmatter - ensure clean start for gray-matter
                        const cleanBody = rawBody.trimStart();
                        const parsed = matter(cleanBody)

                        const markdownBody = parsed.content || ''
                        const frontmatter = parsed.data || {}

                        console.log('[DEBUG-API] Parsed Frontmatter:', JSON.stringify(frontmatter));
                        console.log('[DEBUG-API] Body content start:', JSON.stringify(markdownBody.substring(0, 100)));

                        // Convert to Lexical using the actual editor config from Payload
                        // (includes EXPERIMENTAL_TableFeature and all custom features)
                        const editorConfig = req.payload.config.editor
                        const sanitizedEditorConfig = await sanitizeServerEditorConfig(
                            editorConfig as any,
                            req.payload.config as any
                        )
                        const lexicalData = convertMarkdownToLexical({
                            editorConfig: sanitizedEditorConfig,
                            markdown: markdownBody,
                        })

                        return Response.json({
                            frontmatter,
                            lexical: lexicalData,
                        })
                    } catch (error) {
                        console.error('Error converting markdown:', error)
                        return Response.json({ error: 'Failed to convert markdown' }, { status: 500 })
                    }
                },
            },
            // Title → English slug translation (for admin UI)
            {
                path: '/translate-slug',
                method: 'get',
                handler: async (req) => {
                    try {
                        const url = new URL((req as unknown as Request).url)
                        const title = url.searchParams.get('title') || ''
                        if (!title.trim()) {
                            return Response.json({ slug: '' })
                        }
                        const slug = await translateToSlug(title)
                        return Response.json({ slug })
                    } catch (error) {
                        console.error('Error translating slug:', error)
                        return Response.json({ error: 'Failed to translate slug' }, { status: 500 })
                    }
                },
            },
            // AI Content Enrichment (Stub)
            {
                path: '/posts/ai-enrich',
                method: 'post',
                handler: async (req) => {
                    try {
                        const { title, content } = await (req as unknown as Request).json()
                        console.group('[AI-ENRICH] Request for:', title)

                        // TODO: Integrate Gemini API here
                        // For now, return a deterministic stub response
                        const mockDescription = `This is an AI-generated description for "${title}". It analyzes the content which has ${content?.length || 0} characters.`

                        const mockCustomMetaData = {
                            seo_title: `${title} | Noe Shiftica`,
                            seo_description: mockDescription,
                            og_title: title,
                            og_description: mockDescription,
                            keywords: ['AI', 'Generated', 'Blog'],
                        }

                        console.log('[AI-ENRICH] returning mock data')
                        console.groupEnd()

                        return Response.json({
                            description: mockDescription,
                            customMetaData: mockCustomMetaData,
                        })
                    } catch (error) {
                        console.error('Error in AI enrichment:', error)
                        return Response.json({ error: 'Failed to enrich content' }, { status: 500 })
                    }
                },
            },
        ]

        // 2. Inject UI component into Posts collection
        config.collections = (config.collections || []).map((collection) => {
            if (collection.slug === 'posts') {
                collection.fields = [
                    {
                        name: 'markdownImportUI',
                        type: 'ui',
                        admin: {
                            position: 'sidebar',
                            components: {
                                Field: '/plugins/markdownImport/ImportButton.tsx',
                            },
                        },
                    },
                    ...collection.fields,
                ]
            }
            return collection
        })

        return config
    }
}
