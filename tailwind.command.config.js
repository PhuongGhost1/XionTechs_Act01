/** @type {import('tailwindcss').Config} */
// Tailwind config for the Command design (src/index.css loads it with @config). Command is now
// the homepage (feat/promote-command-to-homepage), so this scans the whole src tree like
// tailwind.config.js used to, excluding the previous design now kept at /concepts/command/.
// Separate from tailwind.config.js so each design's utilities stay out of the other's stylesheet.
const cmd = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}', '!./src/concepts/**'],
  theme: {
    extend: {
      colors: {
        // Semantic names; a `data-band="paper"` ancestor re-scopes them for the one light section.
        cmd: {
          bg: cmd('bg'),
          surface: cmd('surface'),
          raise: cmd('raise'),
          line: cmd('line'),
          text: cmd('text'),
          muted: cmd('muted'),
          faint: cmd('faint'),
          signal: cmd('signal'),
          'signal-fg': cmd('signal-fg'),
          'signal-ink': cmd('signal-ink'),
          ok: cmd('ok'),
          danger: cmd('danger'),
        },
      },
      transitionTimingFunction: {
        cmd: 'var(--cmd-ease)',
      },
      transitionDuration: {
        micro: 'var(--dur-micro)',
        base: 'var(--dur-base)',
        section: 'var(--dur-section)',
      },
      fontFamily: {
        'cmd-display': ['Archivo', 'Inter', 'system-ui', 'sans-serif'],
        'cmd-sans': ['Inter', 'system-ui', 'sans-serif'],
        'cmd-mono': ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
