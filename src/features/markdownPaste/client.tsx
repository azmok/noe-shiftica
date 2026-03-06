'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import { COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

const MarkdownPastePlugin = () => {
    const [editor] = useLexicalComposerContext()

    useEffect(() => {
        return editor.registerCommand(
            PASTE_COMMAND,
            (event: ClipboardEvent) => {
                const data = event.clipboardData?.getData('text/plain')
                // 特定の条件（例：先頭が # や - ）の時だけMarkdownとして処理
                if (data && /^(#|[-*+]|\d+\.)\s/m.test(data)) {
                    editor.update(() => {
                        $convertFromMarkdownString(data, TRANSFORMERS)
                    })
                    return true // デフォルトのペーストをキャンセル
                }
                return false
            },
            COMMAND_PRIORITY_LOW,
        )
    }, [editor])
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
