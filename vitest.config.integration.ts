import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Integration test config — targets a RUNNING dev/preview server.
 *
 * Prerequisites:
 *   1. Copy .env.test.example → .env.test and fill in TEST_ADMIN_PASSWORD
 *   2. Run the test-user setup script once:
 *        pnpm test:setup
 *   3. Start the dev server in a separate terminal:
 *        pnpm dev
 *   4. Run integration tests:
 *        pnpm test:integration
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/integration/**/*.test.ts'],
    // Load .env.test for TEST_ADMIN_PASSWORD etc.
    setupFiles: ['src/__tests__/integration/setup.ts'],
    // Integration tests hit real network — give them room
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Run sequentially: tests share DB state, concurrent runs would corrupt data
    sequence: { concurrent: false },
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
