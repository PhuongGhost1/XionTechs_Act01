/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101826',
        paper: '#f8f9fb',
        // Sampled directly from public/XionTechs-Logo_s.png (the navy in the wordmark) —
        // used for buttons, links, and icon accents.
        accent: '#183860',
        accentHover: '#122c4c',
        accentSoft: '#e5ebf3',
        // Deeper near-black navy (same hue family, darkened) for full-bleed dark sections.
        navy: '#0a1a2e',
        line: '#e2e5eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      },
    },
  },
  plugins: [],
}
