import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'

// "Throw a problem at it" menu: lists the current workflow's drills.
export default function DrillMenu({ drills, onSelect }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const buttonRef = useRef(null)
  const itemRefs = useRef([])

  useEffect(() => {
    if (open) itemRefs.current[0]?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  function close() {
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onMenuKey(e) {
    const i = itemRefs.current.indexOf(document.activeElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const n = drills.length
      const next = e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n
      itemRefs.current[next]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/80 transition hover:border-primary hover:text-primary"
      >
        <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
        Throw a Problem at It
        <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform duration-micro ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" aria-label="Problems to throw at the agent" onKeyDown={onMenuKey} className="absolute left-0 sm:left-auto sm:right-0 z-20 mt-2 w-64 max-w-[calc(100vw-3rem)] rounded-xl border border-line bg-surface p-1 shadow-lg">
          {drills.map((d, i) => (
            <button
              key={d.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role="menuitem"
              onClick={() => {
                close()
                onSelect(d.id)
              }}
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-primarySoft focus-visible:bg-primarySoft focus-visible:outline-none"
            >
              <span className="block text-sm font-medium text-ink">{d.label}</span>
              <span className="block text-xs text-muted">{d.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
