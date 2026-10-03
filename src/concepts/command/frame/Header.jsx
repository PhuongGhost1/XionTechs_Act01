import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { brand, frame } from '../content/index.js'
import { ATTR } from '../contract/attributes.js'
import { sysClock } from '../runtime/clock.js'
import { watchLayout } from '../runtime/fit.js'
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
//
// Enlarged text: the bar is a fixed 48 or 64 px high and cannot wrap, so when its row is wider than
// the window (200 percent text on a phone) the READ | RAW toggle leaves the bar and moves into the
// MENU panel (header[data-crowded], frame.css), where it has room. From 1024 a crowded bar (text
// enlarged 200 percent) takes the same layout: logo and MENU, everything else in the panel.

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
    const onWide = () => wide.matches && !rootRef.current?.hasAttribute('data-crowded') && close(false)
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
  const rowRef = useRef(null)
  const menu = useMenu(rootRef, buttonRef)

  // Imperative on purpose: no state per resize, and no flash (the toggle is put back, measured and
  // taken out again within one task).
  useEffect(() => {
    const header = rootRef.current
    const row = rowRef.current
    if (!header || !row) return undefined
    return watchLayout(() => {
      header.removeAttribute('data-crowded')
      if (row.scrollWidth > row.clientWidth + 1) header.setAttribute('data-crowded', '')
    })
  }, [])
  const logo = brand.logo.reversed

  return (
    <header
      ref={rootRef}
      data-frame="header"
      className="fixed inset-x-0 top-0 z-40 h-header border-b border-hair bg-ground"
    >
      <div ref={rowRef} className="mx-auto flex h-full max-w-content items-center gap-1 px-[var(--margin-x)] md:gap-3 lg:gap-6">
        {/* The logo is the reversed PNG at exactly half its native width: crisp on 2x screens. */}
        <a href="#standby" onClick={() => menu.close(false)} className="flex h-[44px] shrink-0 items-center">
          <img
            data-logo=""
            src={logo.url}
            alt={logo.alt.text}
            width={logo.width / 2}
            height={logo.height / 2}
            decoding="async"
          />
        </a>

        <nav aria-label={frame.navLabel.text} className="header-nav ml-4 hidden items-center gap-6 lg:flex">
          {frame.nav.map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={navLit(item, activeId) ? 'true' : undefined}
              className="nav-link inline-flex h-[44px] min-w-[44px] items-center justify-center px-1 font-mono text-label uppercase text-ink2 transition-colors duration-ui ease-ui hover:text-ink aria-[current]:text-ink motion-off:transition-none"
            >
              <span className="nav-link__text">{item.text}</span>
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:gap-3 lg:gap-4">
          <p
            title={frame.sysTitle.text}
            className="header-sys mr-2 hidden whitespace-nowrap font-mono text-label uppercase text-ink3 xl:block"
          >
            {frame.sys.text} / {clock.year} · {frame.doy.text} {clock.doy}
          </p>
          <ViewToggle className="header-view" />
          <MotionToggle className="header-motion hidden lg:inline-flex" />
          <Button
            href="#contact"
            size="sm"
            variant={ctaVariant(station.index)}
            flow
            className="header-cta hidden !h-[44px] whitespace-nowrap md:inline-flex"
          >
            <CtaLabel count={count} />
          </Button>
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={menu.open}
            aria-controls={menu.open ? MENU_ID : undefined}
            onClick={menu.toggle}
            className="header-menu inline-flex h-[44px] min-w-[44px] items-center justify-center border border-hair px-2 font-mono text-label uppercase text-ink2 transition-colors duration-ui ease-ui hover:text-ink motion-off:transition-none lg:hidden"
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
