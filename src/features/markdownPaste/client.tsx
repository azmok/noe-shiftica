'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { $convertFromMarkdownString } from '@lexical/markdown'
// Import Lexical functions from Payload's proxy to avoid webpack bundle duplicate registration issues
import {
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  $getRoot,
  $parseSerializedNode,
  $insertNodes,
  $getSelection,
  $isRangeSelection
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createHeadlessEditor } from '@lexical/headless'
import { BlockNode } from '@payloadcms/richtext-lexical/client'

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
        // Dynamically attach a bubble-phase stopPropagation listener (shield) to Monaco Editor
        // container or raw input/textarea elements when they are focused/interacted with.
        // This ensures the element itself receives keydown and clipboard events (so Ctrl+A,
        // copy, paste, cut work perfectly inside Monaco), but prevents these events from
        // bubbling up to the parent Lexical editor which would otherwise intercept them.
        const attachShortcutShield = (target: HTMLElement | null) => {
            if (!target) return;

            const monacoContainer = target.closest('.monaco-editor') as HTMLElement;
            const shieldEl = monacoContainer || (
                (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable === false) ? target : null
            );

            if (shieldEl && !shieldEl.dataset.hasShortcutShield) {
                shieldEl.dataset.hasShortcutShield = 'true';
                
                const shieldListener = (event: Event) => {
                    // Prevent the event from bubbling up to Lexical
                    event.stopPropagation();
                };
                
                shieldEl.addEventListener('keydown', shieldListener);
                shieldEl.addEventListener('copy', shieldListener);
                shieldEl.addEventListener('cut', shieldListener);
                shieldEl.addEventListener('paste', shieldListener);
            }
        };

        const handleShortcutInterception = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            attachShortcutShield(target);
        };

        const handleClipboardInterception = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            attachShortcutShield(target);
        };

        // Use capture phase to attach the shield listener as early as possible.
        // Since the capture listeners themselves do NOT call stopPropagation(),
        // the browser continues propagating the event down to the target (Monaco),
        // and then our bubble shield catches and stops the event during the bubble phase.
        window.addEventListener('keydown', handleShortcutInterception, true);
        window.addEventListener('copy', handleClipboardInterception, true);
        window.addEventListener('cut', handleClipboardInterception, true);
        window.addEventListener('paste', handleClipboardInterception, true);

        return () => {
            window.removeEventListener('keydown', handleShortcutInterception, true);
            window.removeEventListener('copy', handleClipboardInterception, true);
            window.removeEventListener('cut', handleClipboardInterception, true);
            window.removeEventListener('paste', handleClipboardInterception, true);
        };
    }, []);

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

                // 特定の条件（例：先頭が # や -、テーブルの | 、またはコードブロックの ``` ）の時だけMarkdownとして処理
                const markdownRegex = /^(\`\`\`| *\||#|[-*+]|\d+\.)/m
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

                    const codeBlocks: Array<{ language: string; code: string }> = []
                    let placeholderIndex = 0

                    // Preprocess code blocks to bypass Lexical markdown parser limitations
                    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```/g
                    const preprocessedData = data.replace(codeBlockRegex, (match, lang, code) => {
                        codeBlocks.push({
                            language: lang.trim().toLowerCase() || 'javascript',
                            code: code.trim()
                        })
                        return `\n\n__OJE_CODE_BLOCK_PLACEHOLDER_${placeholderIndex++}__\n\n`
                    })

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
                            preprocessedData,  // ← preprocessedData with placeholders
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
                    const serializedState = headlessEditor.getEditorState().toJSON()
                    let serializedNodes = serializedState.root.children

                    // Postprocess: Replace placeholder paragraph nodes with custom code-block Lexical nodes
                    if (codeBlocks.length > 0) {
                        const replacePlaceholders = (node: any): any => {
                            if (!node) return node
                            if (node.children && Array.isArray(node.children)) {
                                const newChildren: any[] = []
                                for (const child of node.children) {
                                    if (child.type === 'paragraph' && child.children && child.children.length === 1) {
                                        const textNode = child.children[0]
                                        if (textNode.type === 'text' && typeof textNode.text === 'string') {
                                            const match = textNode.text.match(/^__OJE_CODE_BLOCK_PLACEHOLDER_(\d+)__$/)
                                            if (match) {
                                                const index = parseInt(match[1], 10)
                                                const savedBlock = codeBlocks[index]
                                                if (savedBlock) {
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
                                                    })
                                                    continue
                                                }
                                            }
                                        }
                                    }
                                    newChildren.push(replacePlaceholders(child))
                                }
                                node.children = newChildren
                            }
                            return node
                        }
                        serializedNodes = serializedNodes.map(node => replacePlaceholders(node))
                    }

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

// Monaco Code Block Toolbar Item component (Official Payload Lexical design)
function MonacoCodeToolbarItem() {
    const [editor] = useLexicalComposerContext()
    const { editorConfig } = useEditorConfigContext()

    const handleInsertMonacoCode = () => {
        // Insert custom code-block Lexical node securely using dynamic Klass lookup
        editor.update(() => {
            const uniqueId = `code-block-id-${Math.random().toString(36).substr(2, 9)}`;
            const blockNode = {
                format: '',
                type: 'block',
                version: 2,
                fields: {
                    blockType: 'code-block',
                    id: uniqueId,
                    language: 'javascript',
                    code: '// ここにコードを入力してください'
                }
            };
            try {
                // Dynamic lookup of registered 'block' node to bypass module registry duplication mismatch
                const nodesMap = (editor as any)._nodes;
                const blockConfig = nodesMap ? nodesMap.get('block') : null;
                
                if (!blockConfig || !blockConfig.klass) {
                    throw new Error("Registered 'block' node configuration not found in editor context.");
                }
                
                const BlockKlass = blockConfig.klass;
                
                // Safely create node instance under the editor's own registry context
                const parsedNode = BlockKlass.importJSON(blockNode as any);
                
                $insertNodes([parsedNode]);
            } catch (err) {
                console.error('Failed to insert Monaco Code Block:', err);
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleInsertMonacoCode}
            onMouseDown={(e) => {
                // Prevent focus moving from editor to the button, preserving Lexical selection state
                e.preventDefault();
            }}
            className="toolbar-popup__button"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                padding: '0',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: '#E2FF3D',
                cursor: 'pointer',
                transition: 'all 0.15s',
                outline: 'none',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Monaco Code Blockを挿入"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
        </button>
    );
}

export const MarkdownPasteClientFeature = createClientFeature({
    nodes: [BlockNode],
    plugins: [
        {
            Component: MarkdownPastePlugin,
            position: 'normal',
        },
    ],
    toolbarFixed: {
        groups: [
            {
                key: 'monacoCodeGroup',
                type: 'buttons',
                items: [
                    {
                        Component: MonacoCodeToolbarItem,
                        key: 'monacoCodeButton',
                    },
                ],
            },
        ],
    },
})
