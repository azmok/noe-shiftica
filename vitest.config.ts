import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: [
      // Shared unit tests (lib, api routes)
      'tests/unit/**/*.test.ts',
      // Plugin-specific unit tests (mock-based, no live APIs)
      'src/plugins/**/__tests__/unit.test.ts',
    ],
    exclude: [
      // Live API tests are excluded from the default run
      'src/plugins/**/__tests__/live-api.test.ts',
      'tests/integration/**',
      'node_modules/**',
      '.next/**',
    ],
  },
})
