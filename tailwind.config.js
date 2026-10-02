/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // All values resolve to CSS variables in src/index.css. A `data-tone="dark"` ancestor
        // swaps them for the dark palette, so the same class names work in both tones.
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
