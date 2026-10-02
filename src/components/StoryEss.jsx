import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { selectedWork } from '../content/site'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useScrollProgress } from '../hooks/useScrollProgress'
import ProductFrame from './ProductFrame'
import { StoryHeader } from './StoryHeader'
import { activeSpot, areaAtProgress, pct, spotHandlers, spotlightInit, spotlightReducer } from './StoryMotion'

const story = selectedWork.ess
const { areas } = story
const ids = areas.map((a) => a.id)
const modulesOf = (a) => (a.modules.length === 1 && a.modules[0] === a.label ? null : a.modules.join(' · '))

// Entrance, once (MOTION §15): the screen appears, then each annotation fades in and its
// connector draws, one after another.
const STAGGER = 140
const FIRST = 350
const delay = (i, extra = 0) => ({ transitionDelay: `${FIRST + i * STAGGER + extra}ms` })
const fade = 'motion-safe:transition-[opacity,transform] motion-safe:duration-base motion-safe:ease-brand'
const draw = 'motion-safe:transition-transform motion-safe:duration-base motion-safe:ease-brand'

// Below `sm` the screen scrolls sideways, so the scroll box must be reachable by keyboard.
const NARROW = '(max-width: 639.98px)'
function useNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia?.(NARROW)
    if (!mq) return
    const update = () => setNarrow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return narrow
}

