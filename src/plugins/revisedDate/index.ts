import type { Field, Plugin } from 'payload'

/**
 * 記事の「更新日」プラグイン。
 *
 * 指定したコレクションに revisedAt（date）を追加する。updatedAt はタグ直しなどの
 * 細かい保存でも動くので、読者に見せる「内容を更新した日」はこちらで別に持つ。
 * 値は Markdown の frontmatter `updated:`（管理画面のインポート / /api/ai/posts）から入る。
 * 記事ページは revisedAt を優先し、空なら従来どおり updatedAt を出す（`displayedUpdate`）。
 */

export interface RevisedDatePluginOptions {
  /** Collection slugs that get the revisedAt field */
  collections: string[]
}

export const revisedDateFields: Field[] = [
  {
    name: 'revisedAt',
    type: 'date',
    label: '更新日',
    admin: {
      position: 'sidebar',
      description: '記事の内容を更新した日。記事ページ冒頭の「Updated」に表示されます（空なら、公開日と別の日に保存されたときだけ自動の更新日時）。Markdown の frontmatter `updated:` から入ります。',
      date: {
        pickerAppearance: 'dayOnly',
        displayFormat: 'yyyy/MM/dd',
      },
    },
  },
]

export const revisedDatePlugin =
  (options: RevisedDatePluginOptions): Plugin =>
  (config) => ({
    ...config,
    collections: (config.collections ?? []).map((collection) =>
      options.collections.includes(collection.slug)
        ? { ...collection, fields: [...collection.fields, ...revisedDateFields] }
        : collection,
    ),
  })

/** JST の暦日（YYYY-MM-DD） */
const jstDay = (value: string) =>
  new Date(value).toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })

/**
 * 記事ページの冒頭に出す更新日（Updated）。revisedAt があればそれ（日付のみ）を必ず返す。
 * なければ updatedAt（日時）を、公開日より後の「別の日（JST）」のときだけ返す。
 * 公開当日の保存（下書き → 公開の直後の保存やタグ修正など）では出さない。
 */
export function displayedUpdate(post: {
  revisedAt?: string | null
  updatedAt?: string | null
  publishedAt?: string | null
}): { value: string; dateOnly: boolean } | null {
  if (post.revisedAt) return { value: post.revisedAt, dateOnly: true }
  if (
    post.updatedAt &&
    post.publishedAt &&
    new Date(post.updatedAt).getTime() > new Date(post.publishedAt).getTime() &&
    jstDay(post.updatedAt) !== jstDay(post.publishedAt)
  ) {
    return { value: post.updatedAt, dateOnly: false }
  }
  return null
}
