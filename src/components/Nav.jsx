import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { company, nav } from '../content/site'
import ThemePicker from './ThemePicker'

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="theme-fade sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center">
          <img src={company.logo} alt={company.name} className="logo-img h-8 w-auto" />
        </a>

        <nav className="hidden gap-8 md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-ink/70 transition hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemePicker />
          <a
            href="#contact"
            className="group hidden items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primaryInk transition hover:bg-primaryHover md:inline-flex"
          >
            Talk to us
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <button
            className="md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <div className="space-y-1.5">
              <span className="block h-0.5 w-6 bg-ink" />
              <span className="block h-0.5 w-6 bg-ink" />
              <span className="block h-0.5 w-6 bg-ink" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-6 py-4 md:hidden">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="py-2 text-sm text-ink/80" onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <a href="#contact" className="mt-2 py-2 text-sm font-medium text-primary" onClick={() => setOpen(false)}>
            Talk to us →
          </a>
        </nav>
      )}
    </header>
  )
}
