import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// Zero-state guard for Concept 01 v2 (docs/concepts/command-v2/00-direction.md, section 11.3 item 7).
// Nothing under src/concepts/command may import from outside its own folder, except npm packages.
// `no-restricted-imports` cannot say "outside this folder", so the rule is generated per directory
// depth: a file N levels below the concept root may not climb more than N levels.
const CONCEPT = 'src/concepts/command'
const MAX_DEPTH = 6
const OLD_PAGE = [
  '**/src/components/**',
  '**/src/hooks/**',
  '**/src/workflow/**',
  '**/src/content/**',
  '**/src/App*',
  '**/src/index.css',
]
const REMOVED_LIBS = [
  { name: 'lucide-react', message: 'Concept 01 v2 draws its own glyphs; no icon library.' },
  { name: 'gsap', message: 'Concept 01 v2 uses CSS sticky and its own scroll scalar; no GSAP.' },
  { name: 'framer-motion', message: 'Concept 01 v2 uses CSS motion; no Framer Motion.' },
]

const conceptGuards = Array.from({ length: MAX_DEPTH }, (_, depth) => {
  const climb = '../'.repeat(depth + 1)
  const stars = Array.from({ length: depth }, () => '*').join('/')
  return {
    // Files exactly `depth` folders below the concept root (the test files included).
    files: [`${CONCEPT}/${stars ? `${stars}/` : ''}*.{js,jsx}`],
    languageOptions: {
      globals: { __BUILD_SHA__: 'readonly', __BUILD_DATE__: 'readonly' },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: REMOVED_LIBS,
          patterns: [
            {
              // `../` repeated depth + 1 times leaves the concept folder.
              group: [`${climb}*`, climb.replace(/\/$/, '')],
              message: 'Zero-state rule: nothing in src/concepts/command imports from outside that folder.',
            },
            { group: OLD_PAGE, message: 'Zero-state rule: the old page is out of bounds for Concept 01 v2.' },
          ],
        },
      ],
    },
  }
})

export default [
  { ignores: ['dist', '.claude', '.agents'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Without eslint-plugin-react, core ESLint can't see JSX usage, so capitalised component/icon imports are ignored by name.
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^[A-Z_]',
        },
      ],
    },
  },
  // Node-side scripts (WP6's scripts/command-qa.mjs) and the root config files.
  {
    files: ['scripts/**/*.{js,mjs}', '*.config.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: { ...js.configs.recommended.rules },
  },
  ...conceptGuards,
]
