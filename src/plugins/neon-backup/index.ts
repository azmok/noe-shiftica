import type { Config, Plugin, CollectionAfterChangeHook } from 'payload'

const BACKUP_BRANCH_NAME = 'backup/pre-deploy'

async function triggerNeonBackup(): Promise<void> {
  const apiToken = process.env.NEON_API_TOKEN
  const projectId = process.env.NEON_PROJECT_ID

  if (!apiToken || !projectId) {
    console.warn('[neon-backup] NEON_API_TOKEN or NEON_PROJECT_ID not set. Skipping backup.')
    return
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  }

  // 1. Get all branches
  const branchesRes = await fetch(
    `https://console.neon.tech/api/v2/projects/${projectId}/branches`,
    { headers },
  )
  const branchesData = await branchesRes.json()

  if (!Array.isArray(branchesData.branches)) {
    console.error('[neon-backup] Failed to fetch branches:', branchesData)
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryBranch = branchesData.branches.find((b: any) => b.primary === true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const backupBranch = branchesData.branches.find((b: any) => b.name === BACKUP_BRANCH_NAME)

  if (!primaryBranch) {
    console.error('[neon-backup] Could not find primary (production) branch.')
    return
  }

  // 2. Delete existing backup branch if it exists
  if (backupBranch) {
    const deleteRes = await fetch(
      `https://console.neon.tech/api/v2/projects/${projectId}/branches/${backupBranch.id}`,
      { method: 'DELETE', headers },
    )
    if (!deleteRes.ok) {
      console.error('[neon-backup] Failed to delete old backup branch:', await deleteRes.text())
      return
    }
    // Wait for deletion to complete before creating a new branch
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  // 3. Create new backup branch from production (primary) branch
  const createRes = await fetch(
    `https://console.neon.tech/api/v2/projects/${projectId}/branches`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        branch: {
          name: BACKUP_BRANCH_NAME,
          parent_id: primaryBranch.id,
        },
      }),
    },
  )
  const createData = await createRes.json()

  if (createData.branch) {
    console.log(`[neon-backup] Backup branch created: ${createData.branch.id} (parent: ${primaryBranch.id})`)
  } else {
    console.error('[neon-backup] Failed to create backup branch:', createData)
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
