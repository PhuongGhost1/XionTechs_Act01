import { useRef } from 'react'
import { Check } from 'lucide-react'
import { finalCta } from '../../../content/site'
import { useInView } from '../../../hooks/useInView'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import './FinalCompletion.css'

// Time between steps lighting up along the line.
const STEP_MS = 380

// MOTION §21 closing brand animation (effects A, B, J), played once as the visitor reaches the
// bottom: Request → Build → Automate → Done light up in sequence along a line, then the slogan
// appears and the gold "Done" settles into place from just in front of the page (a small depth
// treatment, §23). Under three seconds, no loop. One boolean drives it (data-state); CSS does
// the sequencing (FinalCompletion.css). The step labels and the slogan are real text and always
// in the page; only the lights and the slogan's entrance animate. Reduced motion: finished state.
export default function FinalCompletion() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const seen = useInView(ref, { once: true, rootMargin: '0px 0px -18% 0px' })
  const { completion: steps, slogan } = finalCta
  const last = steps.length - 1
  const [get, it, done] = slogan

  return (
    <div
      ref={ref}
      className="fc text-center"
      data-state={reduced || seen ? 'done' : 'idle'}
      style={{ '--n': steps.length, '--fc-step': `${STEP_MS}ms` }}
    >
      <div className="relative mx-auto max-w-2xl">
        <span aria-hidden="true" className="fc-track">
          <span className="fc-fill" />
        </span>
        <ol aria-label={finalCta.completionLabel} className="fc-steps relative grid">
          {steps.map((s, i) => (
            <li key={s} className="flex flex-col items-center" style={{ '--i': i }}>
              <span aria-hidden="true" className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-line bg-paper">
                {i === last ? (
                  <>
                    <span className="fc-pulse absolute -inset-0.5 rounded-full border-2 border-accent" />
                    <span className="fc-lit absolute -inset-0.5 flex items-center justify-center rounded-full bg-accent text-primaryInk">
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="fc-lit absolute -inset-0.5 rounded-full border-2 border-accent" />
                    <span className="fc-lit h-2 w-2 rounded-full bg-accent" />
                  </>
                )}
              </span>
              <span className={`mt-3 text-xs font-semibold uppercase tracking-[0.14em] ${i === last ? 'text-accent' : 'text-muted'}`}>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="fc-slogan mt-12 font-display text-5xl leading-none tracking-tight sm:text-7xl md:mt-14 md:text-8xl lg:text-9xl">
        <span className="fc-word" style={{ '--w': 0 }}>
          {get}
        </span>{' '}
        <span className="fc-word" style={{ '--w': 1 }}>
          {it}
        </span>{' '}
        <span className="fc-done text-accent">{done}</span>
      </p>
    </div>
  )
}
