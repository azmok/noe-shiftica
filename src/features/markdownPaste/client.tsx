'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { $convertFromMarkdownString } from '@lexical/markdown'
import { COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { useEffect } from 'react'
import { $getSelection, $isRangeSelection, $createParagraphNode } from 'lexical'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { $convertFromMarkdownString } from '@lexical/markdown'
import { COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { useEffect } from 'react'

const MarkdownPastePlugin = () => {
    const [editor] = useLexicalComposerContext()
    const { editorConfig } = useEditorConfigContext()

useEffect(() => {
return editor.registerCommand(
PASTE_COMMAND,
(event: ClipboardEvent) => {
const data = event.clipboardData?.getData('text/plain')
// 特定の条件（例：先頭が # や -、またはテーブルの | ）の時だけMarkdownとして処理
if (data && /^(#|[-*+]|\d+\.|\|)\s/m.test(data)) {
                    editor.update(() => {
                        const selection = $getSelection()
                        
                        if ($isRangeSelection(selection)) {
                            // 選択範囲がある場合は、その範囲を削除してから挿入
                            selection.insertNodes([$createParagraphNode()])
                            
                            // マークダウンを現在のカーソル位置に変換して挿入
$convertFromMarkdownString(
data,
editorConfig.features.markdownTransformers,
                        )
                        } else {
                            // 選択範囲がない場合はデフォルトの動作（全体置換）
                            $convertFromMarkdownString(
                                data,
                                editorConfig.features.markdownTransformers,
                            )
                        }
})
return true // デフォルトのペーストをキャンセル
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
