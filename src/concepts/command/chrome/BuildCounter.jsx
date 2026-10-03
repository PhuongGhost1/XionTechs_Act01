import { useStore } from '../hooks/index.js'
import { Mono } from '../ui/index.jsx'

// BRIEF §14 micro-interaction 4: a small number that ticks as sections activate. It counts the
// sections the visitor has reached, nothing more. It sits in the header bar; decorative, so hidden
// from assistive tech.
export default function BuildCounter({ className = '' }) {
  const n = useStore((s) => s.sectionsSeen.length)
  return (
    <Mono className={`border-l border-x-line pl-4 text-x-mute ${className}`} aria-hidden="true">
      Build <span className="tabular text-x-signal">{String(n).padStart(3, '0')}</span>
    </Mono>
  )
}
