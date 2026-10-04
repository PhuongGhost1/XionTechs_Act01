import { lazy, Suspense, useRef } from 'react'
import { useInView } from '../../../hooks/useInView'
import { flightPlan } from '../content'
import { Reveal, SectionHead } from '../ui'

// Section 05, "Flight plan": the frame the page counts and links to (id `agent`). Only the heading and a
// reserved box live in the page's main chunk. The plot, the controls and the demo's run logic are one lazy
// chunk (FlightPlan.jsx) that is requested once the section is within a screen or two of the viewport, so
// the first screen and the other sections never pay for them. If that request fails (offline, a blocked
// file) the section says so instead of unmounting the page.
const FlightPlan = lazy(() =>
  import('./FlightPlan').catch(() => ({
    default: () => (
      <p className="border border-dashed border-cmd-faint p-6 text-cmd-muted">The flight plan could not load. Reload the page to try again.</p>
    ),
  })),
)

function Reserved() {
  return <div aria-hidden="true" className="cmd-ticks min-h-[640px] border border-cmd-line sm:min-h-[1000px] lg:min-h-[1450px]" />
}

export default function FlightSection() {
  const ref = useRef(null)
  const near = useInView(ref, { once: true, rootMargin: '1500px 0px' })
  return (
    <section ref={ref} id="agent" data-cmd-section aria-labelledby="agent-title" className="relative bg-cmd-bg py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <SectionHead
            index={flightPlan.index}
            label={flightPlan.label}
            title={flightPlan.title}
            intro={flightPlan.intro}
            titleId="agent-title"
            draft={flightPlan.draft}
          />
        </Reveal>
        <div className="mt-12 lg:mt-16">
          {near ? (
            <Suspense fallback={<Reserved />}>
              <FlightPlan />
            </Suspense>
          ) : (
            <Reserved />
          )}
        </div>
      </div>
    </section>
  )
}
