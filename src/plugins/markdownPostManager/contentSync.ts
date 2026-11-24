import type { CollectionBeforeChangeHook } from 'payload'
import { parseMarkdownToLexical } from '../markdownImport'
import { openLinksInNewTab, prepareArticleMarkdown } from '../ai-api/markdown'
import type { MarkdownMedia } from './render'

/**
 * 管理画面で markdownSource を直したとき、検索・読了時間・OG 用の content（Lexical）も作り直す。
 *
 * /api/ai/posts は自分で content を作って渡すので、そのときは req.context.markdownContentProvided を立てて
 * ここを飛ばす（二重に変換しない）。原文が変わっていなければ何もしない。
 */
export const MARKDOWN_CONTENT_PROVIDED = 'markdownContentProvided'

const PLACEHOLDER_RE = /^MDIMAGEPLACEHOLDER(\d+)END$/

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[]; [k: string]: unknown }

/** 画像の置き場所の印を、media があれば画像（upload）に、無ければ段落ごと消す */
export function placeImages(root: LexicalNode | undefined, ids: Array<number | string | undefined>): void {
  if (!root || !Array.isArray(root.children)) return
  const next: LexicalNode[] = []
  for (const child of root.children) {
    const only = child?.type === 'paragraph' && child.children?.length === 1 ? child.children[0] : null
    const m = only?.type === 'text' && typeof only.text === 'string' ? only.text.match(PLACEHOLDER_RE) : null
    if (m) {
      const id = ids[Number(m[1])]
      if (id !== undefined) next.push({ type: 'upload', relationTo: 'media', value: id, fields: null, format: '', version: 3 })
      continue
    }
    placeImages(child, ids)
    next.push(child)
  }
  root.children = next
}

export async function markdownToContent(source: string, media: MarkdownMedia, config: unknown): Promise<unknown> {
  const prepared = prepareArticleMarkdown(source)
  const ids = prepared.images.map((img) => {
    const key = img.src.replace(/^\.\//, '')
    return (media[key] ?? media[key.split('/').pop() ?? key])?.id
  })
  const { lexical } = await parseMarkdownToLexical(prepared.markdown, config as any)
  placeImages((lexical as { root?: LexicalNode }).root, ids)
  openLinksInNewTab(lexical as Parameters<typeof openLinksInNewTab>[0])
  return lexical
}

export const syncContentFromMarkdown: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!data || req.context?.[MARKDOWN_CONTENT_PROVIDED]) return data
  const mode = data.renderMode ?? originalDoc?.renderMode
  const source = data.markdownSource
  if (mode !== 'markdown' || typeof source !== 'string' || !source.trim()) return data
  if (source === originalDoc?.markdownSource) return data
  try {
    const media = (data.markdownMedia ?? originalDoc?.markdownMedia ?? {}) as MarkdownMedia
    data.content = await markdownToContent(source, media, req.payload.config)
  } catch (e) {
    // content が作れなくても、原文（表示に使う本体）の保存は止めない
    req.payload.logger.warn({ err: e }, '[markdownPostManager] content（Lexical）を作り直せませんでした')
  }
  return data
}
