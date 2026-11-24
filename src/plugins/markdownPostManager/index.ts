import type { Field, Plugin } from 'payload'
import { markdownRevision } from './revision'
import { syncContentFromMarkdown } from './contentSync'

/**
 * markdownPostManager — Markdown 記事を DB で持ち、そのまま表示するプラグイン
 * （設計書: docs/markdown-post-manager-and-style-editor.md / 表示の仕組み: docs/markdown-render-mode.md）。
 *
 * 指定したコレクションに renderMode / markdownSource / markdownMedia を追加する。
 * `renderMode === 'markdown'` の記事だけ、表示側（PostArticle）が Lexical ではなく
 * markdownSource を markdown-it で HTML にして出す。content（Lexical）は今まで通り保存される
 * ので、読了時間・OG・検索・管理画面の編集などの既存機能は変わらない。
 *
 * renderMode は select ではなく text にしている（select は Postgres の enum 型が増えて、
 * バージョン用テーブルも含めたマイグレーションが壊れやすいため）。
 */

export interface MarkdownPostManagerOptions {
  /** Collection slugs that get the markdown render fields */
  collections: string[]
}

export const RENDER_MODES = ['lexical', 'markdown'] as const
export type RenderMode = (typeof RENDER_MODES)[number]

export const isMarkdownMode = (post: { renderMode?: unknown; markdownSource?: unknown } | null | undefined): boolean =>
  post?.renderMode === 'markdown' && typeof post?.markdownSource === 'string' && post.markdownSource.length > 0

const isMarkdown = (_: unknown, siblingData: Record<string, unknown>) => siblingData?.renderMode === 'markdown'

export const markdownPostFields: Field[] = [
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
      condition: isMarkdown,
      description:
        '本文の Markdown。公開後はここ（DB）が正本です。プレビューの段落・見出し・表のセルをクリックしても直せます。保存すると検索・読了時間用の本文（Lexical）も作り直します。',
      components: {
        Field: '@/plugins/markdownPostManager/admin/MarkdownEditorField#MarkdownEditorField',
      },
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
  {
    // 上書きガード用の「版の印」。保存のたびに markdownSource から計算し直す（手では書かない）
    name: 'markdownRevision',
    type: 'text',
    label: 'Markdown の版',
    admin: {
      readOnly: true,
      position: 'sidebar',
      condition: isMarkdown,
      description: 'Markdown 原文から自動で計算する印。Git から上書きするとき、DB の方が新しくないかの確認に使います。',
    },
    hooks: {
      beforeChange: [
        ({ siblingData, originalDoc }) => {
          const source =
            typeof siblingData?.markdownSource === 'string'
              ? siblingData.markdownSource
              : typeof originalDoc?.markdownSource === 'string'
                ? originalDoc.markdownSource
                : null
          return source ? markdownRevision(source) : null
        },
      ],
    },
  },
]

export const markdownPostManager =
  (options: MarkdownPostManagerOptions): Plugin =>
  (config) => ({
    ...config,
    collections: (config.collections ?? []).map((collection) =>
      options.collections.includes(collection.slug)
        ? {
            ...collection,
            fields: [...collection.fields, ...markdownPostFields],
            hooks: {
              ...collection.hooks,
              beforeChange: [...(collection.hooks?.beforeChange ?? []), syncContentFromMarkdown],
            },
          }
        : collection,
    ),
  })
