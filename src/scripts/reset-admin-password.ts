import 'dotenv/config'
import path from 'path'
import { config } from 'dotenv'

/**
 * Payload Admin Password Reset Script (Local API)
 * 
 * 使い方:
 * 1. 下記の TARGET_EMAIL と NEW_PASSWORD を書き換える。
 * 2. コンソールで実行: npx tsx src/scripts/reset-admin-password.ts
 */

async function main() {
  // --- ここを書き換える ---
  const TARGET_EMAIL = 'indexlove0815@icloud.com' // リセットしたい管理者のメール
  const NEW_PASSWORD = 'jamuojisann00'      // 新しいパスワード
  // ---------------------

  if (TARGET_EMAIL === 'indexlove0815@icloud.com' || NEW_PASSWORD === 'jamuojisann00') {
    console.warn('⚠️  デフォルト設定のままです。必要に応じて src/scripts/reset-admin-password.ts を編集してください。')
  }

  // Payloadを環境変数込みで動かすための動的インポート
  const { getPayload } = await import('payload')
  const { default: configPromise } = await import('../payload.config')

  console.log('🚀 Initializing Payload...')
  const payload = await getPayload({ config: configPromise })

  console.log(`🔍 Searching for user: ${TARGET_EMAIL}...`)

  const result = await payload.find({
    collection: 'users',
    where: {
      email: { equals: TARGET_EMAIL },
    },
    overrideAccess: true,
  })

  if (result.docs.length === 0) {
    console.error(`❌ User not found with email: ${TARGET_EMAIL}`)
    process.exit(1)
  }

  const user = result.docs[0]

  console.log(`🔓 Updating password for: ${TARGET_EMAIL} (ID: ${user.id})...`)

  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password: NEW_PASSWORD,
        // Optional: Ensure account is not locked
        loginAttempts: 0,
        lockUntil: null,
      } as any,
      overrideAccess: true,
    })

    console.log('✅ Password successfully updated!')
    console.log('--------------------------------------------------')
    console.log(`User: ${TARGET_EMAIL}`)
    console.log(`Pass: ${NEW_PASSWORD}`)
    console.log('--------------------------------------------------')
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to update password:', error)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('❌ Script failed:', err)
  process.exit(1)
})
