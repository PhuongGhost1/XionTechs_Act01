import { engineering } from '../content/site'
import { DraftMark } from './ui'
import './EngineeringStack.css'

// Delay between layers as the stack assembles, bottom (AI / Automation) first. The section sets
// --eng-done (when the frame closes) from the same numbers; see EngineeringStrip.
export const LAYER_STEP_MS = 110

// MOTION §17 stacked engineering layers (effect H, scroll assembly). Each layer rises from depth
// into a flat slab and its status dot lights as it lands; a frame then closes around the stack,
// captioned with the result. The motion is CSS only, keyed on the section's data-state; the
// assembled stack is the default, so reduced motion shows it at once (EngineeringStack.css).
export default function EngineeringStack() {
  const { layers, result } = engineering
  const n = layers.length
  return (
    <figure className="eng-stack relative rounded-2xl px-3 pb-3 pt-8 sm:px-5 sm:pb-5 sm:pt-9">
      <span aria-hidden="true" className="eng-frame pointer-events-none absolute inset-0 rounded-2xl border border-accent/50" />
      <figcaption className="eng-result absolute -top-2.5 left-4 bg-surface px-2 text-xs font-semibold uppercase leading-5 tracking-[0.14em] text-accent sm:left-6">
        {result}
      </figcaption>
      <ol className="perspective-far space-y-2.5">
        {layers.map((l, i) => (
          <li key={l.id} className="eng-layer" style={{ '--eng-delay': `${(n - 1 - i) * LAYER_STEP_MS}ms` }}>
            <div className="eng-slab flex flex-col gap-1 rounded-xl border border-line bg-paper px-4 py-3.5 sm:flex-row sm:items-center sm:gap-6 sm:px-5">
              <span className="flex min-w-0 shrink-0 items-center gap-3 font-medium text-ink">
                <span aria-hidden="true" className="eng-dot relative h-2 w-2 shrink-0 rounded-full bg-line" />
                {l.label}
                <DraftMark draft={l.draft} label="Confirm" />
              </span>
              {l.items && <span className="min-w-0 pl-5 text-sm text-muted sm:ml-auto sm:pl-0 sm:text-right">{l.items}</span>}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  )
}
