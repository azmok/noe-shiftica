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

/**
 * posts/ フォルダのmdはCSS/JSを `<link rel="stylesheet">` / `<script src="...">`
 * で直接参照する運用（Google Drive/iPadのプレビューツール向け）。その実体は
 * MarkdownImporterUI側で同時アップロードされた.css/.jsファイルとして
 * customCss/customJsフィールドに別途格納されるので、本文からはこの参照タグ
 * だけを取り除く（残すとconvertMarkdownToLexicalが生HTMLをエスケープして
 * プレーンテキストのまま記事本文の先頭に出力してしまう）。
 * コードフェンス内の例示コードは対象外にするため、フェンスを退避してから処理する。
 * プレースホルダーはOJECODEBLOCKPLACEHOLDER方式と同じく英数字のみのトークンにし、
 * Markdownのアクティブ文字（アンダースコア等）を含めない。
 */
function stripAssetReferenceTags(markdown: string): string {
    const fences: string[] = [];
    let fenceIndex = 0;
    const withoutFences = markdown.replace(/```[\s\S]*?```/g, (m) => {
        fences.push(m);
        return `MDASSETFENCEPLACEHOLDER${fenceIndex++}END`;
    });

    const stripped = withoutFences
        .replace(/[ \t]*<link\b[^>]*rel=["']?stylesheet["']?[^>]*\/?>[ \t]*\n?/gi, '')
        .replace(/[ \t]*<script\b[^>]*\bsrc=["'][^"']*["'][^>]*>\s*<\/script>[ \t]*\n?/gi, '');

    return stripped.replace(/MDASSETFENCEPLACEHOLDER(\d+)END/g, (_, i) => fences[Number(i)]);
}

/**
 * posts/ フォルダのmdは、SVGシンボル定義や比較チャットUIのdiv構造のような
 * 生HTMLをMarkdown本文の途中にそのままベタ書きしている（Google Drive/iPad
 * 側のプレビューツールが素のHTMLも扱える前提で作られているため）。
 * convertMarkdownToLexicalはこれをMarkdown構文として解釈できず、タグを
 * プレーンテキストとしてエスケープしてしまうので、行頭（インデントなしの
 * 独立行）から始まるHTMLタグ／コメントのブロックだけを検出して抜き出し、
 * customCodeBlock（'code-block'）に `renderAsHtml: true` フラグ付きで
 * 差し替える。
 *
 * 文中に埋め込まれたインラインHTML（例: テーブルセル内の `<u>text</u>`）は
 * 行頭にマッチしないため対象外＝そのまま通常のMarkdownとして処理される。
 * ネスト判定は同じタグ名の開始/終了タグ数をカウントするだけの簡易パーサー
 * （属性値内に `>` を含まない、整形済みのエクスポート済みHTMLが前提）。
 */
function extractRawHtmlBlocks(markdown: string): { text: string; blocks: string[] } {
    const fences: string[] = [];
    let fenceIndex = 0;
    const withoutFences = markdown.replace(/```[\s\S]*?```/g, (m) => {
        fences.push(m);
        return `MDRAWHTMLFENCEPLACEHOLDER${fenceIndex++}END`;
    });

    const lines = withoutFences.split('\n');
    const blocks: string[] = [];
    const out: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trimStart();

        // Multi-line (or single-line) HTML comment starting at column 0.
        if (/^<!--/.test(trimmed)) {
            const chunk: string[] = [];
            while (i < lines.length) {
                chunk.push(lines[i]);
                const closed = lines[i].includes('-->');
                i++;
                if (closed) break;
            }
            blocks.push(chunk.join('\n'));
            out.push(`RAWHTMLBLOCKPLACEHOLDER${blocks.length - 1}END`, '');
            continue;
        }

        // An opening tag (not self-closing) starting at column 0.
        const tagMatch = trimmed.match(/^<([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/)?>/);
        if (tagMatch && !tagMatch[2]) {
            const tag = tagMatch[1];
            const openRe = new RegExp(`<${tag}\\b[^>]*?(/)?>`, 'g');
            const closeRe = new RegExp(`</${tag}>`, 'g');
            const chunk: string[] = [];
            let depth = 0;
            while (i < lines.length) {
                const l = lines[i];
                chunk.push(l);
                for (const m of l.matchAll(openRe)) { if (!m[1]) depth++; }
                for (const _m of l.matchAll(closeRe)) { depth--; }
                i++;
                if (depth <= 0) break;
            }
            blocks.push(chunk.join('\n'));
            out.push(`RAWHTMLBLOCKPLACEHOLDER${blocks.length - 1}END`, '');
            continue;
        }

        out.push(line);
        i++;
    }

    const text = out.join('\n').replace(/MDRAWHTMLFENCEPLACEHOLDER(\d+)END/g, (_, i2) => fences[Number(i2)]);
    return { text, blocks };
}

/**
 * Replaces RAWHTMLBLOCKPLACEHOLDER{n}END placeholder paragraphs in a
 * converted Lexical tree with 'code-block' (CustomCodeBlock) block nodes
 * carrying the original HTML back, flagged `renderAsHtml: true` so the
 * frontend renders them live via dangerouslySetInnerHTML instead of as a
 * syntax-highlighted sample. Reuses the existing 'code-block' block type
 * rather than registering a new Lexical block — a separate 'raw-html-block'
 * Block trips a "Cannot read properties of undefined (reading
 * 'blockReferences')" crash in @payloadcms/richtext-lexical's client-side
 * BlocksFeature schema map (repro'd on 3.79.0; root cause not chased down —
 * flag this if it recurs when adding a genuinely new Lexical block type).
 * Mirrors the placeholder-swap pattern convertMarkdownWithCodeBlocks uses
 * for fenced code blocks.
 */
function restoreRawHtmlBlocks(lexicalData: any, blocks: string[]): any {
    if (blocks.length === 0 || !lexicalData || typeof lexicalData !== 'object') {
        return lexicalData;
    }

    const replaceIn = (node: any): any => {
        if (!node) return node;

        if (node.children && Array.isArray(node.children)) {
            const newChildren: any[] = [];
            for (const child of node.children) {
                if (child.type === 'paragraph' && child.children && child.children.length === 1) {
                    const textNode = child.children[0];
                    if (textNode.type === 'text' && typeof textNode.text === 'string') {
                        const match = textNode.text.match(/^RAWHTMLBLOCKPLACEHOLDER(\d+)END$/);
                        if (match) {
                            const html = blocks[parseInt(match[1], 10)];
                            if (html !== undefined) {
                                newChildren.push({
                                    format: '',
                                    type: 'block',
                                    version: 2,
                                    fields: {
                                        blockType: 'code-block',
                                        id: `raw-html-block-id-${Math.random().toString(36).substr(2, 9)}`,
                                        language: 'html',
                                        code: html,
                                        renderAsHtml: true,
                                    },
                                });
                                continue;
                            }
                        }
                    }
                }
                newChildren.push(replaceIn(child));
            }
            node.children = newChildren;
        }

        return node;
    };

    const target = lexicalData.root ?? lexicalData;
    replaceIn(target);
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

        const strippedBody = stripAssetReferenceTags(parsed.content || '')
        const { text: markdownBody, blocks: rawHtmlBlocks } = extractRawHtmlBlocks(strippedBody)
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
        restoreRawHtmlBlocks(lexicalData, rawHtmlBlocks)

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
                                style: '', text: ' ',
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
