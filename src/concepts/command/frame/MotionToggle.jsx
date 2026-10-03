import { frame } from '../content/index.js'
import { setMotion } from '../contract/attributes.js'
import { useReducedMotion } from '../runtime/hooks.js'
import { cx } from '../ui/cx.js'
import './frame.css'

// MOTION: ON | OFF (doc 7.2): one native button, aria-pressed means "motion is on". The visible
// state word is aria-hidden because aria-pressed already says it; the accessible name stays the
// constant word MOTION. It writes data-motion through contract/attributes.js and remembers the
// choice. It starts OFF when the OS asks for reduced motion; turning it ON is deliberate and wins.
// OFF stops the WebGL loop (tier control), every CSS animation and smooth scrolling (motion.css).
export default function MotionToggle({ className }) {
  const off = useReducedMotion()
  return (
    <button
      type="button"
      aria-pressed={!off}
      aria-label={frame.motion.label.text}
      onClick={() => setMotion(off ? 'on' : 'off', { persist: true })}
      className={cx(
        'inline-flex h-[44px] min-w-[44px] items-center gap-2 px-3 font-mono text-label uppercase text-ink2 transition-colors duration-ui ease-ui hover:text-ink motion-off:transition-none',
        className,
      )}
    >
      <span aria-hidden="true" className="text-ink3">
        {frame.motion.label.text}:
      </span>
      <span aria-hidden="true" className={cx('border-b pb-px', off ? 'border-dashed border-ink3' : 'border-ink')}>
        {off ? frame.motion.off.text : frame.motion.on.text}
      </span>
    </button>
  )
}
