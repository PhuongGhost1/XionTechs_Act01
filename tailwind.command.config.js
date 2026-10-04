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

// Source text reduced to its string literals (comments removed first).
function stringsOnly(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, '$1')
  return (code.match(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g) || []).join('\n')
}

/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind scans raw text, so a word in a comment ("ring", "table", "static", "collapse") or in
  // a method call (".filter(") would emit a utility nobody uses. The transform keeps only the
  // string literals of .js and .jsx files, and the exclusions drop files that hold prose or no
  // class names at all (tests, copy, runtime, contract, three.js). A class name written outside a
  // string, or inside one of those folders, is not generated.
  content: {
    files: [
      './concepts/command/index.html',
      './src/concepts/command/**/*.{js,jsx}',
      '!./src/concepts/command/**/*.test.js',
      '!./src/concepts/command/{content,core/three,runtime,contract}/**',
    ],
    transform: { js: stringsOnly, jsx: stringsOnly },
  },
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
  // The reset lives in styles/base.css (trimmed to what the page renders). Every other switch is a
  // plugin whose utilities this page never uses: Tailwind writes one block of --tw-* defaults per
  // enabled plugin (twice, for * and ::backdrop), and these are about 2 kB of CSS for nothing.
  corePlugins: {
    preflight: false,
    ringWidth: false, ringColor: false, ringOffsetWidth: false, ringOffsetColor: false,
    boxShadow: false, boxShadowColor: false, dropShadow: false,
    blur: false, brightness: false, contrast: false, grayscale: false, hueRotate: false, invert: false, saturate: false, sepia: false, filter: false,
    backdropBlur: false, backdropBrightness: false, backdropContrast: false, backdropFilter: false, backdropGrayscale: false, backdropHueRotate: false, backdropInvert: false, backdropOpacity: false, backdropSaturate: false, backdropSepia: false,
    gradientColorStops: false, scrollSnapType: false, touchAction: false, fontVariantNumeric: false, borderSpacing: false, contain: false,
    // Colours carry their own alpha (a modifier such as border-hair/50, or the token's default): the
    // --tw-*-opacity indirection would only repeat in every colour rule.
    backgroundOpacity: false, borderOpacity: false, textOpacity: false, divideOpacity: false, placeholderOpacity: false,
  },
  plugins: [
    // State on <html> is the single source of truth (doc 11.3 item 3), so variants read it.
    plugin(({ addVariant }) => {
      addVariant('motion-off', "html[data-motion='off'] &")
      addVariant('raw', "html[data-view='raw'] &")
    }),
  ],
}
