'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { COMMAND_PRIORITY_HIGH, COPY_COMMAND, $getSelection, $isRangeSelection } from 'lexical'
import { $generateHtmlFromNodes } from '@lexical/html'

/**
 * 簡易的な HTML → Markdown 変換ツール
 * Lexicalが生成したクリーンなHTMLをMarkdownに変換する
 */
function simpleHtmlToMarkdown(html: string): string {
  // SSR環境での実行防止
  if (typeof window === 'undefined') return ''

  const div = document.createElement('div')
  div.innerHTML = html

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return ''

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()

    // 子ノードを再帰的に処理
    let content = Array.from(node.childNodes).map(walk).join('')

    if (tag === 'b' || tag === 'strong') return `**${content}**`
    if (tag === 'i' || tag === 'em') return `*${content}*`
    if (tag === 's' || tag === 'strike' || tag === 'del') return `~~${content}~~`
    if (tag === 'code') {
      // 複数行のコードブロックの場合はバッククォート3つ
      if (content.includes('\n')) {
        return `\n\`\`\`\n${content}\n\`\`\`\n`
      }
      return `\`${content}\``
    }
    if (tag === 'a') return `[${content}](${el.getAttribute('href') || ''})`
    if (tag === 'h1') return `# ${content}\n\n`
    if (tag === 'h2') return `## ${content}\n\n`
    if (tag === 'h3') return `### ${content}\n\n`
    if (tag === 'h4') return `#### ${content}\n\n`
    if (tag === 'h5') return `##### ${content}\n\n`
    if (tag === 'h6') return `###### ${content}\n\n`
    if (tag === 'p') return `${content}\n\n`
    if (tag === 'br') return `\n`
    if (tag === 'ul' || tag === 'ol') return `${content}\n`
    if (tag === 'li') {
      const isOl = el.parentElement?.tagName.toLowerCase() === 'ol'
      return isOl ? `1. ${content}\n` : `- ${content}\n`
    }
    if (tag === 'blockquote') return `> ${content}\n\n`
    if (tag === 'hr') return `\n---\n\n`

    // divやspanなどは内容をそのまま返す
    if (tag === 'div') return `${content}\n`
    
    return content
  }

  return walk(div).trim()
}

const MarkdownCopyPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Ctrl+C (Windows/Mac) または iOSのポップアップの「コピー」をフックする
    return editor.registerCommand(
      COPY_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData
        if (!clipboardData) return false

        let markdown = ''
        
        // 選択範囲を読み取ってHTMLを生成し、それをMarkdownに変換する
        editor.getEditorState().read(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            // Lexicalの標準機能で選択範囲 of HTMLを生成
            const htmlString = $generateHtmlFromNodes(editor, selection)
            // HTMLをMarkdownに変換
            markdown = simpleHtmlToMarkdown(htmlString)
          }
        })

        if (markdown) {
          // クリップボードにマークダウンをセット
          clipboardData.setData('text/plain', markdown)
          // ペースト先の互換性のために一応HTMLもセットしておく
          // （リッチテキストエディタにペーストした場合はフォーマットが維持される）
          // PayloadのMarkdownPastePluginが存在するため、テキストとしてペーストしてもMarkdownとして解釈される
          // event.clipboardData.setData('text/html', ... )
          
          event.preventDefault()
          return true // 標準のコピー処理をキャンセル
        }

        return false
      },
      COMMAND_PRIORITY_HIGH
    )
  }, [editor])

  return null
}

export const MarkdownCopyClientFeature = createClientFeature({
  plugins: [
    {
      Component: MarkdownCopyPlugin,
      position: 'normal',
    },
  ],
})
