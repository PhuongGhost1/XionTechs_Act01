import { useEffect, useRef, useState } from 'react'
import { Palette } from 'lucide-react'
import { THEMES } from '../theme/themes'
import { useTheme } from '../theme/ThemeProvider'

export default function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const popoverRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onClick(e) {
      if (!popoverRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Choose colour theme"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition hover:border-primary hover:text-primary"
      >
        <Palette className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          role="menu"
          className="theme-fade absolute right-0 mt-2 w-48 rounded-xl border border-line bg-surface p-2 shadow-lg"
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.id}
              onClick={() => {
                setTheme(t.id)
                setOpen(false)
                buttonRef.current?.focus()
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-primarySoft ${
                theme === t.id ? 'font-semibold text-primary' : 'text-ink/80'
              }`}
            >
              <span className="flex overflow-hidden rounded-full border border-line">
                {t.swatch.map((c) => (
                  <span key={c} className="h-4 w-3" style={{ backgroundColor: c }} />
                ))}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
