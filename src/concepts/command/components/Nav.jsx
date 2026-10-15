import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { company, nav, navCta } from '../../../content/site'
import { SECTIONS_READY } from './sectionsReady'

// Header behaviour (MOTION §4): soft at the top of the page, solid with a border and a light
// shadow once scrolled, a little shorter while scrolling down and back to full height on the way
// up. It never hides. The logo does not animate; it moves with the bar.
const TOP = 8 // px from the top that still counts as "at the top"
const COMPACT_AFTER = 120 // px scrolled before the bar may shorten
const JITTER = 6 // px of scroll ignored before a direction change counts

// 'top' | 'solid' | 'compact'. One listener, throttled to animation frames; React only
// re-renders when the mode actually changes.
function useHeaderMode() {
  const [mode, setMode] = useState(() => (window.scrollY > TOP ? 'solid' : 'top'))
  useEffect(() => {
    let lastY = window.scrollY
    let frame = 0
    const update = () => {
      frame = 0
      const y = Math.max(0, window.scrollY)
      if (y <= TOP) {
        lastY = y
        setMode('top')
        return
      }
      const dy = y - lastY
      if (Math.abs(dy) < JITTER) return
      lastY = y
      setMode(dy > 0 && y > COMPACT_AFTER ? 'compact' : 'solid')
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return mode
}

const HREFS = nav.map((item) => item.href)

// The nav link whose section crosses a thin band a third of the way down the viewport, or null
// (hero, contact, or a section without a nav link). Sections in the lazy lower half appear later,
// so the observer is rebuilt when they announce themselves (SECTIONS_READY).
function useActiveSection() {
  const [active, setActive] = useState(null)
  const [generation, setGeneration] = useState(0)
  useEffect(() => {
    const onReady = () => setGeneration((g) => g + 1)
    window.addEventListener(SECTIONS_READY, onReady)
    return () => window.removeEventListener(SECTIONS_READY, onReady)
  }, [])
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const sections = HREFS.map((href) => document.getElementById(href.slice(1))).filter(Boolean)
    const inBand = new Set()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target)
          else inBand.delete(entry.target)
        }
        const current = sections.find((s) => inBand.has(s))
        setActive(current ? `#${current.id}` : null)
      },
      { rootMargin: '-30% 0px -65% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [generation])
  return active
}

export default function Nav() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const mode = useHeaderMode()
  const active = useActiveSection()
  const compact = mode === 'compact' && !open
  const solid = mode !== 'top' || open

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    // Shortening is a transform, so nothing below the header reflows: the bar moves up 8px
    // (its top edge leaves the screen) and its contents move back down 4px to stay centred.
    <header
      className={`sticky top-0 z-50 transition-transform duration-base ease-brand motion-reduce:transition-none ${
        compact ? '-translate-y-2' : ''
      }`}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-paper/75" />
      <div
        aria-hidden="true"
        className={`absolute inset-0 border-b border-line bg-paper shadow-depth-1 transition-opacity duration-base ease-brand ${
          solid ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`relative mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 transition-transform duration-base ease-brand motion-reduce:transition-none ${
          compact ? 'translate-y-1' : ''
        }`}
      >
        <a href="#top" className="flex shrink-0 items-center">
          <img
            src={company.logo.src}
            width={company.logo.width}
            height={company.logo.height}
            alt={company.name}
            className="logo-img h-8 w-auto"
          />
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {nav.map((item) => {
              const current = item.href === active
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={current ? 'location' : undefined}
                    className={`relative block py-1 text-sm transition-colors duration-micro ${
                      current ? 'text-ink' : 'text-ink/70 hover:text-ink'
                    }`}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-accent transition-transform duration-base ease-brand motion-reduce:transition-none ${
                        current ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <a
          href={navCta.href}
          className="group/cta relative hidden shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primaryInk transition-colors duration-micro hover:bg-primaryHover after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:shadow-depth-2 after:opacity-0 after:transition-opacity after:duration-micro hover:after:opacity-100 focus-visible:after:opacity-100 lg:inline-flex"
        >
          {navCta.label}
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-micro ease-brand motion-safe:group-hover/cta:translate-x-1 motion-safe:group-focus-visible/cta:translate-x-1"
          />
        </a>

        <button
          ref={buttonRef}
          type="button"
          className="-mr-2 rounded-full p-2 text-ink lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Main" className="relative border-t border-line px-6 py-4 lg:hidden">
          <ul className="flex flex-col">
            {nav.map((item) => {
              const current = item.href === active
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={current ? 'location' : undefined}
                    className={`flex items-center gap-2.5 py-2.5 text-base ${current ? 'font-medium text-ink' : 'text-ink/80'}`}
                    onClick={() => setOpen(false)}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full bg-accent transition-opacity duration-micro ${current ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
          <a
            href={navCta.href}
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primaryInk"
          >
            {navCta.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </nav>
      )}
    </header>
  )
}
