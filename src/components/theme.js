// Theme store: <html data-theme="..."> selects which block in index.css is active. Plain mutable
// state + subscribe, the same pattern as scene/store.js — most of the page is pure CSS custom
// properties and repaints for free, but the two WebGL canvases (XCoreCanvas, CampusCanvas) bake
// colours into materials once at creation, so App.jsx and CampusTwin.jsx key them off `themeId()`
// to force a fresh mount (and a fresh colour read) when the theme changes. A plain <img> logo has
// the same problem one layer up — it can't read a CSS token at all — so useThemeMode() below lets
// Nav/Footer/FinalCta pick a light- or dark-appropriate source file instead (content.js `brand`).
import { useSyncExternalStore } from 'react'
export const THEMES = [
  { id: 'navy', label: 'Navy', mode: 'dark' },
  { id: 'graphite', label: 'Graphite', mode: 'dark' },
  { id: 'paper', label: 'Paper', mode: 'light' },
  { id: 'linen', label: 'Linen', mode: 'light' },
]

const THEME_IDS = THEMES.map((t) => t.id)
const DEFAULT_THEME = 'navy'
export const STORAGE_KEY = 'xiontechs-theme'

function systemDefault() {
  if (typeof window === 'undefined' || !window.matchMedia) return DEFAULT_THEME
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'paper' : DEFAULT_THEME
}

function readStored() {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return THEME_IDS.includes(value) ? value : null
  } catch {
    return null // storage blocked (private mode, disabled): fall back to system/default
  }
}

// Matches the CSS --c-bg of each theme (src/index.css); used only for the browser-chrome tint.
const META_COLOR = { navy: '#071B34', graphite: '#141518', paper: '#F3F5F8', linen: '#FAF6ED' }

function applyToDocument(id) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = id
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[id])
}

export const themeState = {
  id: readStored() ?? systemDefault(),
}
applyToDocument(themeState.id) // matches the inline script in index.html; harmless if already set

const listeners = new Set()
export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setTheme(id) {
  if (!THEME_IDS.includes(id) || id === themeState.id) return
  themeState.id = id
  applyToDocument(id)
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // storage blocked: the choice just won't survive a reload
  }
  listeners.forEach((fn) => fn(id))
}

export const getThemeId = () => themeState.id

const MODE_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t.mode]))
const getThemeMode = () => MODE_BY_ID[themeState.id]

// 'dark' | 'light' — for anything that needs to pick between two theme-appropriate assets (a logo
// file, an image) rather than a CSS token. Re-renders only on an actual dark/light crossing, not
// on every theme change (navy -> graphite both return 'dark').
export function useThemeMode() {
  return useSyncExternalStore(subscribe, getThemeMode, () => 'dark')
}
