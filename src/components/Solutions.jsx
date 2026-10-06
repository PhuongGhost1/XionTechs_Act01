import { useReducer } from 'react'
import { solutions } from '../content/site'
import { useReducedMotion } from '../hooks/useReducedMotion'
import SolutionsBand from './SolutionsBand'
import { bandsReducer, initialBands } from './SolutionsMotion'
import { SectionHeader } from './ui'

const IDS = solutions.bands.map((b) => b.id)

// What We Build (MOTION §7): three horizontal capability bands, each with a small visual that
// plays once on entry and replays on hover or focus. One state machine for the section
// (SolutionsMotion.js) tracks the hot band and the replays.
export default function Solutions() {
  const reduced = useReducedMotion()
  const [state, dispatch] = useReducer(bandsReducer, IDS, initialBands)
  return (
    <section id="solutions" aria-labelledby="solutions-title" className="border-t border-line bg-surface/70">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <SectionHeader eyebrow={solutions.eyebrow} title={solutions.title} titleId="solutions-title" />

        <ol className="mt-16 border-t border-ink/15">
          {solutions.bands.map((b, i) => (
            <SolutionsBand
              key={b.id}
              band={b}
              index={i}
              hot={state.hot === b.id}
              quiet={state.hot !== null && state.hot !== b.id}
              run={state.runs[b.id]}
              reduced={reduced}
              dispatch={dispatch}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}
