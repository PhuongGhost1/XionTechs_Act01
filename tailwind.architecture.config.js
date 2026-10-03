/** @type {import('tailwindcss').Config} */
// Tailwind config for Concept 02, X / Architecture (src/concepts/architecture/architecture.css loads it
// with @config). Separate from the main and the Command configs so each page's utilities stay out of the
// others' stylesheets. Colour names resolve to CSS variables (RGB channels) so `data-band="navy"` can
// re-scope them for the dark sheets. Never hardcode a hex in a component.
const bp = (name) => `rgb(var(--bp-${name}) / <alpha-value>)`

export default {
  content: ['./concepts/architecture/**/*.html', './src/concepts/architecture/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bp: {
          bg: bp('bg'),
          bg2: bp('bg2'),
          rule: bp('rule'),
          text: bp('text'),
          mute: bp('mute'),
          line: bp('line'),
          signal: bp('signal'),
          onsignal: bp('on-signal'),
        },
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: { page: '1400px' },
      transitionTimingFunction: { bp: 'var(--bp-ease)' },
    },
  },
  plugins: [],
}