// Number badge and text of one annotation, shared by the gutter labels and the list. The first
// row is 22px tall so a connector at 11px meets the badge's centre.
function AreaLabel({ area, n, on, reverse = false }) {
  const modules = modulesOf(area)
  return (
    <span className={`flex min-w-0 flex-1 items-start gap-2 ${reverse ? 'flex-row-reverse' : ''}`}>
      <span
        aria-hidden="true"
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums text-primaryInk motion-safe:transition-transform motion-safe:duration-micro ${
          on ? 'scale-110 bg-accent' : 'bg-primary'
        }`}
      >
        {n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-[22px] text-ink">{area.label}</span>
        {modules && <span className="block text-xs text-muted">{modules}</span>}
      </span>
    </span>
  )
}

// Story 02, an information-architecture visual (not a product hero, not a node graph): the
// portal screen is the central surface, numbered labels sit in the gutters beside it, and thin
// connectors run to the edge of each module they name. The highlighted area follows the scroll
// position, and a label's hover, focus or click takes over.
export default function StoryEss() {
  const figRef = useRef(null)
  const lastRef = useRef(-1)
  const reduced = useReducedMotion()
  const narrow = useNarrow()
  const shown = useInView(figRef, { once: true, rootMargin: '0px 0px -20% 0px' }) || reduced
  const [spot, dispatch] = useReducer(spotlightReducer, spotlightInit)
  const active = activeSpot(spot, reduced ? [] : ids)
  const pending = !story.screen.src

  const onProgress = useCallback((p) => {
    const i = areaAtProgress(p, ids.length)
    if (i === lastRef.current) return
    lastRef.current = i
    dispatch({ type: 'auto', index: i })
  }, [])
  useScrollProgress(figRef, onProgress, { enabled: shown && !reduced })

  const overlay = (
    <div data-tone="dark" aria-hidden="true" className="absolute inset-0">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {areas.map((a) => {
          const on = active === a.id
          const { onPointerEnter, onPointerLeave, onClick } = spotHandlers(dispatch, a.id)
          return (
            <g key={a.id} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} onClick={onClick}>
              {a.regions.map((r) => (
                <rect
                  key={`${r.x}-${r.y}`}
                  x={pct(r.x)}
                  y={pct(r.y)}
                  width={pct(r.w)}
                  height={pct(r.h)}
                  rx="6"
                  strokeWidth="1.5"
                  className={`fill-accent/10 stroke-accent motion-safe:transition-opacity motion-safe:duration-base ${on ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
            </g>
          )
        })}
        {/* Connectors from the gutter labels, wide screens only. */}
        <g className="hidden xl:inline">
          {areas.map((a, i) => {
            const on = active === a.id
            const { x, y } = a.marker
            return (
              <g key={a.id}>
                <line
                  x1={a.side === 'left' ? '0%' : '100%'}
                  y1={pct(y)}
                  x2={pct(x)}
                  y2={pct(y)}
                  strokeWidth="1"
                  className={`${on ? 'stroke-accent' : 'stroke-ink/60'} ${draw}`}
                  style={{
                    transformBox: 'fill-box',
                    transformOrigin: a.side === 'left' ? 'left center' : 'right center',
                    transform: shown ? 'none' : 'scaleX(0)',
                    ...delay(i, 260),
                  }}
                />
                <circle
                  cx={pct(x)}
                  cy={pct(y)}
                  r="3.5"
                  className={`${on ? 'fill-accent' : 'fill-ink'} motion-safe:transition-opacity motion-safe:duration-micro ${shown ? 'opacity-100' : 'opacity-0'}`}
                  style={delay(i, 420)}
                />
              </g>
            )
          })}
        </g>
      </svg>
      {/* Numbered markers on the screen where the labels sit below it instead of beside it. */}
      {areas.map((a, i) => (
        <span
          key={a.id}
          className={`absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums text-primaryInk shadow-depth-2 xl:hidden ${
            active === a.id ? 'bg-ink' : 'bg-primary'
          }`}
          style={{ left: pct(a.marker.x), top: pct(a.marker.y) }}
        >
          {i + 1}
        </span>
      ))}
    </div>
  )

  return (
    <article id={story.id} aria-labelledby={`${story.id}-title`} className="mt-10 md:mt-14">
      <StoryHeader index={2} story={story} />

      <div className="mx-auto mt-12 max-w-7xl px-6">
        <div className="rounded-[2rem] border border-line bg-surface/70 p-3 [background-image:linear-gradient(rgb(var(--line)/0.6)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--line)/0.6)_1px,transparent_1px)] [background-size:24px_24px] sm:p-6 xl:px-4 xl:py-14">
          <div
            ref={figRef}
            className={`relative xl:mx-56 motion-safe:transition-[opacity,transform] motion-safe:duration-section motion-safe:ease-brand ${
              shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {!pending && (
              <ol aria-label={story.areasTitle} className="hidden xl:block">
                {areas.map((a, i) => {
                  const on = active === a.id
                  const left = a.side === 'left'
                  return (
                    <li key={a.id} className={`absolute w-56 -translate-y-[11px] ${left ? 'right-full' : 'left-full'}`} style={{ top: pct(a.marker.y) }}>
                      <button
                        type="button"
                        aria-pressed={spot.pinned === a.id}
                        {...spotHandlers(dispatch, a.id)}
                        className={`flex w-full items-start gap-2 ${left ? 'flex-row-reverse text-right' : 'text-left'}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-[10.5px] h-px w-4 shrink-0 ${left ? 'origin-right' : 'origin-left'} ${on ? 'bg-accent' : 'bg-ink/40'} ${draw}`}
                          style={{ transform: shown ? 'none' : 'scaleX(0)', ...delay(i, 120) }}
                        />
                        <span
                          className={`flex min-w-0 flex-1 ${fade} ${shown ? 'translate-x-0 opacity-100' : `opacity-0 ${left ? 'translate-x-2' : '-translate-x-2'}`}`}
                          style={delay(i)}
                        >
                          <AreaLabel area={a} n={i + 1} on={on} reverse={left} />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}

            <div
              className="-mx-1 overflow-x-auto px-1 pb-2 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0"
              {...(narrow ? { tabIndex: 0, role: 'region', 'aria-label': story.scrollHint } : {})}
            >
              <div className="min-w-[35rem] sm:min-w-0">
                <ProductFrame screen={story.screen} variant="flat" overlay={overlay} />
              </div>
            </div>
            {!pending && <p className="mt-2 text-xs text-muted sm:hidden">{story.scrollHint}</p>}
          </div>

          <div className={pending ? '' : 'xl:hidden'}>
            <p id={`${story.id}-areas`} className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {story.areasTitle}
            </p>
            <ol aria-labelledby={`${story.id}-areas`} className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((a, i) => (
                <li key={a.id} className={`border-t border-line ${fade} ${shown ? 'opacity-100' : 'opacity-0'}`} style={delay(i)}>
                  <button
                    type="button"
                    aria-pressed={spot.pinned === a.id}
                    {...spotHandlers(dispatch, a.id)}
                    className={`flex w-full px-2 py-3 text-left ${active === a.id ? 'bg-primarySoft/60' : ''}`}
                  >
                    <AreaLabel area={a} n={i + 1} on={active === a.id} />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </article>
  )
}
