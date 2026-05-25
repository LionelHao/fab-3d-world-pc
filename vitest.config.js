import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.{test,spec}.{js,mjs}'],
      exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/stores/**', 'src/utils/**', 'src/router/**', 'src/service/**'],
        exclude: [
          'src/main.js',
          'src/mocks/**',
          'src/locales/**',
          'src/**/*.d.ts',
          'src/**/*.spec.js',
          'src/**/*.test.js',
        ],
      },
    },
  })
)
