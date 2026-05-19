import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
  },
})
