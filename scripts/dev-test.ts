/**
 * Starts the Next.js dev server pointed at the Neon test/integration branch.
 *
 * Usage:
 *   pnpm dev:test
 *
 * Prerequisites:
 *   1. .env.test must contain TEST_DATABASE_URL (Neon test/integration branch)
 *   2. Run `pnpm test:setup` once to create the test user on the test branch
 */

import { config } from 'dotenv'
import path from 'path'
import { spawn } from 'child_process'

config({ path: path.resolve(process.cwd(), '.env.local') })
config({ path: path.resolve(process.cwd(), '.env.test') })

const testDbUrl = process.env.TEST_DATABASE_URL
if (!testDbUrl) {
  console.error('❌  TEST_DATABASE_URL is not set in .env.test')
  console.error('    Add it and run: pnpm dev:test')
  process.exit(1)
}

const masked = testDbUrl.replace(/:[^:@]+@/, ':***@')
console.log('🧪  Starting dev server with test database...')
console.log(`    DB: ${masked}`)
console.log('')

const child = spawn(
  'pnpm',
  ['exec', 'next', 'dev', '--hostname', '0.0.0.0', '-p', '3000'],
  {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

child.on('close', (code) => process.exit(code ?? 0))
