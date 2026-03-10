import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/*/src/**/*.test.ts',
      'apps/web/src/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@organizeme/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@': path.resolve(__dirname, 'apps/web/src'),
    },
  },
})
