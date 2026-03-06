'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { $convertFromMarkdownString } from '@lexical/markdown'
import { COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { useEffect } from 'react'
import { createHeadlessEditor } from '@lexical/headless'
import { $getRoot, $parseSerializedNode, $insertNodes } from 'lexical'

const MarkdownPastePlugin = () => {
    const [editor] = useLexicalComposerContext()
    const { editorConfig } = useEditorConfigContext()

    useEffect(() => {
        return editor.registerCommand(
            PASTE_COMMAND,
            (event: ClipboardEvent) => {
                const data = event.clipboardData?.getData('text/plain')
                // 特定の条件（例：先頭が # や -、またはテーブルの | ）の時だけMarkdownとして処理
                // | は前後の空白を許容する
                if (data && /^( *\||#|[-*+]|\d+\.)/m.test(data)) {
                    // ヘッドレスエディタを使用して安全にマークダウンをパースする
                    // （replace()を呼び出すトランスフォーマーでのルートノード欠如によるフリーズを防ぐ）
                    const headlessEditor = createHeadlessEditor({
                        nodes: editorConfig.features.nodes,
                    })

                    headlessEditor.update(() => {
                        $convertFromMarkdownString(
                            data,
                            editorConfig.features.markdownTransformers,
                        )
                    }, { discrete: true })

                    // パースされたノードをシリアライズして取得（エディタ間でのノード移送のため）
                    const serializedNodes = headlessEditor.getEditorState().read(() =>
                        $getRoot().getChildren().map(node => node.exportJSON())
                    )

                    if (serializedNodes.length > 0) {
                        editor.update(() => {
                            // シリアライズされたデータから現在のエディタ用のノードを再成型
                            const nodes = serializedNodes.map(serializedNode => $parseSerializedNode(serializedNode))

                            // $insertNodesを使用することで、テーブルなどのブロックノードが
                            // 正しく（例えばパラグラフを分割して）挿入されるようになる。
                            // これにより "Expected node TableNode of type table to have a block ancestor" エラーを防ぐ。
                            $insertNodes(nodes)
                        })
                        return true // デフォルトのペーストをキャンセル
                    }
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
