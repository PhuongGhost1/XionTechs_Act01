import { frame } from '../content/index.js'
import { setMotion } from '../contract/attributes.js'
import { useReducedMotion } from '../runtime/hooks.js'

// STUB (WP1 replaces this file). A working MOTION: ON | OFF switch (doc 7.2): aria-pressed,
// writes data-motion through contract/attributes.js and remembers the choice (try/catch inside).
// It starts off when the OS asks for reduced motion; a visitor can turn it on deliberately.
export default function MotionToggle() {
  const off = useReducedMotion()
  return (
    <button
      type="button"
      aria-pressed={!off}
      onClick={() => setMotion(off ? 'on' : 'off', { persist: true })}
      className="inline-flex h-11 min-w-11 items-center gap-2 px-3 font-mono text-label uppercase text-ink2 hover:text-ink"
    >
      <span className="text-ink3">{frame.motion.label.text}:</span>
      <span>{off ? frame.motion.off.text : frame.motion.on.text}</span>
    </button>
  )
}
