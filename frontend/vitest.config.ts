import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        exclude: ['src/__tests__/**'],
        include: ['src/**/*.{ts,vue}'],
        provider: 'v8',
        reporter: ['html', 'lcov', 'text'],
        reportsDirectory: './coverage',
      },
      css: true,
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
      setupFiles: ['./vitest.setup.ts'],
    },
  }),
)
