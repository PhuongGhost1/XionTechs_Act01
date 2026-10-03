/** @type {import('tailwindcss').Config} */
// Tailwind config for Concept 01, X / Command (src/concepts/command/command.css loads it with
// @config). Separate from tailwind.config.js so this page's utilities stay out of the main page's
// stylesheet and the other way round. Colour names resolve to CSS variables (RGB channels) so that
// `data-band="paper"` can re-scope them for the one light section. Never hardcode a hex in a component.
const x = (name) => `rgb(var(--x-${name}) / <alpha-value>)`

export default {
  content: ['./concepts/command/**/*.html', './src/concepts/command/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        x: {
          bg: x('bg'),
          bg2: x('bg2'),
          line: x('line'),
          text: x('text'),
          mute: x('mute'),
          faint: x('faint'),
          signal: x('signal'),
          ink: x('ink'),
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: { page: '1320px' },
      transitionTimingFunction: { x: 'var(--x-ease)' },
    },
  },
  plugins: [],
}
