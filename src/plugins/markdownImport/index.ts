import { Plugin } from 'payload'
import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import matter from 'gray-matter'
import { sanitizeServerEditorConfig } from '@payloadcms/richtext-lexical'
import { translateToSlug } from '../../lib/translateToSlug'
import { enrichPostContent } from '../../lib/gemini'

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
            // AI Content Enrichment (Actual Integration)
            {
                path: '/ai-enrich-post',
                method: 'post',
                handler: async (req) => {
                    try {
                        // Use .text() + JSON.parse to avoid issues with Payload req consuming the body stream
                        // (same pattern as /convert-markdown which is confirmed working)
                        console.log('[AI-ENRICH] Parsing request body...')
                        const rawBody = await (req as unknown as Request).text()
                        console.log('[AI-ENRICH] Raw body length:', rawBody.length)

                        let title: string, content: any, htmlContent: string
                        try {
                            const parsed = JSON.parse(rawBody)
                            title = parsed.title
                            content = parsed.content
                            htmlContent = parsed.htmlContent || ''
                        } catch (parseErr) {
                            console.error('[AI-ENRICH] Failed to parse request body as JSON:', rawBody.substring(0, 200))
                            return Response.json({ error: 'Invalid JSON body', details: String(parseErr) }, { status: 400 })
                        }

                        // Build content string for AI analysis
                        // Priority: htmlContent (from HTML import) > richText content
                        let contentStr = ''
                        if (htmlContent) {
                            // Strip HTML tags and clean up whitespace for plain-text AI input
                            contentStr = htmlContent
                                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim()
                                .substring(0, 8000) // Cap context length for API efficiency
                            console.log(`[AI-ENRICH] Using HTML embed content (${contentStr.length} chars)`)
                        } else {
                            contentStr = JSON.stringify(content)
                        }

                        console.group('[AI-ENRICH] Request for:', title)
                        console.log('[AI-ENRICH] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY, '| Length:', process.env.GEMINI_API_KEY?.length)

                        // Call Gemini API
                        console.log('[AI-ENRICH] Calling enrichPostContent...')
                        const result = await enrichPostContent(title, contentStr)

                        // Resolve Categories (Convert names to IDs, creating if necessary)
                        if (result.categories && Array.isArray(result.categories)) {
                            console.log('[AI-ENRICH] Resolving categories:', result.categories)
                            const categoryIds = []

                            for (const catName of result.categories) {
                                // 1. Try to find existing category
                                const existing = await req.payload.find({
                                    collection: 'categories',
                                    where: {
                                        name: { equals: catName }
                                    },
                                    limit: 1,
                                })

                                if (existing.docs.length > 0) {
                                    categoryIds.push(existing.docs[0].id)
                                } else {
                                    // 2. Create new category if not found
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
                        console.error('[AI-ENRICH] Error in endpoint handler:', errMsg, error instanceof Error ? error.stack : '')
                        return Response.json(
                            { error: 'Failed to enrich content', details: errMsg, cause: errCause },
                            { status: 500 }
                        )
                    }
                },
            },
        ]

        // 2. Inject UI component and lifecycle hooks into Posts collection
        config.collections = (config.collections || []).map((collection) => {
            if (collection.slug === 'posts') {
                // --- Add sidebar UI field ---
                collection.fields = [
                    {
                        name: 'markdownImportUI',
                        type: 'ui',
                        admin: {
                            position: 'sidebar',
                            components: {
                                Field: '/plugins/markdownImport/BlogContentActions.tsx',
                            },
                        },
                    },
                    ...collection.fields,
                ]

                // --- Add beforeValidate hook to allow publishing with htmlEmbed but no content ---
                // The content field is required: true in Posts.ts, so we inject a minimal
                // non-breaking space Lexical structure when content is absent but htmlEmbed is present.
                const existingBeforeValidate = collection.hooks?.beforeValidate || []
                collection.hooks = {
                    ...(collection.hooks || {}),
                    beforeValidate: [
                        ...existingBeforeValidate,
                        async (args: any) => {
                            const data = args?.data ?? {}
                            const hasTextContent =
                                data?.content &&
                                typeof data.content === 'object' &&
                                'root' in data.content &&
                                (data.content as any).root?.children?.some((node: any) =>
                                    node.children?.some((child: any) => child.text?.trim())
                                )

                            if (!hasTextContent && data?.htmlEmbed) {
                                // Insert a single non-breaking space as placeholder to satisfy required: true
                                // This renders as invisible whitespace in the frontend
                                data.content = {
                                    root: {
                                        children: [
                                            {
                                                children: [
                                                    {
                                                        detail: 0, format: 0, mode: 'normal',
                                                        style: '', text: '\u00A0',
                                                        type: 'text', version: 1,
                                                    },
                                                ],
                                                direction: 'ltr', format: '',
                                                indent: 0, type: 'paragraph', version: 1,
                                            },
                                        ],
                                        direction: 'ltr', format: '',
                                        indent: 0, type: 'root', version: 1,
                                    },
                                }
                                console.log('[MARKDOWN-PLUGIN] Injected placeholder content for HTML-embed-only post.')
                            }
                            return data
                        },
                    ],
                }
            }
            return collection
        })

        return config
    }
}
