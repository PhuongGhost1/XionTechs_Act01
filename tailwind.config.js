/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}', '!./src/concepts/**'],
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
        danger: token('danger'),
        success: token('success'),
      },
      transitionTimingFunction: {
        brand: 'var(--ease-brand)',
        spring: 'var(--ease-spring)',
      },
      transitionDuration: {
        micro: 'var(--dur-micro)',
        base: 'var(--dur-base)',
        section: 'var(--dur-section)',
      },
      boxShadow: {
        // Layered, restrained depth (MOTION §2): near, lifted, floating.
        'depth-1': '0 1px 2px rgb(16 24 38 / 0.06), 0 2px 6px rgb(16 24 38 / 0.05)',
        'depth-2': '0 2px 4px rgb(16 24 38 / 0.06), 0 10px 24px -6px rgb(16 24 38 / 0.14)',
        'depth-3': '0 4px 8px rgb(16 24 38 / 0.08), 0 28px 56px -16px rgb(16 24 38 / 0.32)',
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
