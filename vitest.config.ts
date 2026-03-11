import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/*/src/**/*.test.ts',
      'packages/*/src/**/*.test.tsx',
      'apps/web/src/**/*.test.ts',
      'apps/web/src/**/*.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'packages/shared/src/**/*.ts',
        'apps/web/src/lib/**/*.ts',
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/types/**',
        '**/context/**',
        '**/hooks/use-pagination.ts',
        '**/hooks/use-archive.ts',
        '**/hooks/use-favorites.ts',
        '**/hooks/use-dashboard-settings.ts',
        '**/hooks/use-status-filters.ts',
        'apps/web/src/lib/actions.ts',
        'apps/web/src/lib/web-data-provider.ts',
        'packages/shared/src/lib/utils.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@organizeme/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@': path.resolve(__dirname, 'apps/web/src'),
    },
  },
})
