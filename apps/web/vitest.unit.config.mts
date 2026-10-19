import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Unit tests that need no database (the integration tests in tests/int do).
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { environment: 'jsdom', include: ['tests/unit/**/*.test.ts'], testTimeout: 30000 },
})
