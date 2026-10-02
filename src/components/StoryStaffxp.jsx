import { useRef } from 'react'
import { selectedWork } from '../content/site'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'
import ProductFrame from './ProductFrame'
import { StaffxpDashboardOutline, StaffxpSignInOutline } from './WorkOutlines'
import { StoryHeader } from './StoryHeader'

// Story 01: a dark, full-width product canvas (the product UI itself is dark). The dashboard
// scales into view and the sign-in screen slides out from behind it, once.
export default function StoryStaffxp() {
  const story = selectedWork.staffxp
  const canvasRef = useRef(null)
  const reduced = useReducedMotion()
  const inView = useInView(canvasRef, { once: true, threshold: 0.2 })
  const shown = inView || reduced
  const motion = 'motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out'

  return (
    <article id={story.id} aria-labelledby={`${story.id}-title`} className="mt-24">
      <StoryHeader index={1} story={story} />

      <div className="mx-auto mt-12 max-w-7xl sm:px-6">
        <div ref={canvasRef} data-tone="dark" className="relative overflow-hidden bg-paper px-5 pb-14 pt-12 sm:rounded-[2rem] md:px-14 md:pb-28 md:pt-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgb(var(--line))_1px,transparent_1px),linear-gradient(90deg,rgb(var(--line))_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
          />
          <div className="relative mx-auto max-w-5xl">
            <ProductFrame
              screen={story.main}
              outline={<StaffxpDashboardOutline />}
              className={`${motion} ${shown ? 'scale-100 opacity-100' : 'scale-[0.96] opacity-0'}`}
            />
            <ProductFrame
              screen={story.secondary}
              outline={<StaffxpSignInOutline />}
              className={`relative -mt-10 ml-auto w-2/3 md:absolute md:-bottom-16 md:-right-6 md:mt-0 md:w-[36%] ${motion} motion-safe:delay-200 ${
                shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
            />
          </div>
          {!story.main.src && <p className="relative mx-auto mt-8 max-w-5xl text-xs text-muted md:mt-24">{selectedWork.pendingNote}</p>}
        </div>
      </div>
    </article>
  )
}
