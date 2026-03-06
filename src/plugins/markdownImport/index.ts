import { Plugin } from 'payload'
import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import matter from 'gray-matter'
import { defaultEditorConfig, sanitizeServerEditorConfig } from '@payloadcms/richtext-lexical'
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

                        // Parse frontmatter
                        const parsed = matter(rawBody)

                        const markdownBody = parsed.content || ''
                        const frontmatter = parsed.data || {}

                        // Convert to Lexical
                        const sanitizedEditorConfig = await sanitizeServerEditorConfig(defaultEditorConfig, req.payload.config as any)
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
