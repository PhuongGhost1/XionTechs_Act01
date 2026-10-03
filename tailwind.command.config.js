/** @type {import('tailwindcss').Config} */
// Tailwind config for Concept 01, X / Command (src/concepts/command/command.css loads it with
// @config). It is separate from tailwind.config.js so the concept's utilities do not end up in
// the main page's stylesheet, and the main page's do not end up in the concept's.
const cmd = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./concepts/command/**/*.html', './src/concepts/command/**/*.{js,jsx}'],
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
