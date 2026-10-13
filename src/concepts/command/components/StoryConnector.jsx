import { useRef } from 'react'
import { useInView } from '../../../hooks/useInView'
import { useReducedMotion } from '../../../hooks/useReducedMotion'

// MOTION §16: a horizontal connector between proof stories (AI → StaffXP → ESS), so AI capability
// and software engineering read as one system. The path draws once as it enters the viewport and
// the destination node lights when the line arrives. Decorative: the proof index above says the
// same in text. On narrow screens the two labels move under the line so nothing overflows.
export function StoryConnector({ from, to, className = '' }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const drawn = useInView(ref, { once: true, rootMargin: '0px 0px -15% 0px' }) || reduced

  return (
    <div ref={ref} aria-hidden="true" className={`mx-auto max-w-6xl px-6 text-xs font-medium ${className}`}>
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 shrink-0 rounded-full border border-muted" />
        <span className="hidden shrink-0 text-muted sm:inline">{from}</span>
        <svg className="h-2 min-w-6 flex-1 overflow-visible">
          <line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="1" className="stroke-line" />
          <line
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
            strokeWidth="1.5"
            className="stroke-accent motion-safe:transition-transform motion-safe:duration-[900ms] motion-safe:ease-brand"
            style={{ transformBox: 'fill-box', transformOrigin: 'left center', transform: drawn ? 'none' : 'scaleX(0)' }}
          />
        </svg>
        <span className="hidden shrink-0 text-ink sm:inline">{to}</span>
        <span className="relative h-2.5 w-2.5 shrink-0 rounded-full border border-accent">
          <span
            className={`absolute inset-0 rounded-full bg-accent motion-safe:transition-[opacity,transform] motion-safe:delay-[800ms] motion-safe:duration-micro motion-safe:ease-spring ${
              drawn ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          />
        </span>
      </div>
      <div className="mt-2 flex justify-between gap-4 sm:hidden">
        <span className="text-muted">{from}</span>
        <span className="text-right text-ink">{to}</span>
      </div>
    </div>
  )
}
