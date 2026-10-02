import { useCallback, useEffect, useReducer, useRef } from 'react'
import { selectedWork } from '../content/site'
import { useInView } from '../hooks/useInView'
import { usePointer } from '../hooks/usePointer'
import { useReducedMotion } from '../hooks/useReducedMotion'
import ProductFrame from './ProductFrame'
import { StoryHeader } from './StoryHeader'
import { activeSpot, chipPlacement, pct, spotHandlers, spotlightInit, spotlightReducer } from './StoryMotion'

const story = selectedWork.staffxp
const ids = story.hotspots.map((h) => h.id)

// Timeline, once, when the canvas scrolls into view (MOTION §13, §22): the canvas fades in, the
// dashboard rises from depth, the sign-in screen slides out from behind it, the visible regions
// light one by one, and everything settles. Under five seconds and it stops, so no pause control.
const TOUR_START = 1300
const TOUR_STEP = 600

const rise = 'motion-safe:transition-[opacity,transform] motion-safe:duration-[900ms] motion-safe:ease-brand'
const drift = 'motion-safe:transition-transform motion-safe:duration-base motion-safe:ease-brand'

// Story 01, a product visual: a dark canvas (the product itself is dark) with the dashboard as
// the main layer and the sign-in screen floating in front of it in shallow CSS 3D (MOTION §14,
// §23). The dashboard never moves after it settles, so its text stays crisp; only the sign-in
// layer, the backdrop and the bezel's reflection follow the pointer, by a few px.
export default function StoryStaffxp() {
  const canvasRef = useRef(null)
  const reduced = useReducedMotion()
  const shown = useInView(canvasRef, { once: true, rootMargin: '0px 0px -20% 0px' }) || reduced
  const [spot, dispatch] = useReducer(spotlightReducer, spotlightInit)
  const active = activeSpot(spot, reduced ? [] : ids)
  const visitor = spot.preview != null || spot.pinned != null

  useEffect(() => {
    if (!shown || reduced) return
    const timers = ids.map((_, i) =>
      setTimeout(() => dispatch({ type: 'auto', index: i, yieldToUser: true }), TOUR_START + i * TOUR_STEP),
    )
    timers.push(setTimeout(() => dispatch({ type: 'auto', index: -1 }), TOUR_START + ids.length * TOUR_STEP))
    return () => timers.forEach(clearTimeout)
  }, [shown, reduced])

  const onPointer = useCallback((x, y) => {
    const el = canvasRef.current
    if (!el) return
    el.style.setProperty('--px', x.toFixed(3))
    el.style.setProperty('--py', y.toFixed(3))
  }, [])
  usePointer(canvasRef, onPointer, { enabled: shown && !reduced })

  // Hover and tap targets over the dashboard. Keyboard and screen reader users get the same
  // labels from the list below the screens, which drives the same highlight.
  const hotspots = (
    <div aria-hidden="true" className="absolute inset-0">
      {story.hotspots.map((h) => {
        const on = active === h.id
        const { align, inside } = chipPlacement(h.box)
        const { onPointerEnter, onPointerLeave, onClick } = spotHandlers(dispatch, h.id)
        return (
          <div
            key={h.id}
            className="absolute"
            style={{ left: pct(h.box.x), top: pct(h.box.y), width: pct(h.box.w), height: pct(h.box.h) }}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onClick={onClick}
          >
            {/* Dims the rest of the screen while the visitor points at this region. */}
            <span
              className={`absolute inset-0 rounded-lg shadow-[0_0_0_200vmax_rgb(var(--bg)/0.55)] motion-safe:transition-opacity motion-safe:duration-micro ${
                on && visitor ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <span
              className={`absolute inset-0 rounded-lg bg-accent/[0.06] ring-2 ring-accent motion-safe:transition-[opacity,transform] motion-safe:duration-micro motion-safe:ease-brand ${
                on ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-0'
              }`}
            />
            <span
              className={`absolute hidden whitespace-nowrap rounded-md bg-paper px-2 py-1 text-xs font-medium text-ink shadow-depth-2 ring-1 ring-accent/70 md:block ${
                align === 'right' ? 'right-1.5' : 'left-1.5'
              } ${inside ? 'top-1.5' : 'bottom-full mb-1.5'} motion-safe:transition-[opacity,transform] motion-safe:duration-micro motion-safe:ease-brand ${
                on ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
              }`}
            >
              {h.label}
            </span>
          </div>
        )
      })}
    </div>
  )

  return (
    <article id={story.id} aria-labelledby={`${story.id}-title`} className="mt-10 md:mt-14">
      <StoryHeader index={1} story={story} />

      <div className="mx-auto mt-12 max-w-7xl sm:px-6">
        <div
          ref={canvasRef}
          data-tone="dark"
          className={`relative overflow-hidden bg-paper px-4 pb-10 pt-10 sm:rounded-[2rem] sm:px-8 md:px-14 md:pb-14 md:pt-16 motion-safe:transition-opacity motion-safe:duration-section motion-safe:ease-brand ${
            shown ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -inset-6 opacity-60 [background-image:linear-gradient(rgb(var(--line))_1px,transparent_1px),linear-gradient(90deg,rgb(var(--line))_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] ${drift}`}
            style={{ transform: 'translate3d(calc(var(--px, 0) * -8px), calc(var(--py, 0) * -6px), 0)' }}
          />

          <div className="relative mx-auto max-w-[68rem] perspective-far">
            <div className="relative preserve-3d">
              <div
                className={`origin-bottom ${rise} ${
                  shown ? 'opacity-100 [transform:none]' : 'opacity-0 [transform:translate3d(0,48px,-160px)_rotateX(9deg)]'
                }`}
              >
                <ProductFrame screen={story.main} overlay={hotspots} />
              </div>

              <div
                className={`relative -mt-[6%] ml-[4%] w-[64%] md:absolute md:-bottom-[14%] md:-left-[5%] md:ml-0 md:mt-0 md:w-[30%] ${rise} motion-safe:delay-[350ms] ${
                  shown ? 'opacity-100 [transform:translate3d(0,0,40px)]' : 'opacity-0 [transform:translate3d(40%,-50%,-260px)]'
                }`}
              >
                <div className={drift} style={{ transform: 'translate3d(calc(var(--px, 0) * 12px), calc(var(--py, 0) * 8px), 0)' }}>
                  <ProductFrame screen={story.secondary} />
                </div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto mt-10 max-w-[68rem] md:mt-36">
            <p id={`${story.id}-spots`} className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {story.hotspotsTitle}
            </p>
            <ul aria-labelledby={`${story.id}-spots`} className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {story.hotspots.map((h) => {
                const on = active === h.id
                return (
                  <li key={h.id} className="border-t border-line">
                    <button
                      type="button"
                      aria-pressed={spot.pinned === h.id}
                      {...spotHandlers(dispatch, h.id)}
                      className="flex w-full min-w-0 items-center gap-3 py-3 text-left text-sm"
                    >
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 shrink-0 rounded-full motion-safe:transition-transform motion-safe:duration-micro ${
                          on ? 'scale-150 bg-accent' : 'bg-muted'
                        }`}
                      />
                      <span className={`min-w-0 ${on ? 'text-ink' : 'text-ink/80'}`}>{h.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </article>
  )
}
