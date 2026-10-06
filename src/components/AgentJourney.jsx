import { useMemo } from 'react'
import { Bot, FileText, RefreshCw, Sparkles } from 'lucide-react'
import { CHIP, JOURNEY_VIEW, PILL, TAG_H, cameraX, layoutJourney, totalLength, travelledLength } from '../workflow/journey'

const MOVE = 'transform 700ms ease'
const kindIcon = { resource: FileText, skill: Sparkles }

function Ring({ fill, compacting }) {
  const r = 8
  const c = 2 * Math.PI * r
  return (
    <g>
      <circle r={r} fill="none" strokeWidth="3" className="stroke-line" />
      {fill > 0 && (
        <circle
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          transform="rotate(-90)"
          className={compacting ? 'stroke-accent' : 'stroke-muted'}
          style={{ strokeDasharray: `${fill * c} ${c}`, transition: 'stroke-dasharray 600ms ease' }}
        />
      )}
    </g>
  )
}

function JourneyWindow({ journey, state }) {
  const L = useMemo(() => layoutJourney(journey), [journey])
  const p = L.points[state.stopIndex]
  const cam = cameraX(L, state.stopIndex)
  const total = totalLength(L)

  return (
    <svg viewBox={`0 0 ${JOURNEY_VIEW.w} ${JOURNEY_VIEW.h}`} className="block w-full" aria-hidden="true">
      <defs>
        <pattern id="aj-dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" className="fill-line" />
        </pattern>
      </defs>
      <g style={{ transform: `translateX(${-cam}px)`, transition: MOVE }}>
        <rect width={L.width} height={JOURNEY_VIEW.h} fill="url(#aj-dots)" />
        <path d={L.path} fill="none" strokeWidth="2" className="stroke-muted" />
        <path
          d={L.path}
          fill="none"
          strokeWidth="2"
          className="stroke-accent"
          strokeDasharray={total}
          strokeDashoffset={total - travelledLength(L, state.stopIndex)}
          style={{ transition: 'stroke-dashoffset 700ms ease' }}
        />

        {L.tags.map((t) => {
          const stop = journey.stops[t.stopIndex]
          const Icon = kindIcon[stop.kind]
          const lit = state.lit.has(t.stopIndex)
          const current = t.stopIndex === state.stopIndex && !state.done
          const pt = L.points[t.stopIndex]
          const stubTo = t.side === 'above' ? t.y + TAG_H / 2 : t.y - TAG_H / 2
          return (
            <g key={stop.label}>
              <line x1={pt.x} y1={pt.y} x2={pt.x} y2={stubTo} strokeWidth="1.5" className={lit ? 'stroke-accent' : 'stroke-muted'} />
              {current && (
                <rect x={t.x - t.w / 2 - 4} y={t.y - TAG_H / 2 - 4} width={t.w + 8} height={TAG_H + 8} rx="10" fill="none" strokeWidth="2" className="stroke-accent" opacity="0.4" />
              )}
              <rect x={t.x - t.w / 2} y={t.y - TAG_H / 2} width={t.w} height={TAG_H} rx="6" strokeWidth="1" className={`fill-paper ${lit ? 'stroke-accent' : 'stroke-muted'}`} />
              <Icon x={t.x - t.w / 2 + 8} y={t.y - 7} width="14" height="14" strokeWidth={1.75} className={lit ? 'text-accent' : 'text-muted'} />
              <text x={t.x - t.w / 2 + 28} y={t.y + 4} className={`font-mono text-xs ${lit ? 'fill-ink' : 'fill-muted'}`}>
                {stop.label}
              </text>
            </g>
          )
        })}

        <g style={{ transform: `translateX(${p.x}px)`, transition: MOVE }}>
         <g style={{ transform: `translateY(${p.y}px)`, transition: 'transform 250ms ease 225ms' }}>
          <rect x={-PILL.w / 2} y={-PILL.h / 2} width={PILL.w} height={PILL.h} rx={PILL.h / 2} className="fill-ink" />
          <Bot x={-PILL.w / 2 + 12} y={-8} width="16" height="16" strokeWidth={1.75} className="text-paper" />
          <text x={-PILL.w / 2 + 34} y="5" className="fill-paper text-sm font-semibold">XionTechs agent</text>

          <g transform={`translate(${-CHIP.w / 2}, ${CHIP.dy})`}>
            <rect width={CHIP.w} height={CHIP.h} rx={CHIP.h / 2} strokeWidth="1" className="fill-surface stroke-line" />
            <g transform={`translate(16, ${CHIP.h / 2})`}>
              <Ring fill={state.ringFill} compacting={state.compacting} />
            </g>
            <text x="32" y={CHIP.h / 2 + 4} className={`text-xs ${state.compacting ? 'fill-accent' : 'fill-ink'}`}>
              {state.status}
            </text>
          </g>
         </g>
        </g>
      </g>
    </svg>
  )
}

function JourneyList({ journey, state, className }) {
  return (
    <ol className={`space-y-2 border-l-2 border-line pl-4 ${className}`}>
      {journey.stops.map((s, i) => {
        if (s.kind === 'compact') {
          const reached = state.done || i < state.stopIndex
          const current = i === state.stopIndex && !state.done
          return (
            <li
              key={`compact-${i}`}
              aria-current={current ? 'step' : undefined}
              className={`flex items-center gap-2 py-1 text-xs font-medium uppercase tracking-wide ${current ? 'rounded-lg border border-accent bg-paper px-3 text-muted' : 'text-muted'}`}
            >
              <RefreshCw className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
              {reached ? 'Context compacted — continuing' : current && state.compacting ? 'Compacting context…' : 'Context check'}
            </li>
          )
        }
        const Icon = kindIcon[s.kind]
        const current = i === state.stopIndex && !state.done
        const lit = state.lit.has(i)
        return (
          <li
            key={s.label}
            aria-current={current ? 'step' : undefined}
            className={`rounded-lg border px-3 py-2 ${current ? 'border-accent bg-paper' : lit ? 'border-muted bg-paper' : 'border-line bg-paper'}`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <span className="font-mono text-xs text-ink">{s.label}</span>
              {lit && !current && <span className="ml-auto text-xs text-muted">done</span>}
            </div>
            <p className="mt-1 text-sm text-muted">{s.status}</p>
          </li>
        )
      })}
    </ol>
  )
}

// "Agent at work" view. AgentDemo owns the timer and passes the derived state.
// Under reduced motion the moving window is replaced by the readable list on every screen
// size (a scaled-to-fit path would shrink labels to an unreadable size).
export default function AgentJourney({ journey, state, reduced }) {
  return (
    <div>
      {!reduced && (
        <div className="hidden overflow-hidden rounded-xl border border-line bg-paper lg:block">
          <JourneyWindow journey={journey} state={state} />
        </div>
      )}
      <JourneyList journey={journey} state={state} className={reduced ? '' : 'lg:sr-only'} />
    </div>
  )
}
