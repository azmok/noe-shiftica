import { Plugin } from 'payload'
import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import matter from 'gray-matter'
import { sanitizeServerEditorConfig } from '@payloadcms/richtext-lexical'
import { translateToSlug } from '../../lib/translateToSlug'

// Helper to transform Markdown code blocks to Payload's CustomCodeBlock (Lexical BlockNode)
export function convertMarkdownWithCodeBlocks(markdown: string, convertFn: (md: string) => any): any {
    const codeBlocks: Array<{ language: string; code: string }> = [];
    
    // Regex to match markdown code blocks
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```/g;
    
    let placeholderIndex = 0;
    const preprocessedMarkdown = markdown.replace(codeBlockRegex, (match, lang, code) => {
        codeBlocks.push({
            language: lang.trim().toLowerCase() || 'javascript',
            code: code.trim()
        });
        return `\n\n__OJE_CODE_BLOCK_PLACEHOLDER_${placeholderIndex++}__\n\n`;
    });

    const lexicalData = convertFn(preprocessedMarkdown);

    if (codeBlocks.length === 0 || !lexicalData || typeof lexicalData !== 'object') {
        return lexicalData;
    }

    // Traverse and replace the placeholder paragraph with the actual custom code-block Lexical node
    const replacePlaceholders = (node: any): any => {
        if (!node) return node;

        if (node.children && Array.isArray(node.children)) {
            const newChildren: any[] = [];
            for (const child of node.children) {
                // If it's a paragraph containing our placeholder text
                if (child.type === 'paragraph' && child.children && child.children.length === 1) {
                    const textNode = child.children[0];
                    if (textNode.type === 'text' && typeof textNode.text === 'string') {
                        const match = textNode.text.match(/^__OJE_CODE_BLOCK_PLACEHOLDER_(\d+)__$/);
                        if (match) {
                            const index = parseInt(match[1], 10);
                            const savedBlock = codeBlocks[index];
                            if (savedBlock) {
                                // Replace the paragraph node with the payload block node
                                newChildren.push({
                                    format: '',
                                    type: 'block',
                                    version: 2,
                                    fields: {
                                        blockType: 'code-block',
                                        id: `code-block-id-${Math.random().toString(36).substr(2, 9)}`,
                                        language: savedBlock.language,
                                        code: savedBlock.code
                                    }
                                });
                                continue;
                            }
                        }
                    }
                }
                
                // Otherwise recursively process
                newChildren.push(replacePlaceholders(child));
            }
            node.children = newChildren;
        }

        return node;
    };

    return replacePlaceholders(lexicalData);
}

// Markdown → Lexical conversion endpoint handler
export async function handleConvertMarkdown(req: any): Promise<Response> {
    try {
        const rawBody = await (req as unknown as Request).text()

        console.log('[DEBUG-API] Received raw body length:', rawBody.length)
        console.log('[DEBUG-API] First 100 characters:', JSON.stringify(rawBody.substring(0, 100)))

        const cleanBody = rawBody.trimStart()
        const parsed = matter(cleanBody)

        const markdownBody = parsed.content || ''
        const frontmatter = parsed.data || {}

        console.log('[DEBUG-API] Parsed Frontmatter:', JSON.stringify(frontmatter))
        console.log('[DEBUG-API] Body content start:', JSON.stringify(markdownBody.substring(0, 100)))

        const editorConfig = req.payload.config.editor
        const sanitizedEditorConfig = await sanitizeServerEditorConfig(
            editorConfig as any,
            req.payload.config as any
        )
        const lexicalData = convertMarkdownWithCodeBlocks(markdownBody, (md) => {
            return convertMarkdownToLexical({
                editorConfig: sanitizedEditorConfig,
                markdown: md,
            })
        })

        return Response.json({ frontmatter, lexical: lexicalData })
    } catch (error) {
        console.error('Error converting markdown:', error)
        return Response.json({ error: 'Failed to convert markdown' }, { status: 500 })
    }
}

// Title → English slug translation endpoint handler
export async function handleTranslateSlug(req: any): Promise<Response> {
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
}

// beforeValidate hook: inject placeholder content for HTML-embed-only posts
export async function beforeValidateMarkdown(args: any): Promise<any> {
    const data = args?.data ?? {}
    const hasTextContent =
        data?.content &&
        typeof data.content === 'object' &&
        'root' in data.content &&
        (data.content as any).root?.children?.some((node: any) =>
            node.children?.some((child: any) => child.text?.trim())
        )

    if (!hasTextContent && data?.htmlEmbed) {
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
}

export const markdownImportPlugin = (): Plugin => {
    return (config) => {
        const existingEndpoints = config.endpoints || []

        config.endpoints = [
            ...existingEndpoints,
            // Markdown → Lexical conversion
            {
                path: '/convert-markdown',
                method: 'post',
                handler: handleConvertMarkdown,
            },
            // Title → English slug translation
            {
                path: '/translate-slug',
                method: 'get',
                handler: handleTranslateSlug,
            },
        ]

        // Inject UI + beforeValidate hook into Posts
        config.collections = (config.collections || []).map((collection) => {
            if (collection.slug === 'posts' || collection.slug === 'tech-posts') {
                collection.fields = [
                    {
                        name: 'markdownImportUI',
                        type: 'ui',
                        admin: {
                            position: 'sidebar',
                            components: {
                                Field: '/plugins/markdownImport/MarkdownImporterUI#MarkdownImporterUI',
                            },
                        },
                    },
                    ...collection.fields,
                ]

                // Allow publishing with htmlEmbed but no content
                const existingBeforeValidate = collection.hooks?.beforeValidate || []
                collection.hooks = {
                    ...(collection.hooks || {}),
                    beforeValidate: [
                        ...existingBeforeValidate,
                        beforeValidateMarkdown,
                    ],
                }
            }
            return collection
        })

        return config
    }
}
