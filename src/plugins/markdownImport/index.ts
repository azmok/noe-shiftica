import { Plugin } from 'payload'
import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import matter from 'gray-matter'
import { sanitizeServerEditorConfig } from '@payloadcms/richtext-lexical'
import { translateToSlug } from '../../lib/translateToSlug'

/**
 * The set of languages the CustomCodeBlock `language` select accepts
 * (see src/features/customCodeBlock/index.ts). Unknown/absent tags fall back to
 * 'plaintext' so the select value stays valid.
 */
const CODE_BLOCK_LANGUAGES = new Set([
    'javascript', 'typescript', 'html', 'css', 'python', 'bash', 'json', 'sql', 'plaintext',
]);

const CODE_BLOCK_LANGUAGE_ALIASES: Record<string, string> = {
    js: 'javascript', ts: 'typescript', py: 'python',
    sh: 'bash', shell: 'bash', zsh: 'bash',
    text: 'plaintext', plain: 'plaintext', txt: 'plaintext', none: 'plaintext',
};

/** Normalize a fenced-code-block language tag; defaults to plaintext. */
export function normalizeCodeLanguage(raw: string): string {
    const lang = (raw || '').trim().toLowerCase();
    if (!lang) return 'plaintext';
    const mapped = CODE_BLOCK_LANGUAGE_ALIASES[lang] ?? lang;
    return CODE_BLOCK_LANGUAGES.has(mapped) ? mapped : 'plaintext';
}

// Helper to transform Markdown code blocks to Payload's CustomCodeBlock (Lexical BlockNode)
export function convertMarkdownWithCodeBlocks(markdown: string, convertFn: (md: string) => any): any {
    const codeBlocks: Array<{ language: string; code: string }> = [];
    
    // Regex to match markdown code blocks
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```/g;
    
    let placeholderIndex = 0;
    const preprocessedMarkdown = markdown.replace(codeBlockRegex, (match, lang, code) => {
        codeBlocks.push({
            language: normalizeCodeLanguage(lang),
            code: code.trim()
        });
        // NOTE: The placeholder MUST contain no Markdown-active characters.
        // The earlier `__…__` form was parsed as bold emphasis by the Markdown
        // converter — the underscores were stripped and a bold text node was
        // produced, so the postprocess regex below never matched and the code
        // block was lost. Use an alphanumeric-only token.
        return `\n\nOJECODEBLOCKPLACEHOLDER${placeholderIndex++}END\n\n`;
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
                        const match = textNode.text.match(/^OJECODEBLOCKPLACEHOLDER(\d+)END$/);
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

    // convertMarkdownToLexical returns a SerializedEditorState ({ root: {...} }),
    // so the placeholder paragraphs live under `.root.children`, not directly under
    // `lexicalData`. Run the replacer on the root node (in place) and return the
    // original object. Without this, top-level code blocks are never replaced.
    const target = lexicalData.root ?? lexicalData;
    replacePlaceholders(target);
    return lexicalData;
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
