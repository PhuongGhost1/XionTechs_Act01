import { useEffect, useRef } from 'react'
import { useInView } from '../hooks/useInView'
import { loadAgentDemo } from './agentDemoLoader'
import { iconMap } from './icons'
import SolutionsVisual from './SolutionsVisual'
import { visualMode } from './SolutionsMotion'
import { TextLink } from './ui'

// A hover or focus right after the visual starts its entrance would cut the entrance short,
// so replays wait until it has had time to finish.
const ENTER_GUARD_MS = 1400

// One horizontal capability band (MOTION §7). Hover or keyboard focus makes it the section's
// "hot" band: its visual lifts slightly, its line activates and the visual replays once; the
// other bands' visuals and icons go quieter. Body text is never dimmed.
export default function SolutionsBand({ band, index, hot, quiet, run, reduced, dispatch }) {
  const visualRef = useRef(null)
  const seen = useInView(visualRef, { once: true, threshold: 0.5 })
  const playedAt = useRef(0)
  useEffect(() => {
    if (seen) playedAt.current = performance.now()
  }, [seen])

  const enter = () => {
    const replay = !reduced && playedAt.current > 0 && performance.now() - playedAt.current > ENTER_GUARD_MS
    dispatch({ type: 'enter', id: band.id, replay })
  }
  const leave = () => dispatch({ type: 'leave', id: band.id })

  const Icon = iconMap[band.icon]
  const preload = band.link?.preloadDemo ? loadAgentDemo : undefined
  const fade = 'transition-opacity duration-base ease-brand motion-reduce:transition-none'

  return (
    <li
      onPointerEnter={(e) => e.pointerType !== 'touch' && enter()}
      onPointerLeave={(e) => e.pointerType !== 'touch' && leave()}
      onFocus={enter}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) leave()
      }}
      className="relative grid grid-cols-1 gap-6 border-b border-line py-10 md:grid-cols-12 md:gap-8 md:py-12"
    >
      <div className="flex items-start gap-5 md:col-span-6 lg:col-span-3">
        <span className="pt-1 text-sm font-medium tabular-nums text-muted">{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0">
          <span
            className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-line text-accent ${fade} ${
              quiet ? 'opacity-60' : ''
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute -inset-px rounded-full border border-accent transition-opacity duration-micro ease-brand motion-reduce:transition-none ${
                hot ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {Icon && <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />}
          </span>
          <h3 className="mt-5 font-display text-3xl">{band.title}</h3>
        </div>
      </div>

      <div className="md:col-span-6 lg:col-span-3 lg:col-start-10 lg:row-start-1">
        <div
          ref={visualRef}
          className={`relative w-full max-w-sm transition-[opacity,transform] duration-base ease-brand motion-reduce:transition-none md:ml-auto md:max-w-xs lg:max-w-none ${
            quiet ? 'opacity-60' : ''
          } ${hot && !reduced ? 'scale-[1.03]' : ''}`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 rounded-xl shadow-depth-2 ${fade} ${hot ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="relative aspect-[8/5] overflow-hidden rounded-xl border border-line bg-paper bg-[radial-gradient(rgb(var(--line))_1px,transparent_1px)] bg-[length:14px_14px] shadow-depth-1">
            <SolutionsVisual key={run} visual={band.visual} mode={visualMode({ reduced, seen, run })} hot={hot} />
          </div>
        </div>
      </div>

      <p className="text-pretty text-lg text-ink/80 md:col-span-6 lg:col-span-3">{band.desc}</p>

      <div className="md:col-span-6 lg:col-span-3">
        <ul className="space-y-2.5">
          {band.examples.map((e) => (
            <li key={e} className="flex items-center gap-3 text-sm text-muted">
              <span aria-hidden="true" className="h-px w-4 shrink-0 bg-accent" />
              {e}
            </li>
          ))}
        </ul>
        {band.link && (
          <div className="mt-6">
            <TextLink href={band.link.href} onPointerEnter={preload} onFocus={preload}>
              {band.link.label}
            </TextLink>
          </div>
        )}
      </div>

      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 -bottom-px h-px origin-left bg-accent transition-transform duration-base ease-brand motion-reduce:transition-none ${
          hot ? 'scale-x-100' : 'scale-x-0'
        }`}
      />
    </li>
  )
}
