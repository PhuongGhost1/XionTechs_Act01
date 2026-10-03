import { useEffect, useRef, useState } from 'react'
import { brand, meta, nav, sheets, ui } from '../content.js'
import { motion, usePaused } from '../state/motion.js'
import { useActiveSheet } from './useActiveSheet.js'

// BRIEF §6: minimal editorial navigation with tiny technical metadata. The Work group covers sheets 05 and 06.
const GROUPS = { '#work': ['staffxp', 'work'], '#about': ['about'], '#capabilities': ['capabilities'], '#process': ['process'] }
const isCurrent = (href, active) => (GROUPS[href] || []).includes(active)

function PauseButton({ className = '' }) {
  const paused = usePaused()
  return (
    <button
      type="button"
      onClick={motion.toggle}
      aria-pressed={paused}
      className={`bp-mono inline-flex min-h-[2.25rem] items-center gap-2 border border-bp-line px-3 text-bp-text transition-colors duration-200 hover:bg-bp-bg2 ${className}`}
    >
      <span aria-hidden="true" className={`block h-2 w-2 ${paused ? 'bg-bp-line' : 'bg-bp-signal outline outline-1 outline-bp-line'}`} />
      {paused ? ui.play : ui.pause}
    </button>
  )
}

function SheetIndex({ open, onClose, active }) {
  const closeRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div role="dialog" aria-modal="true" aria-label={ui.menuTitle} className="fixed inset-0 z-[60] flex flex-col bg-bp-bg lg:hidden">
      <div className="bp-wrap flex h-14 items-center justify-between border-b border-bp-rule">
        <span className="bp-mono text-bp-mute">{ui.menuTitle}</span>
        <button ref={closeRef} type="button" onClick={onClose} className="bp-mono min-h-[2.25rem] border border-bp-line px-3 text-bp-text">
          {ui.menuClose}
        </button>
      </div>
      <ol className="bp-wrap flex-1 overflow-y-auto py-4">
        {sheets.map((s) => (
          <li key={s.id} className="border-b border-bp-rule">
            <a
              href={`#${s.id}`}
              onClick={onClose}
              aria-current={active === s.id ? 'location' : undefined}
              className="flex items-baseline gap-4 py-4 text-bp-text"
            >
              <span className="bp-mono w-12 text-bp-mute">{s.no}</span>
              <span className="bp-h2 text-[clamp(1.6rem,8vw,2.4rem)]">{s.title}</span>
              {active === s.id ? <span aria-hidden="true" className="ml-auto h-2 w-2 bg-bp-signal outline outline-1 outline-bp-line" /> : null}
            </a>
          </li>
        ))}
        <li className="py-6">
          <PauseButton />
        </li>
      </ol>
    </div>
  )
}

export default function Header() {
  const active = useActiveSheet()
  const [open, setOpen] = useState(false)
  const opener = useRef(null)
  const close = () => {
    setOpen(false)
    opener.current?.focus()
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-bp-rule bg-bp-bg">
        <div className="bp-wrap flex h-14 items-center gap-6">
          <a href="#top" className="shrink-0" aria-label={`${brand.name}, top of page`}>
            <img src={brand.logo.src} width={brand.logo.width} height={brand.logo.height} alt="" className="h-7 w-auto" />
          </a>

          <nav aria-label="Primary" className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-7">
              {nav.map((item) => {
                const current = isCurrent(item.href, active)
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={current ? 'location' : undefined}
                      className="bp-mono group relative inline-flex items-center gap-2 py-2 text-bp-text"
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 transition-opacity duration-200 ${current ? 'bg-bp-signal opacity-100 outline outline-1 outline-bp-line' : 'opacity-0'}`}
                      />
                      {item.label}
                      <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-bp-line transition-transform duration-300 ease-bp group-hover:scale-x-100" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          <p className="bp-mono hidden whitespace-nowrap text-bp-mute xl:block" aria-hidden="true">
            {meta.sys} · {meta.arch} · {meta.build} · {ui.rev}.{__BUILD_NUMBER__}
          </p>
          <PauseButton className="hidden lg:inline-flex" />

          <button
            ref={opener}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            className="bp-mono ml-auto min-h-[2.25rem] border border-bp-line px-3 text-bp-text lg:hidden"
          >
            {ui.menuOpen}
          </button>
        </div>
      </header>
      <SheetIndex open={open} onClose={close} active={active} />
    </>
  )
}
