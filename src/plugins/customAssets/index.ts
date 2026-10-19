import type { Field, Plugin } from 'payload'

/**
 * 記事ごとのカスタム CSS / JS プラグイン。
 *
 * 指定したコレクションに customCss / customJs（textarea）を追加する。
 * 表示側は ArticleCustomAssets（記事ページで使う）が、CSS を記事ルートに @scope で
 * 閉じ込めて適用し、JS を記事の描画が落ち着いてから実行する。
 * 値は Markdown インポート（.css / .js を同時にアップロード）や /api/ai/posts から入る。
 */

export interface CustomAssetsPluginOptions {
  /** Collection slugs that get the customCss / customJs fields */
  collections: string[]
}

export const customAssetsFields: Field[] = [
  {
    name: 'customCss',
    type: 'textarea',
    label: 'カスタムCSS',
    admin: {
      description: 'この記事のレンダリング結果全体に適用されるCSS。記事ルートの範囲だけに自動スコープされ、他の記事やサイト共通UIには漏れません。',
    },
  },
  {
    name: 'customJs',
    type: 'textarea',
    label: 'カスタムJS',
    admin: {
      description: 'この記事のページに読み込まれるJS。記事内だけに存在するクラス名/IDを対象にしてください。',
    },
  },
]

export const customAssetsPlugin =
  (options: CustomAssetsPluginOptions): Plugin =>
  (config) => ({
    ...config,
    collections: (config.collections ?? []).map((collection) =>
      options.collections.includes(collection.slug)
        ? { ...collection, fields: [...collection.fields, ...customAssetsFields] }
        : collection,
    ),
  })
