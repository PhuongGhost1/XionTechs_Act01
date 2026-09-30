import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { DEFAULT_THEME, STORAGE_KEY, THEME_IDS, resolveTheme } from './themes'

const ThemeContext = createContext({ theme: DEFAULT_THEME, setTheme: () => {} })

function readInitial() {
  if (typeof document === 'undefined') return DEFAULT_THEME
  // index.html already set this before React loaded; trust it if valid.
  const current = document.documentElement.getAttribute('data-theme')
  if (THEME_IDS.includes(current)) return current
  let stored = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    /* storage blocked */
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  return resolveTheme(stored, prefersDark)
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback((id) => {
    if (!THEME_IDS.includes(id)) return
    setThemeState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* storage blocked: theme still applies for this session */
    }
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext)
}
