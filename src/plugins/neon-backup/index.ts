import type { Config, Plugin, CollectionAfterChangeHook } from 'payload'

/** 記事保存時のバックアップ。名前は `backup/on-save-YYYYMMDD-HHmmss`（JST） */
export const ON_SAVE_PREFIX = 'backup/on-save'
/** 残す世代数 */
export const KEEP_GENERATIONS = 2
/** 保存時バックアップの最短間隔（直近の世代がこれより新しければ作らない） */
export const MIN_INTERVAL_MS = 30 * 60 * 1000

export interface NeonBranch {
  id: string
  name: string
  created_at: string
  primary?: boolean
}

/** prefix の世代に属するか（`prefix` そのもの＝旧形式の名前も含む） */
export function isGeneration(name: string, prefix: string): boolean {
  return name === prefix || name.startsWith(`${prefix}-`)
}

/** prefix の世代を新しい順に返す */
export function generationsOf(branches: NeonBranch[], prefix: string): NeonBranch[] {
  return branches
    .filter((b) => isGeneration(b.name, prefix))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
}

/** 直近の世代が minIntervalMs 以内に作られていれば true（今回は作らない） */
export function isTooSoon(branches: NeonBranch[], prefix: string, now: number, minIntervalMs: number): boolean {
  const latest = generationsOf(branches, prefix)[0]
  return latest !== undefined && now - Date.parse(latest.created_at) < minIntervalMs
}

/** 新しい順に keep 世代を残し、それより古い世代を返す */
export function generationsToDelete(branches: NeonBranch[], prefix: string, keep: number): NeonBranch[] {
  return generationsOf(branches, prefix).slice(keep)
}

/** `backup/on-save-20261018-213214` のような JST タイムスタンプ付きの名前 */
export function generationName(prefix: string, now: Date): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString()
  return `${prefix}-${jst.slice(0, 10).replace(/-/g, '')}-${jst.slice(11, 19).replace(/:/g, '')}`
}

/**
 * 本番（primary）ブランチから新しい世代を作り、作成に成功したときだけ古い世代を消す。
 * 直近の世代が MIN_INTERVAL_MS 以内なら何もしない。
 */
export async function triggerNeonBackup(now: Date = new Date()): Promise<void> {
  const apiToken = process.env.NEON_API_TOKEN
  const projectId = process.env.NEON_PROJECT_ID

  if (!apiToken || !projectId) {
    console.warn('[neon-backup] NEON_API_TOKEN or NEON_PROJECT_ID not set. Skipping backup.')
    return
  }

  const baseUrl = `https://console.neon.tech/api/v2/projects/${projectId}/branches`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  }

  // 1. Get all branches
  const branchesRes = await fetch(baseUrl, { headers })
  const branchesData = await branchesRes.json()

  if (!Array.isArray(branchesData.branches)) {
    console.error('[neon-backup] Failed to fetch branches:', branchesData)
    return
  }
  const branches: NeonBranch[] = branchesData.branches

  const primaryBranch = branches.find((b) => b.primary === true)
  if (!primaryBranch) {
    console.error('[neon-backup] Could not find primary (production) branch.')
    return
  }

  if (isTooSoon(branches, ON_SAVE_PREFIX, now.getTime(), MIN_INTERVAL_MS)) {
    console.log('[neon-backup] Latest on-save backup is less than 30 minutes old. Skipping.')
    return
  }

  // 2. Create the new generation from production (primary) branch
  const name = generationName(ON_SAVE_PREFIX, now)
  const createRes = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ branch: { name, parent_id: primaryBranch.id } }),
  })
  const createData = await createRes.json()

  if (!createData.branch) {
    // Keep the old generations untouched when the new one could not be created
    console.error('[neon-backup] Failed to create backup branch:', createData)
    return
  }
  console.log(`[neon-backup] Backup branch created: ${name} (${createData.branch.id}, parent: ${primaryBranch.id})`)

  // 3. Delete generations older than the newest KEEP_GENERATIONS (including the one just created)
  const stale = generationsToDelete([...branches, createData.branch], ON_SAVE_PREFIX, KEEP_GENERATIONS)
  for (const branch of stale) {
    const deleteRes = await fetch(`${baseUrl}/${branch.id}`, { method: 'DELETE', headers })
    if (deleteRes.ok) {
      console.log(`[neon-backup] Deleted old backup branch: ${branch.name} (${branch.id})`)
    } else {
      console.error(`[neon-backup] Failed to delete old backup branch ${branch.name}:`, await deleteRes.text())
    }
  }
}

export interface NeonBackupPluginOptions {
  /** Collection slugs to watch for changes */
  collections: string[]
}

export const neonBackupPlugin =
  (options: NeonBackupPluginOptions): Plugin =>
  (incomingConfig: Config): Config => {
    const { collections } = options

    return {
      ...incomingConfig,
      collections: (incomingConfig.collections ?? []).map((col) => {
        if (!collections.includes(col.slug)) return col

        const existingHooks = col.hooks ?? {}
        const existingAfterChange = existingHooks.afterChange ?? []

        const afterChangeHook: CollectionAfterChangeHook = async ({ doc, operation }) => {
          if (operation === 'create' || operation === 'update') {
            // Fire-and-forget: do not block the save operation
            triggerNeonBackup().catch((err) => {
              console.error('[neon-backup] Async backup error:', err)
            })
          }
          return doc
        }

        return {
          ...col,
          hooks: {
            ...existingHooks,
            afterChange: [...existingAfterChange, afterChangeHook],
          },
        }
      }),
    }
  }
