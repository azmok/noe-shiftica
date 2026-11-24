import type { Field, Plugin } from 'payload'

/**
 * 「Markdown そのまま表示」プラグイン（設計書: docs/markdown-render-mode.md）。
 *
 * 指定したコレクションに renderMode / markdownSource / markdownMedia を追加する。
 * `renderMode === 'markdown'` の記事だけ、表示側（PostArticle）が Lexical ではなく
 * markdownSource を markdown-it で HTML にして出す。content（Lexical）は今まで通り保存される
 * ので、読了時間・OG・検索・管理画面の編集などの既存機能は変わらない。
 *
 * renderMode は select ではなく text にしている（select は Postgres の enum 型が増えて、
 * バージョン用テーブルも含めたマイグレーションが壊れやすいため）。
 */

export interface MarkdownRenderPluginOptions {
  /** Collection slugs that get the markdown render fields */
  collections: string[]
}

export const RENDER_MODES = ['lexical', 'markdown'] as const
export type RenderMode = (typeof RENDER_MODES)[number]

export const isMarkdownMode = (post: { renderMode?: unknown; markdownSource?: unknown } | null | undefined): boolean =>
  post?.renderMode === 'markdown' && typeof post?.markdownSource === 'string' && post.markdownSource.length > 0

const isMarkdown = (_: unknown, siblingData: Record<string, unknown>) => siblingData?.renderMode === 'markdown'

export const markdownRenderFields: Field[] = [
  {
    name: 'renderMode',
    type: 'text',
    label: '表示モード',
    defaultValue: 'lexical',
    validate: (value: unknown) =>
      value == null || value === '' || (RENDER_MODES as readonly string[]).includes(value as string)
        ? true
        : `renderMode は ${RENDER_MODES.join(' / ')} のどちらかです`,
    admin: {
      position: 'sidebar',
      description: "'markdown' のとき、本文は下の markdownSource をそのまま表示します（Lexical は検索・読了時間用）。通常は 'lexical'。",
    },
  },
  {
    name: 'markdownSource',
    type: 'textarea',
    label: 'Markdown 原文',
    admin: {
      readOnly: true,
      condition: isMarkdown,
      description: 'noe-posts から送られた原文（前処理済み）。ここでは編集せず、noe-posts 側で直して再送してください。',
    },
  },
  {
    name: 'markdownMedia',
    type: 'json',
    label: '本文画像の対応表',
    admin: {
      readOnly: true,
      condition: isMarkdown,
      description: 'ファイル名 → { id, url }。本文の ./xxx.png をこの URL に書き換えます。',
    },
  },
]

export const markdownRenderPlugin =
  (options: MarkdownRenderPluginOptions): Plugin =>
  (config) => ({
    ...config,
    collections: (config.collections ?? []).map((collection) =>
      options.collections.includes(collection.slug)
        ? { ...collection, fields: [...collection.fields, ...markdownRenderFields] }
        : collection,
    ),
  })
