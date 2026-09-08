import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const repoName = (process.env.GITHUB_REPOSITORY ?? 'ielts-mock-test-platform').split('/').pop()
const base = process.env.GITHUB_PAGES === 'true' ? `/${repoName}/` : '/'

/** GitHub Pages has no SPA rewrite, so unknown paths fall back to 404.html. */
function spaFallback(): Plugin {
  return {
    name: 'spa-github-pages-fallback',
    writeBundle() {
      const dist = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')
      copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
