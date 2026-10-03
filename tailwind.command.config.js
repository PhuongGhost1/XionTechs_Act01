import plugin from 'tailwindcss/plugin'

// Tailwind config for Concept 01 v2 (X / COMMAND). Loaded from src/concepts/command/command.css
// with `@config`. The main tailwind.config.js excludes src/concepts and must not change.
//
// Every colour resolves to a CSS variable defined in styles/tokens.css, so a component never
// carries a hex value. Variables hold space separated RGB channels.

// Solid tokens: the variable is the whole colour, alpha is whatever the class asks for.
const channel = (name) => `rgb(var(--${name}) / <alpha-value>)`

// Structural tokens (hairlines, ghost edges, grid dots) are the ink-2 channels at a fixed alpha.
// The default alpha lives in `--<name>-a`; an explicit modifier (`border-hair/50`) scales it.
// `opacityValue` is `var(--tw-*-opacity)` (1 unless a modifier is given), so the product is right
// in both cases.
const faint = (name) => ({ opacityValue }) =>
  `rgb(var(--${name}) / calc(var(--${name}-a) * ${opacityValue ?? 1}))`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./concepts/command/index.html', './src/concepts/command/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: channel('void'),
        ground: channel('ground'),
        panel: channel('panel'),
        panelHi: channel('panel-hi'),
        ink: channel('ink'),
        ink2: channel('ink-2'),
        ink3: channel('ink-3'),
        inkDim: channel('ink-dim'),
        hair: faint('hair'),
        hairStrong: faint('hair-strong'),
        ghost: faint('ghost'),
        grid: faint('grid'),
        signal: channel('signal'),
        signalWash: faint('signal-wash'),
        onSignal: channel('on-signal'),
      },
      fontFamily: {
        // "Geist Fallback" is a metric matched local() face, declared in styles/fonts.css, so the
        // display type does not shift when the real font arrives.
        display: ['"Geist Variable"', '"Geist Fallback"', 'system-ui', 'sans-serif'],
        body: ['"Geist Variable"', '"Geist Fallback"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', '"Geist Mono Fallback"', 'ui-monospace', 'monospace'],
      },
      // Type scale of doc 5.2. Sizes are CSS variables because two of them change per breakpoint.
      fontSize: {
        'display-xl': ['var(--fs-display-xl)', { lineHeight: '0.9', letterSpacing: '-0.055em' }],
        finale: ['var(--fs-finale)', { lineHeight: '0.88', letterSpacing: '-0.06em' }],
        statement: ['var(--fs-statement)', { lineHeight: '0.98', letterSpacing: '-0.045em' }],
        h2: ['var(--fs-h2)', { lineHeight: '1', letterSpacing: '-0.04em' }],
        row: ['var(--fs-row)', { lineHeight: '1', letterSpacing: '-0.04em' }],
        step: ['var(--fs-step)', { lineHeight: '0.95', letterSpacing: '-0.05em' }],
        body: ['var(--fs-body)', { lineHeight: '1.5' }],
        label: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.06em' }],
        data: ['0.8125rem', { lineHeight: '1.5' }],
        counter: ['0.875rem', { lineHeight: '1', letterSpacing: '0.04em' }],
      },
      maxWidth: {
        content: '100rem',
        measure: '44ch',
      },
      spacing: {
        header: 'var(--header-h)',
        dock: 'var(--dock-h)',
      },
      transitionTimingFunction: {
        brand: 'var(--ease-brand)',
        ui: 'var(--ease-ui)',
        out: 'var(--ease-out)',
      },
      transitionDuration: {
        ui: 'var(--dur-ui)',
        reveal: 'var(--dur-reveal)',
        signal: 'var(--dur-signal)',
        scan: 'var(--dur-scan)',
      },
      borderRadius: {
        // 0 everywhere; 2 px on chips and keycaps only (doc 5.4).
        chip: '2px',
      },
    },
  },
  plugins: [
    // State on <html> is the single source of truth (doc 11.3 item 3), so variants read it.
    plugin(({ addVariant }) => {
      addVariant('motion-off', "html[data-motion='off'] &")
      addVariant('raw', "html[data-view='raw'] &")
    }),
  ],
}
