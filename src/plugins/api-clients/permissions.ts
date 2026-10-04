/**
 * 外部AI連携（api-clients）の権限マトリクス定義と判定ロジック。
 *
 * - API キーで認証してきたリクエストは req.user.collection === 'api-clients' になる。
 * - API クライアントが触れるのは MANAGED_COLLECTIONS に載っているコレクションだけ。
 *   載っていないもの（users / passkeys / api-clients 自身 / api-logs / Payload 内部）は常に拒否。
 * - 各コレクションの 閲覧 / 作成 / 編集 / 削除（/ 公開）は管理画面のチェックボックスで個別に許可する。
 *   既定はすべて OFF（明示的に許可したものだけ通る）。
 */

export const API_CLIENTS_SLUG = 'api-clients'

export const OPERATIONS = ['read', 'create', 'update', 'delete', 'publish'] as const
export type Operation = (typeof OPERATIONS)[number]

export const OPERATION_LABELS: Record<Operation, string> = {
  read: '閲覧',
  create: '作成',
  update: '編集',
  delete: '削除',
  publish: '公開',
}

interface ManagedCollection {
  slug: string
  /** DB カラム名になるので camelCase */
  key: string
  label: string
  /** 下書き機能（_status）があるコレクションだけ「公開」権限を持つ */
  drafts?: boolean
}

/** 権限を割り当てられるコレクション */
export const MANAGED_COLLECTIONS: readonly ManagedCollection[] = [
  { slug: 'posts', key: 'posts', label: 'General Posts', drafts: true },
  { slug: 'tech-posts', key: 'techPosts', label: 'Tech Posts', drafts: true },
  { slug: 'hosted-pages', key: 'hostedPages', label: 'HTMLホスティング' },
  { slug: 'html-files', key: 'htmlFiles', label: '埋め込みHTMLファイル' },
  { slug: 'media', key: 'media', label: 'Media' },
  { slug: 'categories', key: 'categories', label: 'Categories' },
  { slug: 'changelog', key: 'changelog', label: 'Changelog' },
  { slug: 'whats-new', key: 'whatsNew', label: "What's New" },
]

/** そのコレクションで設定できる操作（公開は下書き機能があるものだけ） */
export function operationsFor(collection: ManagedCollection): Operation[] {
  return OPERATIONS.filter((op) => op !== 'publish' || collection.drafts === true)
}

type PermissionRow = Partial<Record<Operation, boolean | null>>

export interface ApiClientUser {
  id?: number | string
  collection: typeof API_CLIENTS_SLUG
  name?: string | null
  enabled?: boolean | null
  permissions?: Partial<Record<string, PermissionRow | null>> | null
}

export function isApiClient(user: unknown): user is ApiClientUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    (user as { collection?: unknown }).collection === API_CLIENTS_SLUG
  )
}

/** 管理画面にログインする人間のユーザー（users コレクション）か */
export function isHumanUser(user: unknown): user is { collection: 'users' } {
  return (
    typeof user === 'object' &&
    user !== null &&
    (user as { collection?: unknown }).collection === 'users'
  )
}

/** API クライアントが、指定コレクションの指定操作を許可されているか */
export function hasApiClientPermission(
  user: ApiClientUser,
  collectionSlug: string,
  operation: Operation,
): boolean {
  if (user.enabled === false) return false
  const managed = MANAGED_COLLECTIONS.find((c) => c.slug === collectionSlug)
  if (!managed) return false
  if (!operationsFor(managed).includes(operation)) return false
  return user.permissions?.[managed.key]?.[operation] === true
}

/**
 * カスタムエンドポイント用の判定。人間のユーザーは常に可、API クライアントは
 * 権限マトリクスに従う。未ログインは不可。
 */
export function canAccess(user: unknown, collectionSlug: string, operation: Operation): boolean {
  if (isHumanUser(user)) return true
  if (isApiClient(user)) return hasApiClientPermission(user, collectionSlug, operation)
  return false
}

/** ログイン済みで、かつ（API クライアントなら）有効化されているか */
export function isActiveUser(user: unknown): boolean {
  if (isHumanUser(user)) return true
  if (isApiClient(user)) return user.enabled !== false
  return false
}

/** 一覧表示用の要約: "General Posts: 閲覧・作成・編集 / Media: 作成" */
export function summarizePermissions(permissions: ApiClientUser['permissions']): string {
  const parts: string[] = []
  for (const c of MANAGED_COLLECTIONS) {
    const row = permissions?.[c.key]
    const ops = operationsFor(c)
      .filter((op) => row?.[op] === true)
      .map((op) => OPERATION_LABELS[op])
    if (ops.length > 0) parts.push(`${c.label}: ${ops.join('・')}`)
  }
  return parts.length > 0 ? parts.join(' / ') : '権限なし'
}
