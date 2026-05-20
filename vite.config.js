import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tokens': path.resolve(__dirname, '../packages/design-tokens')
    }
  },
  server: {
    host: 'localhost',
    port: 8090,
    fs: {
      allow: ['..']
    }
  }
})
