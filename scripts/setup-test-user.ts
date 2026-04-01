/**
 * One-time setup script: creates the integration test admin user.
 *
 * Run this ONCE before running `pnpm test:integration`:
 *   pnpm test:setup
 *
 * Prerequisites:
 *   1. Copy .env.test.example → .env.test and set TEST_ADMIN_PASSWORD
 *   2. DATABASE_URL must be set in .env.local (local DB or Neon)
 *   3. Dev server does NOT need to be running (this uses the Local API directly)
 */

import 'dotenv/config'
import { config } from 'dotenv'
import path from 'path'

// Load .env.local first (DB connection string), then .env.test (test password)
config({ path: path.resolve(process.cwd(), '.env.local') })
config({ path: path.resolve(process.cwd(), '.env.test'), override: false })

const TEST_EMAIL = 'indexlove0815@icloud.com'

async function main() {
  const password = process.env.TEST_ADMIN_PASSWORD
  if (!password) {
    console.error('❌  TEST_ADMIN_PASSWORD is not set.')
    console.error('    Copy .env.test.example → .env.test and fill in the value.')
    process.exit(1)
  }

  // Dynamic import after env is loaded
  const { getPayload } = await import('payload')
  const { default: configPromise } = await import('../src/payload.config')

  const payload = await getPayload({ config: configPromise })

  // Check if the test user already exists
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: TEST_EMAIL } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    console.log(`✓ Test user already exists: ${TEST_EMAIL}`)
    process.exit(0)
  }

  // Create the user with admin-level override
  await payload.create({
    collection: 'users',
    data: {
      email: TEST_EMAIL,
      password,
    },
    overrideAccess: true,
  })

  console.log(`✓ Test user created: ${TEST_EMAIL}`)
  console.log('  You can now run: pnpm test:integration')
  process.exit(0)
}

main().catch(err => {
  console.error('❌  Setup failed:', err)
  process.exit(1)
})
