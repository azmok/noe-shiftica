import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    // Only pick up our own unit tests — exclude integration tests and node_modules
    include: ['src/__tests__/api/**/*.test.ts', 'src/__tests__/lib/**/*.test.ts'],
    exclude: ['src/__tests__/integration/**', 'node_modules/**', '.next/**'],
  },
})
