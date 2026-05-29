/**
 * conversion.ts
 *
 * Lexical JSON ↔ HTML の双方向変換ユーティリティ。
 * 各ステップで console.group / console.log を使い、
 * 変換中のノード情報・パース結果をブラウザコンソールへ出力する。
 */

// Import HTML generators from Payload's proxy to avoid node type mismatch
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@payloadcms/richtext-lexical/lexical/html'
// Import Lexical core functions from Payload's proxy to ensure identical bundle registration
import {
  $createParagraphNode,
  $getRoot,
  $insertNodes,
  $parseSerializedNode,
  type LexicalEditor,
  type LexicalNode,
} from '@payloadcms/richtext-lexical/lexical'

// ----------------------------------------------------------------
// Helper: ノード情報をデバッグ用に整形
// ----------------------------------------------------------------

function debugNodeInfo(node: LexicalNode): object {
  return {
    type: node.getType(),
    key: node.getKey(),
    // TextNode ならテキスト内容も表示
    text: 'getTextContent' in node ? (node as any).getTextContent() : undefined,
    childCount:
      'getChildrenSize' in node ? (node as any).getChildrenSize() : undefined,
  }
}

function debugNodeTree(
  node: LexicalNode,
  depth = 0,
  maxDepth = 6,
): object | string {
  if (depth > maxDepth) return '...(truncated)'
  const info: any = debugNodeInfo(node)
  if ('getChildren' in node) {
    const children = (node as any).getChildren() as LexicalNode[]
    if (children.length > 0) {
      info.children = children.map((c) => debugNodeTree(c, depth + 1, maxDepth))
    }
  }
  return info
}

// ----------------------------------------------------------------
// Lexical JSON → HTML
// ----------------------------------------------------------------

/**
 * editor の現在の状態を HTML 文字列へ変換する。
 * Lexical の `read()` スコープ内で呼び出すこと。
 */
export function lexicalToHtml(editor: LexicalEditor): string {
  let html = ''

  editor.getEditorState().read(() => {
    // console.group('[HtmlSource] ▶ lexicalToHtml')

    try {
      const root = $getRoot()
      const topNodes = root.getChildren()

      // console.log('[HtmlSource] root child count:', topNodes.length)
      // console.log(
      //   '[HtmlSource] node tree:',
      //   debugNodeTree(root),
      // )

      // topNodes.forEach((node, i) => {
      //   console.group(`[HtmlSource]   node[${i}] type="${node.getType()}"`)
      //   console.log(debugNodeInfo(node))
      //   console.groupEnd()
      // })

      html = $generateHtmlFromNodes(editor)

      // console.log('[HtmlSource] generated HTML length:', html.length)
      // console.log(
      //   '[HtmlSource] HTML preview:',
      //   html.length > 500 ? html.slice(0, 500) + '…' : html,
      // )
    } catch (err) {
      console.error('[HtmlSource] lexicalToHtml ERROR:', err)
    }

    // console.groupEnd()
  })

  return html
}

// ----------------------------------------------------------------
// HTML → Lexical JSON (Re-parse & replace)
// ----------------------------------------------------------------

/**
 * HTML 文字列を Lexical ノードへパースし、エディタ状態を置き換える。
 * editor.update() スコープ内で呼び出すこと。
 */
export function htmlToLexical(editor: LexicalEditor, html: string): void {
  // console.group('[HtmlSource] ▶ htmlToLexical')
  // console.log('[HtmlSource] input HTML length:', html.length)
  // console.log(
  //   '[HtmlSource] HTML preview:',
  //   html.length > 500 ? html.slice(0, 500) + '…' : html,
  // )

  try {
    // 1. DOMParserの型不一致バグ（Nt vs _e）を避けるため、<hr> タグをプレースホルダー段落に置換してパースをバイパス
    const preprocessedHtml = html.replace(/<hr\b[^>]*\/?>/gi, '<p>__OJE_HR_PLACEHOLDER__</p>')

    // ブラウザ DOM パーサーで HTML → DOM
    const parser = new DOMParser()
    const dom = parser.parseFromString(preprocessedHtml, 'text/html')

    // パースエラー検出
    const parseError = dom.querySelector('parsererror')
    if (parseError) {
      console.warn('[HtmlSource] DOMParser reported error:', parseError.textContent)
    }

    // console.group('[HtmlSource] parsed DOM body children')
    // Array.from(dom.body.childNodes).forEach((child, i) => {
    //   console.log(
    //     `  [${i}] nodeName="${child.nodeName}" nodeType=${child.nodeType}`,
    //     child instanceof Element ? child.outerHTML.slice(0, 120) : child.textContent,
    //   )
    // })
    // console.groupEnd()

    // Lexical ノードへ変換 (Using shared proxy generator to prevent mismatch error)
    const nodes: LexicalNode[] = $generateNodesFromDOM(editor, dom)

    // console.log('[HtmlSource] generated Lexical nodes count:', nodes.length)
    // nodes.forEach((node, i) => {
    //   console.log(
    //     `[HtmlSource]   nodes[${i}]:`,
    //     debugNodeInfo(node),
    //   )
    // })

    // ルートをクリアして新しいノードを挿入
    const root = $getRoot()
    root.clear()

    if (nodes.length === 0) {
      console.warn('[HtmlSource] no nodes generated — inserting empty paragraph')
      root.append($createParagraphNode())
    } else {
      // $insertNodes はルート直下に追加する
      root.select()
      $insertNodes(nodes)

      // 2. 挿入されたノードを走査し、プレースホルダー段落を正規の HorizontalRuleNode へ置換
      const topNodes = root.getChildren()
      topNodes.forEach((node) => {
        if (node.getType() === 'paragraph') {
          const textContent = node.getTextContent()
          if (textContent === '__OJE_HR_PLACEHOLDER__') {
            try {
              // $parseSerializedNode dynamically maps the 'horizontalrule' type using Payload's active registry,
              // avoiding any direct class loading mismatches.
              const hrSerialized = {
                type: 'horizontalrule',
                version: 1,
              }
              const hrNode = $parseSerializedNode(hrSerialized as any)
              node.replace(hrNode)
            } catch (hrErr) {
              console.error('[HtmlSource] Failed to restore HorizontalRuleNode from placeholder:', hrErr)
            }
          }
        }
      })
    }
  } catch (err) {
    console.error('[HtmlSource] htmlToLexical ERROR:', err)
    throw err
  }

  // console.groupEnd()
}
