import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { company, nav, navCta } from '../content/site'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)

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
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
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
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-sm text-ink/70 transition-colors hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={navCta.href}
          className="group hidden shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primaryInk transition-colors hover:bg-primaryHover lg:inline-flex"
        >
          {navCta.label}
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
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
        <nav id="mobile-menu" aria-label="Main" className="border-t border-line px-6 py-4 lg:hidden">
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="block py-2.5 text-base text-ink/80" onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
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
