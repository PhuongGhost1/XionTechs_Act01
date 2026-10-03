import { frame } from '../content/index.js'
import { Button } from '../ui/Button.jsx'
import CtaLabel from './CtaLabel.jsx'
import MotionToggle from './MotionToggle.jsx'
import Readout from './Readout.jsx'
import './frame.css'

// The full-screen list that the MENU button opens below 1024 px (doc 4.9): the three words at
// large size, the CTA, the MOTION toggle (which has no room in the phone header) and the honest
// readout. It sits under the header bar, so the bar's MENU / CLOSE button stays where it was.
// Header.jsx owns the open state, the focus trap, Esc and the inert page behind it.
//
// The words are content in capitals (they are labels in the header); here they are display type,
// so CSS sets them in sentence case: lowercase, then the first letter up.
export default function MenuPanel({ id, close, count, activeId, clock, sectionActive }) {
  return (
    <div
      id={id}
      className="menu-panel fixed inset-x-0 bottom-0 top-header z-10 overflow-y-auto bg-ground"
    >
      <div className="mx-auto flex min-h-full max-w-content flex-col gap-8 px-[var(--margin-x)] pb-8 pt-4 md:pt-8">
        <nav aria-label={frame.menu.label.text}>
          <ul className="flex flex-col">
            {frame.nav.map((item) => (
              <li key={item.id} className="border-b border-hair">
                <a
                  href={item.href}
                  onClick={() => close(false)}
                  aria-current={sectionActive(item, activeId) ? 'true' : undefined}
                  className="group flex min-h-16 items-center justify-between gap-4 font-display text-row font-medium text-ink"
                >
                  <span className="lowercase first-letter:uppercase">{item.text}</span>
                  <span
                    aria-hidden="true"
                    className="h-px w-8 origin-right scale-x-50 bg-ink3 transition-transform duration-ui ease-ui group-hover:scale-x-100 group-focus-visible:scale-x-100 group-aria-[current=true]:scale-x-100 group-aria-[current=true]:bg-signal motion-off:transition-none"
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Button href="#contact" arrow="right" flow onClick={() => close(false)} className="w-full justify-between">
          <CtaLabel count={count} />
        </Button>

        <div className="mt-auto flex flex-col gap-4 border-t border-hair pt-6">
          <MotionToggle className="-ml-3 self-start" />
          <Readout stacked />
          <p title={frame.sysTitle.text} className="font-mono text-label uppercase text-ink3">
            {frame.sys.text} / {clock.year} · {frame.doy.text} {clock.doy}
          </p>
        </div>
      </div>
    </div>
  )
}
