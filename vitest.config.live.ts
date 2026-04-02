import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import dotenv from 'dotenv'
import path from 'path'

/**
 * Live API test config — calls real external services (Gemini AI).
 *
 * Prerequisites:
 *   1. Set GEMINI_API_KEY in .env.local
 *   2. (For server-integration suite) Start the dev server: pnpm dev:test
 *   3. (For server-integration suite) Set TEST_ADMIN_PASSWORD in .env.test
 *
 * If GEMINI_API_KEY is not set, all tests are automatically skipped via
 * describe.runIf(process.env.GEMINI_API_KEY).
 *
 * Run with:
 *   pnpm test:live
 */

// Load env files in the main process so workers inherit the values
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/plugins/**/__tests__/live-api.test.ts'],
    // Extended timeout: real LLM calls can take 20-30 seconds
    testTimeout: 60_000,
    hookTimeout: 30_000,
  },
})
