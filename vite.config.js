import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const here = (path) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    // The landing page plus one self-contained page per design concept (docs/idea/0n-*.md).
    // Concepts live at /concepts/<name>/ and do not touch the main page's bundle.
    rollupOptions: {
      input: {
        main: here('index.html'),
        command: here('concepts/command/index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
