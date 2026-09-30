// Theme registry. Colour values live in src/index.css as CSS variables keyed by
// data-theme; the swatches here are only for the picker preview.
export const THEMES = [
  { id: 'navy', label: 'Classic Navy', swatch: ['#f8f9fb', '#183860', '#b7791f'] },
  { id: 'midnight', label: 'Midnight', swatch: ['#0a1a2e', '#e5a52a', '#5b8bd0'] },
  { id: 'aurum', label: 'Aurum', swatch: ['#fbf7ef', '#e5a52a', '#183860'] },
]

export const THEME_IDS = THEMES.map((t) => t.id)
export const DEFAULT_THEME = 'navy'
export const STORAGE_KEY = 'xt-theme'

export function resolveTheme(stored, prefersDark) {
  if (THEME_IDS.includes(stored)) return stored
  return prefersDark ? 'midnight' : DEFAULT_THEME
}
