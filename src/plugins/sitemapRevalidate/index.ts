import type { Plugin, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

/**
 * sitemapRevalidatePlugin
 *
 * サイトマップ（`src/app/sitemap.ts`）は Next.js の動的ルートだが、Firebase App Hosting /
 * Next.js のフルルートキャッシュにより `/sitemap.xml` はキャッシュされ得る。
 * 対象コレクション（記事系）が作成・更新・削除されると URL 集合や lastmod が変化するため、
 * その都度 `/sitemap.xml` のキャッシュを破棄して新しいサイトマップへ反映させる。
 *
 * 既存のコレクション個別フック（/blog・/dev 等の revalidate）には手を入れず、
 * このプラグインがサイトマップ用のフックを「追記」する。プラグインを外せばこの挙動だけが消える。
 */

const SITEMAP_PATH = '/sitemap.xml'

async function revalidateSitemap(context: string): Promise<void> {
  // 1. ローカル（同一プロセス / 開発環境）のキャッシュ破棄
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath(SITEMAP_PATH)
  } catch (err) {
    console.warn(
      `[sitemapRevalidate:${context}] local revalidation skipped: ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }

  // 2. 本番環境（App Hosting）への明示的な Webhook によるキャッシュ破棄
  //    （ローカルで記事を編集した場合でも本番のサイトマップを更新するため）
  try {
    const secret = process.env.REVALIDATE_SECRET
    if (secret) {
      const res = await fetch('https://noe-shiftica.com/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, collection: 'sitemap' }),
      })
      console.log(`[sitemapRevalidate:${context}] webhook status: ${res.status}`)
    } else {
      console.warn(`[sitemapRevalidate:${context}] REVALIDATE_SECRET is not set`)
    }
  } catch (e) {
    console.error(`[sitemapRevalidate:${context}] webhook error:`, e)
  }
}

const afterChange: CollectionAfterChangeHook = async ({ doc, operation }) => {
  if (operation === 'create' || operation === 'update') {
    await revalidateSitemap('afterChange')
  }
  return doc
}

const afterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await revalidateSitemap('afterDelete')
  return doc
}

export const sitemapRevalidatePlugin = (options?: { collections?: string[] }): Plugin => {
  // サイトマップに含まれる動的ルートを持つコレクションのみを対象にする。
  const targetCollections = options?.collections || ['posts', 'tech-posts', 'whats-new']

  return (config) => {
    config.collections = (config.collections || []).map((collection) => {
      if (targetCollections.includes(collection.slug)) {
        collection.hooks = collection.hooks || {}
        collection.hooks.afterChange = [
          ...(collection.hooks.afterChange || []),
          afterChange,
        ]
        collection.hooks.afterDelete = [
          ...(collection.hooks.afterDelete || []),
          afterDelete,
        ]
      }
      return collection
    })

    return config
  }
}
