import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { brand, frame } from '../content/index.js'
import { ATTR } from '../contract/attributes.js'
import { sysClock } from '../runtime/clock.js'
import { handleTrapTab, inertBehind } from '../runtime/focus.js'
import { useActiveStation, useBrief, useHtmlAttribute } from '../runtime/hooks.js'
import { Button } from '../ui/Button.jsx'
import CtaLabel from './CtaLabel.jsx'
import { ctaVariant, navLit } from './logic.js'
import MenuPanel from './MenuPanel.jsx'
import MotionToggle from './MotionToggle.jsx'
import ViewToggle from './ViewToggle.jsx'
import './frame.css'

// The header (doc 4.9): 64 px (48 on phones), one hairline under it, never taller.
//
//   from 1024   logo, SERVICES WORK CONTACT, [SYS / year . DOY nnn from 1280], READ | RAW, MOTION, CTA
//   768 to 1023 logo, READ | RAW, CTA, MENU
//   under 768   logo, READ | RAW, MENU
//
// The active word is underlined 1 px in yellow, read from data-active (written by the scroll
// controller). The CTA is outlined until the WORK station, then filled (the ladder of doc 4.9
// escalates by size and fill, never by repeating itself) and counts the brief. MENU opens a
// full-screen list with a focus trap, Esc to close and focus returned to the MENU button.

// What the open menu hides from the keyboard and from assistive tech.
const BEHIND = ['#main', '[data-frame="dock"]', '[data-fixed-cta]']
const MENU_ID = 'site-menu'

function useMenu(rootRef, buttonRef) {
  const [open, setOpen] = useState(false)

  const close = useCallback(
    (returnFocus = false) => {
      setOpen(false)
      if (returnFocus) buttonRef.current?.focus()
    },
    [buttonRef],
  )

  useEffect(() => {
    if (!open) return undefined
    const release = inertBehind(BEHIND)
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(true)
      } else if (e.key === 'Tab') {
        handleTrapTab(e, rootRef.current)
      }
    }
    document.addEventListener('keydown', onKey)
    // The menu only exists below 1024 px: if the window grows past that, the bar has the words.
    const wide = matchMedia('(min-width: 1024px)')
    const onWide = () => wide.matches && close(false)
    wide.addEventListener('change', onWide)
    rootRef.current?.querySelector(`#${MENU_ID} a`)?.focus()
    return () => {
      release()
      document.removeEventListener('keydown', onKey)
      wide.removeEventListener('change', onWide)
    }
  }, [open, close, rootRef])

  return { open, toggle: () => setOpen((v) => !v), close }
}

export default function Header() {
  const { count } = useBrief()
  const station = useActiveStation()
  const activeId = useHtmlAttribute(ATTR.active)
  const clock = useMemo(() => sysClock(), [])
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const menu = useMenu(rootRef, buttonRef)
  const logo = brand.logo.reversed

  return (
    <header
      ref={rootRef}
      data-frame="header"
      className="fixed inset-x-0 top-0 z-40 h-header border-b border-hair bg-ground"
    >
      <div className="mx-auto flex h-full max-w-content items-center gap-1 px-[var(--margin-x)] md:gap-3 lg:gap-6">
        {/* The logo is the reversed PNG at exactly half its native width: crisp on 2x screens. */}
        <a href="#standby" onClick={() => menu.close(false)} className="flex h-11 shrink-0 items-center">
          <img
            data-logo=""
            src={logo.url}
            alt={logo.alt.text}
            width={logo.width / 2}
            height={logo.height / 2}
            decoding="async"
          />
        </a>

        <nav aria-label={frame.navLabel.text} className="ml-4 hidden items-center gap-6 lg:flex">
          {frame.nav.map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={navLit(item, activeId) ? 'true' : undefined}
              className="nav-link inline-flex h-11 min-w-11 items-center justify-center px-1 font-mono text-label uppercase text-ink2 transition-colors duration-ui ease-ui hover:text-ink aria-[current]:text-ink motion-off:transition-none"
            >
              <span className="nav-link__text">{item.text}</span>
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:gap-3 lg:gap-4">
          <p
            title={frame.sysTitle.text}
            className="mr-2 hidden whitespace-nowrap font-mono text-label uppercase text-ink3 xl:block"
          >
            {frame.sys.text} / {clock.year} · {frame.doy.text} {clock.doy}
          </p>
          <ViewToggle />
          <MotionToggle className="hidden lg:inline-flex" />
          <Button
            href="#contact"
            size="sm"
            variant={ctaVariant(station.index)}
            flow
            className="hidden whitespace-nowrap md:inline-flex"
          >
            <CtaLabel count={count} />
          </Button>
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={menu.open}
            aria-controls={menu.open ? MENU_ID : undefined}
            onClick={menu.toggle}
            className="inline-flex h-11 min-w-11 items-center justify-center border border-hair px-2 font-mono text-label uppercase text-ink2 transition-colors duration-ui ease-ui hover:text-ink motion-off:transition-none lg:hidden"
          >
            {menu.open ? frame.menu.close.text : frame.menu.open.text}
          </button>
        </div>
      </div>

      {menu.open && (
        <MenuPanel
          id={MENU_ID}
          close={menu.close}
          count={count}
          activeId={activeId}
          clock={clock}
          sectionActive={navLit}
        />
      )}
    </header>
  )
}
