import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@paddleocr/paddleocr-js/viz': new URL('./paddleocr-js/packages/core/src/viz/index.ts', import.meta.url).pathname,
      '@paddleocr/paddleocr-js': new URL('./paddleocr-js/packages/core/src/index.ts', import.meta.url).pathname,
    },
  },
  worker: { format: 'es' },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
})
