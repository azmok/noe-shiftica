'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { $convertFromMarkdownString } from '@lexical/markdown'
import { COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { useEffect } from 'react'
import { createHeadlessEditor } from '@lexical/headless'
import { $getRoot, $parseSerializedNode, $insertNodes } from 'lexical'

const DEBUG = false // ★ DEBUG FLAG — set to false when done debugging

/**
 * Sanitize clipboard text for reliable markdown table parsing.
 *
 * Lexical's normalizeMarkdown uses TABLE_ROW_REG_EXP (/^\|(.+)\|\s?$/)
 * to decide whether lines should stay separate. This regex is strict:
 *   - Requires line to START with | (no leading whitespace)
 *   - Allows only 0-1 trailing whitespace chars (\s?)
 *   - Doesn't handle \r from CRLF line endings
 *
 * When clipboard text has any of these, normalizeMarkdown merges
 * all table lines into one long paragraph, destroying the table.
 *
 * This function normalizes the input so the regex matches correctly.
 */
function sanitizeMarkdownForPaste(input: string): string {
    return input
        // 1. Normalize CRLF / lone CR → LF
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // 2. Per-line cleanup
        .split('\n')
        .map(line => {
            // Trim trailing whitespace (preserves empty lines)
            let cleaned = line.trimEnd()
            // Strip leading whitespace from table-like lines
            if (/^\s*\|/.test(cleaned)) {
                cleaned = cleaned.trimStart()
            }
            return cleaned
        })
        .join('\n')
}

const MarkdownPastePlugin = () => {
    const [editor] = useLexicalComposerContext()
    const { editorConfig } = useEditorConfigContext()

    useEffect(() => {
        return editor.registerCommand(
            PASTE_COMMAND,
            (event: ClipboardEvent) => {
                const rawData = event.clipboardData?.getData('text/plain')
                const htmlData = event.clipboardData?.getData('text/html')

                if (DEBUG) {
                    console.group('[MarkdownPaste] === PASTE EVENT ===')
                    console.log('[MarkdownPaste] 1. Raw clipboard text/plain:', JSON.stringify(rawData))
                    console.log('[MarkdownPaste] 1. Raw clipboard text/html:', JSON.stringify(htmlData?.slice(0, 500)))
                    console.log('[MarkdownPaste] 1. Data length:', rawData?.length)
                }

                // 特定の条件（例：先頭が # や -、またはテーブルの | ）の時だけMarkdownとして処理
                // | は前後の空白を許容する
                const markdownRegex = /^( *\||#|[-*+]|\d+\.)/m
                const regexMatch = rawData ? markdownRegex.test(rawData) : false

                if (DEBUG) {
                    console.log('[MarkdownPaste] 2. Markdown regex test:', regexMatch)
                    if (rawData) {
                        const lines = rawData.split('\n')
                        console.log('[MarkdownPaste] 2. Total lines:', lines.length)
                        console.log('[MarkdownPaste] 2. First 10 lines (raw):')
                        lines.slice(0, 10).forEach((line, i) => {
                            const tableRowMatch = /^\|(.+)\|\s?$/.test(line)
                            const tableDividerMatch = /^(\| ?:?-*:? ?)+\|\s?$/.test(line)
                            console.log(`  [line ${i}] tableRow=${tableRowMatch} divider=${tableDividerMatch} : ${JSON.stringify(line)}`)
                        })
                    }
                }

                if (rawData && regexMatch) {
                    // Sanitize clipboard data for reliable table detection
                    const data = sanitizeMarkdownForPaste(rawData)

                    if (DEBUG) {
                        console.log('[MarkdownPaste] 2b. After sanitize:', JSON.stringify(data))
                        const sanitizedLines = data.split('\n')
                        console.log('[MarkdownPaste] 2b. Sanitized lines:')
                        sanitizedLines.slice(0, 10).forEach((line, i) => {
                            const tableRowMatch = /^\|(.+)\|\s?$/.test(line)
                            const tableDividerMatch = /^(\| ?:?-*:? ?)+\|\s?$/.test(line)
                            console.log(`  [line ${i}] tableRow=${tableRowMatch} divider=${tableDividerMatch} : ${JSON.stringify(line)}`)
                        })
                    }

                    if (DEBUG) {
                        console.log('[MarkdownPaste] 3. Transformers available:', editorConfig.features.markdownTransformers.length)
                        editorConfig.features.markdownTransformers.forEach((t, i) => {
                            const tObj = typeof t === 'function' ? t : t
                            console.log(`  [transformer ${i}] type=${(tObj as any).type} regExp=${(tObj as any).regExp} deps=${(tObj as any).dependencies?.map((d: any) => d?.name || d?.getType?.() || '?').join(',')}`)
                        })
                    }

                    // ヘッドレスエディタを使用して安全にマークダウンをパースする
                    // （replace()を呼び出すトランスフォーマーでのルートノード欠如によるフリーズを防ぐ）
                    const headlessEditor = createHeadlessEditor({
                        nodes: editorConfig.features.nodes,
                    })

                    if (DEBUG) {
                        console.log('[MarkdownPaste] 4. Headless editor nodes registered:', editorConfig.features.nodes.map((n: any) => n.type || n?.getType?.() || n?.name || '?'))
                    }

                    headlessEditor.update(() => {
                        if (DEBUG) {
                            console.log('[MarkdownPaste] 5. Running $convertFromMarkdownString with SANITIZED data...')
                        }
                        $convertFromMarkdownString(
                            data,  // ← sanitized, not raw
                            editorConfig.features.markdownTransformers,
                        )
                        if (DEBUG) {
                            const root = $getRoot()
                            const children = root.getChildren()
                            console.log('[MarkdownPaste] 6. After conversion — root children count:', children.length)
                            children.forEach((child, i) => {
                                console.log(`  [child ${i}] type=${child.getType()} textContent=${JSON.stringify(child.getTextContent().slice(0, 200))}`)
                                try {
                                    const json = child.exportJSON()
                                    console.log(`  [child ${i}] exportJSON:`, JSON.stringify(json).slice(0, 500))
                                } catch (e) {
                                    console.error(`  [child ${i}] exportJSON FAILED:`, e)
                                }
                            })
                        }
                    }, { discrete: true })

                    // パースされたノードをシリアライズして取得（エディタ間でのノード移送のため）
                    // NOTE: editorState.toJSON() uses the internal exportNodeToJSON() which
                    // recursively serializes children. Direct node.exportJSON() only returns
                    // the node's own properties with an empty children[] array.
                    const serializedState = headlessEditor.getEditorState().toJSON()
                    const serializedNodes = serializedState.root.children

                    if (DEBUG) {
                        console.log('[MarkdownPaste] 7. Serialized nodes count:', serializedNodes.length)
                        serializedNodes.forEach((sn, i) => {
                            console.log(`  [serialized ${i}] type=${sn.type}`, JSON.stringify(sn).slice(0, 500))
                        })
                    }

                    if (serializedNodes.length > 0) {
                        editor.update(() => {
                            // シリアライズされたデータから現在のエディタ用のノードを再成型
                            const nodes = serializedNodes.map(serializedNode => {
                                if (DEBUG) {
                                    console.log('[MarkdownPaste] 8. Parsing serialized node:', serializedNode.type)
                                }
                                return $parseSerializedNode(serializedNode)
                            })

                            if (DEBUG) {
                                console.log('[MarkdownPaste] 9. Parsed nodes for insertion:', nodes.map(n => n.getType()))
                            }

                            // $insertNodesを使用することで、テーブルなどのブロックノードが
                            // 正しく（例えばパラグラフを分割して）挿入されるようになる。
                            // これにより "Expected node TableNode of type table to have a block ancestor" エラーを防ぐ。
                            $insertNodes(nodes)

                            if (DEBUG) {
                                console.log('[MarkdownPaste] 10. $insertNodes completed successfully')
                            }
                        })

                        if (DEBUG) {
                            console.log('[MarkdownPaste] ✅ Paste handled as markdown')
                            console.groupEnd()
                        }
                        return true // デフォルトのペーストをキャンセル
                    }

                    if (DEBUG) {
                        console.warn('[MarkdownPaste] ⚠️ Conversion produced 0 nodes — falling through to default paste')
                        console.groupEnd()
                    }
                }

                if (DEBUG && !(rawData && regexMatch)) {
                    console.log('[MarkdownPaste] ⏩ Not markdown — using default paste behavior')
                    console.groupEnd()
                }
                return false
            },
            COMMAND_PRIORITY_LOW,
        )
    }, [editor, editorConfig])
    return null
}

export const MarkdownPasteClientFeature = createClientFeature({
    plugins: [
        {
            Component: MarkdownPastePlugin,
            position: 'normal',
        },
    ],
})
