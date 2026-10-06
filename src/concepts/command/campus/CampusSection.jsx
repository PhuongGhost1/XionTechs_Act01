import { lazy, Suspense, useRef } from 'react'
import { useInView } from '../../../hooks/useInView'
import { campus } from '../content'
import { Reveal, SectionHead } from '../ui'

// Section 05, "Smart campus": the frame the page counts and links to (id `campus`). Only the heading and a
// reserved box live in the page's main chunk. The model, the panel and the simulation are one lazy chunk
// (CampusTwin.jsx) requested once the section is within a screen or two of the viewport. If that request
// fails (offline, a blocked file) the section says so instead of unmounting the page.
const CampusTwin = lazy(() =>
  import('./CampusTwin').catch(() => ({
    default: () => (
      <p className="border border-dashed border-cmd-faint p-6 text-cmd-muted">The campus model could not load. Reload the page to try again.</p>
    ),
  })),
)

function Reserved() {
  return <div aria-hidden="true" className="cmd-ticks min-h-[760px] border border-cmd-line lg:min-h-[800px]" />
}

export default function CampusSection() {
  const ref = useRef(null)
  const near = useInView(ref, { once: true, rootMargin: '1500px 0px' })
  return (
    <section ref={ref} id="campus" data-cmd-section aria-labelledby="campus-title" className="relative bg-cmd-bg py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <SectionHead index={campus.index} label={campus.label} title={campus.title} intro={campus.intro} titleId="campus-title" draft={campus.draft} />
        </Reveal>
        <div className="mt-12 lg:mt-16">
          {near ? (
            <Suspense fallback={<Reserved />}>
              <CampusTwin />
            </Suspense>
          ) : (
            <Reserved />
          )}
        </div>
      </div>
    </section>
  )
}
