import { useEffect, useState } from 'react'
import { Button } from '../ui/Button.jsx'
import { useActiveStation, useBrief } from '../runtime/hooks.js'
import CtaLabel from './CtaLabel.jsx'
import { ctaVariant } from './logic.js'
import './frame.css'

// The fixed bottom CTA bar on phones (doc 4.9): 56 px, sitting on top of the 56 px dock, and
// shown from md up never (the header has the CTA from 768). It follows the "one primary control
// per viewport" rule of the CTA ladder, so it is hidden while another start-a-project control is
// already on screen:
//   - the hero's own primary button (the first yellow button of #standby), and
//   - the composer (#contact), where SEND EMAIL is the action.
// While hidden it is inert, so it can not be tabbed to or read. Layout never changes with it:
// base.css reserves its height (--bar-h) for the end of the page and the pinned stages, so it
// never covers text at rest. It follows the header's CTA states (outlined until the WORK station,
// then filled). data-fixed-cta lets RAW take it out.

const WATCH = ['#standby [data-fill="signal"]', '#contact']
// Header 48 and dock 56 are on screen on a phone: an element behind them is not "in view".
const MARGIN = '-48px 0px -56px 0px'

/** True while any of the selectors' elements is visible between the header and the dock. */
function useAnyInView(selectors) {
  // Start hidden: the page opens on the hero, and a bar that flashes in and out would be noise.
  const [seen, setSeen] = useState(true)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(false)
      return undefined
    }
    const visible = new Set()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target)
          else visible.delete(e.target)
        }
        setSeen(visible.size > 0)
      },
      { rootMargin: MARGIN },
    )
    const attach = () => {
      let all = true
      for (const s of selectors) {
        const el = document.querySelector(s)
        if (el) io.observe(el)
        else all = false
      }
      return all
    }
    // Sections can mount after this component (a lazy chunk): keep looking until all are found.
    let mo = null
    let giveUp = 0
    if (!attach()) {
      mo = new MutationObserver(() => attach() && mo.disconnect())
      mo.observe(document.body, { childList: true, subtree: true })
      giveUp = window.setTimeout(() => mo.disconnect(), 5000)
    }
    return () => {
      io.disconnect()
      mo?.disconnect()
      window.clearTimeout(giveUp)
    }
  }, [selectors])
  return seen
}

export default function MobileBar() {
  const { count } = useBrief()
  const station = useActiveStation()
  const hidden = useAnyInView(WATCH)
  return (
    <div
      data-fixed-cta=""
      data-hidden={hidden ? 'true' : 'false'}
      inert={hidden ? '' : undefined}
      className="mobile-bar fixed inset-x-0 bottom-dock z-30 flex h-14 items-center border-t border-hair bg-ground px-[var(--margin-x)] md:hidden"
    >
      <Button href="#contact" variant={ctaVariant(station.index)} flow arrow="right" className="w-full justify-between">
        <CtaLabel count={count} />
      </Button>
    </div>
  )
}
