import { brand, nav, sections } from '../content.js'
import { useStore } from '../hooks/index.js'
import { Button, Mono } from '../ui/index.jsx'
import BuildCounter from './BuildCounter.jsx'
import { store } from '../state/store.js'

// Compact technical bar (BRIEF §6). The hairline under it is the page's progress signal: it fills
// with --page-p, written by the scroll controller.
export default function Header() {
  const section = useStore((s) => s.section)
  const current = sections.find((s) => s.id === section)
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-x-line bg-x-bg">
      <div className="mx-auto flex h-14 w-full max-w-page items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-6">
          <a href="#boot" aria-label="XionTechs, back to top" className="block shrink-0">
            <img src={brand.logo.src} width={brand.logo.width} height={brand.logo.height} alt="XionTechs" className="h-6 w-auto sm:h-7" />
          </a>
          <Mono className="hidden text-x-faint xl:block" aria-hidden="true">
            {nav.tag}
          </Mono>
          <BuildCounter className="hidden lg:block" />
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {nav.items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={section === item.id ? 'true' : undefined}
              className={`x-mono relative flex min-h-11 items-center px-3 transition-colors duration-200 ease-x hover:text-x-text ${
                section === item.id ? 'text-x-text' : 'text-x-mute'
              }`}
            >
              {item.label}
              <span
                aria-hidden="true"
                className={`absolute inset-x-3 bottom-2 h-px bg-x-signal transition-opacity duration-200 ease-x ${section === item.id ? 'opacity-100' : 'opacity-0'}`}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {current && (
            <Mono className="text-x-faint md:hidden" aria-hidden="true">
              {current.code} / {current.id}
            </Mono>
          )}
          <Button href={nav.cta.href} arrow className="min-h-9 !px-3 !py-2 text-[0.75rem] sm:!px-4" onClick={() => store.set({ section: 'build' })}>
            <span className="hidden sm:inline">{nav.cta.label}</span>
            <span className="sm:hidden">Start</span>
          </Button>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[-1px] h-px origin-left bg-x-signal"
        style={{ transform: 'scaleX(var(--page-p, 0))' }}
      />
    </header>
  )
}
