import { useRef } from 'react'
import { Check } from 'lucide-react'
import { engineering } from '../content/site'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'
import EngineeringStack, { LAYER_STEP_MS } from './EngineeringStack'
import { Eyebrow } from './ui'

// When the top layer has landed and the frame closes (layer landing is --dur-section, 750 ms).
const DONE_MS = (engineering.layers.length - 1) * LAYER_STEP_MS + 600

// MOTION §17: engineering capacity as a stack that assembles from the bottom up the first time it
// is fully on screen, then closes into one team; the "build with us" equation resolves after it.
// One boolean drives the section (data-state); CSS sequences the rest (EngineeringStack.css).
export default function EngineeringStrip() {
  const endRef = useRef(null)
  const reduced = useReducedMotion()
  // Observes the bottom of the stack, so the assembly starts once the whole stack is in view.
  const seen = useInView(endRef, { once: true, rootMargin: '0px 0px -8% 0px' })
  const [idea, team, outcome] = engineering.equation

  return (
    <section aria-labelledby="engineering-title" className="border-y border-line bg-surface">
      <div
        className="eng mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-[auto_1fr] lg:gap-x-20 lg:gap-y-10"
        data-state={reduced || seen ? 'built' : 'idle'}
        style={{ '--eng-done': `${DONE_MS}ms` }}
      >
        <div>
          <Eyebrow>{engineering.eyebrow}</Eyebrow>
          <h2 id="engineering-title" className="mt-4 max-w-md text-4xl leading-[1.1] md:text-5xl">
            {engineering.title}
          </h2>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <EngineeringStack />
          <span ref={endRef} aria-hidden="true" className="block h-px" />
        </div>

        {/* MOTION §17 "build with us": the operators are real text, so it reads as one sentence. */}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium lg:col-start-1 lg:row-start-2 lg:self-end lg:pb-6">
          <span className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-ink">{idea}</span>
          <span className="font-display text-xl text-muted">+</span>
          <span className="rounded-full bg-primary px-3.5 py-1.5 text-primaryInk">{team}</span>
          <span className="font-display text-xl text-muted">=</span>
          <span className="eng-outcome relative inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-ink">
            <Check aria-hidden="true" className="eng-check h-4 w-4 text-accent" strokeWidth={2.25} />
            {outcome}
          </span>
        </p>
      </div>
    </section>
  )
}
