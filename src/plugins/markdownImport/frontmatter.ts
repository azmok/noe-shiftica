/**
 * frontmatter → 記事フィールドの対応（管理画面の Markdown インポートと /api/ai/posts で共有）。
 *
 * - title / slug / description / date(publishedAt) / content は専用フィールドに入る
 * - updated は revisedAt（revisedDate プラグイン）に入る
 * - それ以外のキーはすべて customMetaData（og_title / seo_title など）に入る
 */

export const KNOWN_FRONTMATTER_FIELDS = ['title', 'slug', 'publishedAt', 'content', 'description', 'date', 'updated']

/** customMetaData に入れるキーだけを取り出す */
export function extractCustomMetaData(frontmatter: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!KNOWN_FRONTMATTER_FIELDS.includes(key)) out[key] = value
  }
  return out
}

/**
 * 既存の customMetaData に frontmatter 由来の値を重ねる。
 * 書いていないキーは残し、値が null のキーは削除する（`og_title: null` / `og_title: ~`）。
 */
export function mergeCustomMetaData(
  existing: unknown,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing) ? { ...(existing as Record<string, unknown>) } : {}
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null) delete base[key]
    else base[key] = value
  }
  return base
}

/**
 * frontmatter の `updated` を revisedAt 用の ISO 文字列にする。
 * キーが無ければ undefined（触らない）、null なら null（消す）、日付として読めなければ undefined。
 */
export function revisedAtFromFrontmatter(frontmatter: Record<string, unknown>): string | null | undefined {
  if (!('updated' in frontmatter)) return undefined
  const value = frontmatter.updated
  if (value === null) return null
  if (!(value instanceof Date) && typeof value !== 'string') return undefined
  const date = value instanceof Date ? value : new Date(value)
  return isNaN(date.getTime()) ? undefined : date.toISOString()
}
