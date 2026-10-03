import { brand, frame } from '../content/index.js'
import { Button } from '../ui/Button.jsx'
import { useBrief } from '../runtime/hooks.js'
import MotionToggle from './MotionToggle.jsx'
import ViewToggle from './ViewToggle.jsx'

// STUB (WP1 replaces this file). The 64 px header (48 on phones): the reversed logo at half its
// native width, three words, READ | RAW, MOTION and the CTA that counts the brief. WP1 adds the
// SYS / DOY indicator, the active underline from data-active, the CTA states and the mobile menu.
export default function Header() {
  const { count } = useBrief()
  const logo = brand.logo.reversed
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-header border-b border-hair bg-ground">
      <div className="mx-auto flex h-full max-w-content items-center justify-between gap-4 px-[var(--margin-x)]">
        <a href="#standby" aria-label={brand.name.text}>
          <img data-logo="" src={logo.url} alt={logo.alt.text} width={logo.width / 2} height={logo.height / 2} />
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {frame.nav.map((item) => (
            <a key={item.id} href={item.href} className="font-mono text-label uppercase text-ink2 hover:text-ink">
              {item.text}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ViewToggle />
          <span className="hidden md:inline-flex">
            <MotionToggle />
          </span>
          <Button variant="ghost" href="#contact" flow className="hidden h-10 md:inline-flex">
            {frame.cta.text}
            {count > 0 ? ` ( ${count} )` : ''}
          </Button>
        </div>
      </div>
    </header>
  )
}
