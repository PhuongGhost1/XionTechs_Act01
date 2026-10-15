import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { brand, nav } from './content'
import ThemeSwitcher from './ThemeSwitcher'
import { FLOW_FAST, FLOW_IDLE, setFlowTarget } from './scene/store'
import { isActiveHref } from './sectionTracking'
import { useThemeMode } from './theme'
import { useActiveSection } from './useActiveSection'
import './Nav.css'

// NEEDS content.js: accessible name of the menu button (it shows an icon only).
const MENU_LABEL = 'Menu'
const MENU_ID = 'cmd-menu'
const DESKTOP = '(min-width: 1024px)'

// The compact CTA in the bar and the full-width one in the menu share this look. It also speeds
// the data core up while hovered (Concept 01 §14, "Hover CTA").
const flowProps = {
  onPointerEnter: () => setFlowTarget(FLOW_FAST),
  onPointerLeave: () => setFlowTarget(FLOW_IDLE),
  onFocus: () => setFlowTarget(FLOW_FAST),
  onBlur: () => setFlowTarget(FLOW_IDLE),
}
const ctaClass =
  'group/cta items-center justify-between gap-3 bg-cmd-signal px-4 font-cmd-mono text-[11px] font-medium uppercase tracking-[0.14em] text-cmd-signal-ink transition-colors duration-micro ease-cmd hover:bg-white focus-visible:bg-white'
const ctaArrow =
  'h-3.5 w-3.5 transition-transform duration-micro ease-cmd motion-safe:group-hover/cta:translate-x-0.5 motion-safe:group-focus-visible/cta:translate-x-0.5'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef(null)
  const buttonRef = useRef(null)
  const active = useActiveSection()
  const logo = useThemeMode() === 'light' ? brand.logoLight : brand.logo

  // The hairline brightens after the first scroll. State only flips when it crosses the threshold.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The menu is a mobile pattern: close it when the viewport grows into the desktop bar.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP)
    const onChange = (e) => e.matches && setOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Esc closes the menu and hands focus back to its button; a press outside the header closes it too.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    const onPointer = (e) => {
      if (!headerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <header
      ref={headerRef}
      data-scrolled={scrolled}
      // Tabbing out of the open menu would land on page controls hidden under the panel: close it first.
      onBlur={(e) => {
        if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
      className="cmd-nav fixed inset-x-0 top-0 z-50 h-14 border-b border-cmd-line bg-cmd-bg"
    >
      <span aria-hidden="true" className="cmd-nav__rule" />
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-6 px-5 sm:px-8 lg:px-12">
        <a href="#top" className="cmd-nav__link flex h-full shrink-0 items-center" onClick={close}>
          <img src={logo.src} width={logo.width} height={logo.height} alt={brand.name} className="h-6 w-auto" />
        </a>

        <nav aria-label="Primary" className="ml-4 hidden h-full lg:block">
          <ul className="flex h-full">
            {nav.links.map((link) => (
              <li key={link.href} className="h-full">
                <a
                  href={link.href}
                  aria-current={isActiveHref(link.href, active) ? 'location' : undefined}
                  className="cmd-nav__link cmd-label relative flex h-full items-center px-3.5 text-[12px] text-cmd-muted transition-colors duration-micro ease-cmd hover:text-cmd-text aria-[current]:text-cmd-text"
                >
                  {link.label}
                  <span aria-hidden="true" className="cmd-nav__bar" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <ThemeSwitcher className="ml-auto hidden lg:flex" />
        <span aria-hidden="true" className="hidden h-5 w-px bg-cmd-line lg:block" />
        <a
          href={nav.cta.href}
          {...flowProps}
          className={`${ctaClass} hidden h-10 lg:inline-flex [@media(pointer:coarse)]:h-11`}
        >
          <span>{nav.cta.label}</span>
          <ArrowRight aria-hidden="true" className={ctaArrow} />
        </a>

        <ThemeSwitcher className="ml-auto lg:hidden" />
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls={MENU_ID}
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 shrink-0 items-center justify-center border border-cmd-line text-cmd-text transition-colors duration-micro ease-cmd hover:border-cmd-faint lg:hidden"
        >
          <span className="sr-only">{MENU_LABEL}</span>
          <span aria-hidden="true" data-open={open} className="cmd-nav__burger">
            <i />
            <i />
            <i />
          </span>
        </button>
      </div>

      {/* Below lg: a full-width panel. `hidden` takes it out of the tab order while closed. */}
      <div id={MENU_ID} hidden={!open} className="cmd-nav__panel lg:hidden">
        <div className="mx-auto max-w-[1280px] px-5 pb-6 sm:px-8">
          <nav aria-label="Primary">
            <ul>
              {nav.links.map((link, i) => (
                <li key={link.href} className="border-b border-cmd-line">
                  <a
                    href={link.href}
                    onClick={close}
                    aria-current={isActiveHref(link.href, active) ? 'location' : undefined}
                    className="flex min-h-14 items-center gap-5 py-3 text-cmd-muted aria-[current]:text-cmd-text"
                  >
                    <span aria-hidden="true" className="cmd-label w-6 text-cmd-faint">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="relative font-cmd-display text-2xl font-semibold uppercase tracking-tight">
                      {link.label}
                      <span aria-hidden="true" className="cmd-nav__bar cmd-nav__bar--text" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a href={nav.cta.href} onClick={close} {...flowProps} className={`${ctaClass} mt-6 flex h-12 w-full`}>
            <span>{nav.cta.label}</span>
            <ArrowRight aria-hidden="true" className={ctaArrow} />
          </a>
        </div>
      </div>
    </header>
  )
}
