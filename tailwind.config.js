/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // All values resolve to CSS variables defined per data-theme in src/index.css.
        paper: token('bg'),
        surface: token('surface'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        primary: token('primary'),
        primaryHover: token('primary-hover'),
        primarySoft: token('primary-soft'),
        primaryInk: token('primary-ink'),
        accent: token('accent'),
        navy: token('navy'),
        navyInk: token('navy-ink'),
        navyAccent: token('navy-accent'),
        // Temporary aliases so not-yet-rewritten components keep styling. Removed in Task 12.
        accentHover: token('primary-hover'),
        accentSoft: token('primary-soft'),
      },
      // text-primary uses the foreground-safe variant so gold never becomes low-contrast text.
      textColor: { primary: token('primary-fg') },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      },
    },
  },
  plugins: [],
}
