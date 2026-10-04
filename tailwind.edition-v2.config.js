/** @type {import('tailwindcss').Config} */
// Tailwind config for Concept 03 v2, X / Edition "The Proof" (src/concepts/edition-v2/edition.css loads it
// with @config). Separate from the other configs so each page's utilities stay out of the others'
// stylesheets. Colour names resolve to CSS variables (RGB channels) so `data-band` can re-scope them.
// Never hardcode a hex in a component.
const pf = (name) => `rgb(var(--pf-${name}) / <alpha-value>)`

export default {
  content: ['./concepts/edition-v2/**/*.html', './src/concepts/edition-v2/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pf: {
          bg: pf('bg'),
          bg2: pf('bg2'),
          text: pf('text'),
          ink: pf('ink'),
          mute: pf('mute'),
          rule: pf('rule'),
          mark: pf('mark'),
          onmark: pf('on-mark'),
        },
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Schibsted Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: { page: '1320px' },
      transitionTimingFunction: { pf: 'var(--pf-ease)' },
    },
  },
  plugins: [],
}
