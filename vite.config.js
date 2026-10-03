import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const here = (path) => fileURLToPath(new URL(path, import.meta.url))

// Short commit hash for the concept page's build stamp. A checkout without git (or a tarball
// build) must still build, so any failure falls back to "dev".
const gitSha = () => {
  try {
    const out = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    return out.toString().trim() || 'dev'
  } catch {
    return 'dev'
  }
}

export default defineConfig({
  plugins: [react()],
  // Build-time constants for src/concepts/command (read through runtime/build.js, never directly).
  // Global declarations, mirrored in eslint.config.js:
  //   declare const __BUILD_SHA__: string   // short commit hash, or "dev"
  //   declare const __BUILD_DATE__: string  // ISO date yyyy-mm-dd of the build
  define: {
    __BUILD_SHA__: JSON.stringify(gitSha()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
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
