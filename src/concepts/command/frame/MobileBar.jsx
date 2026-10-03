import { frame } from '../content/index.js'
import { Button } from '../ui/Button.jsx'
import { useBrief } from '../runtime/hooks.js'

// STUB (WP1 replaces this file). The fixed bottom CTA bar on phones (56 px plus safe area),
// hidden from md up. WP1 hides it while the composer is in view and decides how it stacks with
// the dock. data-fixed-cta lets RAW take it out of the fixed layer.
export default function MobileBar() {
  const { count } = useBrief()
  return (
    <div
      data-fixed-cta=""
      className="fixed inset-x-0 bottom-dock z-30 flex h-14 items-center bg-ground px-[var(--margin-x)] md:hidden"
    >
      <Button href="#contact" flow className="w-full justify-between">
        {frame.cta.text}
        {count > 0 ? ` ( ${count} )` : ''}
      </Button>
    </div>
  )
}
