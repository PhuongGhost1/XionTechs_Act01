import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const here = (path) => fileURLToPath(new URL(path, import.meta.url))

// Real build number for the concept pages: the git commit count at build time (0 outside a repo).
let buildNumber = 0
try {
  buildNumber = Number(execSync('git rev-list --count HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) || 0
} catch {
  /* not a git checkout */
}

export default defineConfig({
  plugins: [react()],
  define: { __BUILD_NUMBER__: JSON.stringify(buildNumber) },
  build: {
    // The landing page plus one self-contained page per design concept (docs/idea/0n-*.md).
    // Concepts live at /concepts/<name>/ and do not touch the main page's bundle.
    rollupOptions: {
      input: {
        main: here('index.html'),
        command: here('concepts/command/index.html'),
        architecture: here('concepts/architecture/index.html'),
        editionV2: here('concepts/edition-v2/index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
