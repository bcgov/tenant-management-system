import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import { config } from '@vue/test-utils'

import { i18n } from './src/i18n'
import viteConfig from './vite.config'

config.global.plugins.push(i18n)

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
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
