import type { Access, CollectionConfig, GlobalConfig, Plugin } from 'payload'
import { ApiClientsCollection } from './collection'
import { type Operation, hasApiClientPermission, isApiClient } from './permissions'

/**
 * 外部AI連携プラグイン。
 *
 * 1. api-clients コレクション（API キー専用の認証コレクション）を登録する。
 * 2. 全コレクション・全グローバルの access をラップし、API クライアントからの
 *    リクエストだけ権限マトリクスで絞る。人間のユーザー・未ログインの挙動は一切変えない。
 *
 * 他プラグインが追加したコレクションも対象にするため、plugins 配列の最後に置くこと。
 */

type CollectionAccessKey = keyof NonNullable<CollectionConfig['access']>

/** コレクションの access キー → 権限マトリクスの操作。null は API クライアントには常に拒否。 */
const COLLECTION_ACCESS_MAP: Partial<Record<CollectionAccessKey, Operation | null>> = {
  read: 'read',
  readVersions: 'read',
  create: 'create',
  update: 'update',
  delete: 'delete',
  unlock: null,
}

// Payload の既定 access と同じ（ログインしていれば可）
const defaultAccess: Access = ({ req }) => Boolean(req.user)

export function wrapAccess(
  collectionSlug: string,
  operation: Operation | null,
  original: Access | undefined,
): Access {
  return (args) => {
    const user = args.req.user
    if (isApiClient(user)) {
      if (operation === null) return false
      if (!hasApiClientPermission(user, collectionSlug, operation)) return false
      // 公開状態で保存しようとしている場合は「公開」権限も必要（下書き保存だけなら不要）
      const status = (args.data as { _status?: unknown } | undefined)?._status
      if (
        (operation === 'create' || operation === 'update') &&
        status === 'published' &&
        !hasApiClientPermission(user, collectionSlug, 'publish')
      ) {
        return false
      }
    }
    return (original ?? defaultAccess)(args)
  }
}

export function wrapCollection(collection: CollectionConfig): CollectionConfig {
  const access = { ...(collection.access ?? {}) } as Record<string, Access | undefined>
  for (const [key, operation] of Object.entries(COLLECTION_ACCESS_MAP)) {
    access[key] = wrapAccess(collection.slug, operation as Operation | null, access[key])
  }
  return { ...collection, access: access as CollectionConfig['access'] }
}

/** グローバルは権限マトリクスの対象外なので、API クライアントには常に拒否 */
export function wrapGlobal(global: GlobalConfig): GlobalConfig {
  const access = { ...(global.access ?? {}) } as Record<string, Access | undefined>
  for (const key of ['read', 'readVersions', 'readDrafts', 'update']) {
    access[key] = wrapAccess(global.slug, null, access[key])
  }
  return { ...global, access: access as GlobalConfig['access'] }
}

export const apiClientsPlugin = (): Plugin => (config) => {
  const collections = [...(config.collections ?? []), ApiClientsCollection]
  return {
    ...config,
    collections: collections.map(wrapCollection),
    globals: (config.globals ?? []).map(wrapGlobal),
  }
}
