import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Check, SunMoon } from 'lucide-react'
import { THEMES, getThemeId, setTheme, subscribe } from './theme'

// Theme switcher: a small disclosure button, same footprint and keyboard pattern as PauseMotion
// (lives in the header, label hides below xl, Escape and an outside click close the panel — see
// Nav.jsx's own menu for the pattern this mirrors).
const LABEL = 'Theme'

export default function ThemeSwitcher({ className = '' }) {
  const current = useSyncExternalStore(subscribe, getThemeId, () => 'navy')
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="cmd-label flex h-11 min-w-11 items-center justify-center gap-2 border border-transparent px-2.5 text-cmd-muted transition-colors duration-micro ease-cmd hover:border-cmd-line hover:text-cmd-text lg:h-10"
      >
        <SunMoon aria-hidden="true" className="h-3.5 w-3.5" />
        <span className="sr-only xl:not-sr-only">{LABEL}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={LABEL}
          className="absolute right-0 top-full z-10 mt-2 w-44 border border-cmd-line bg-cmd-surface py-1 shadow-[0_8px_24px_rgb(0_0_0/0.28)]"
        >
          {THEMES.map((t) => {
            const active = t.id === current
            return (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(t.id)
                  setOpen(false)
                  buttonRef.current?.focus()
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] text-cmd-muted transition-colors duration-micro ease-cmd hover:bg-cmd-raise hover:text-cmd-text aria-checked:text-cmd-text"
              >
                <span aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 rounded-full border border-cmd-line swatch-${t.id}`} />
                <span className="flex-1">{t.label}</span>
                {active && <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-cmd-signal-fg" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
