import { useState } from 'react'
import { chips, work } from '../content.js'
import Chip from '../ui/Chip.jsx'
import Dimension from '../ui/Dimension.jsx'
import { useMedia } from '../hooks/hooks.js'
import { Frame, PendingBox, Plate, Spec, SpecRow } from './Spec.jsx'
import { GUTTER, figureAspect, leaderOf, veilPath } from './essGeometry.js'
import { copy } from './copy.js'

const { ess, fields } = work
const no = (i) => String(i + 1).padStart(2, '0')

/**
 * Which area is lit. Hovering or focusing a list entry, or hovering its label or region on the screen, lights
 * it everywhere; a click pins it (the only path on touch). Focus is the keyboard equivalent of hover.
 */
function useActiveArea() {
  const [hover, setHover] = useState(null)
  const [focus, setFocus] = useState(null)
  const [pinned, setPinned] = useState(null)
  return {
    active: hover ?? focus ?? pinned,
    pinned,
    pointer: (id) => ({ onMouseEnter: () => setHover(id), onMouseLeave: () => setHover(null) }),
    focus: (id) => ({ onFocus: () => setFocus(id), onBlur: () => setFocus(null) }),
    toggle: (id) => setPinned((p) => (p === id ? null : id)),
  }
}

function AreaList({ state }) {
  return (
    <>
      <p className="text-[0.9375rem] leading-snug text-bp-mute">{ess.architectureNote}</p>
      <ol aria-label={ess.areasTitle} className="mt-4 border-t border-bp-line">
        {ess.areas.map((a, i) => (
          <li
            key={a.id}
            data-on={state.active === a.id}
            className="wk-area border-b border-bp-rule data-[on=true]:bg-bp-bg2"
            {...state.pointer(a.id)}
          >
            <button
              type="button"
              aria-pressed={state.pinned === a.id}
              onClick={() => state.toggle(a.id)}
              className="wk-area__btn grid w-full grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 px-3 py-3 text-left"
              {...state.focus(a.id)}
            >
              <span className="wk-badge wk-badge--list bp-mono" data-on={state.active === a.id}>
                {no(i)}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-semibold leading-snug text-bp-text">{a.label}</span>
                <span className="mt-0.5 block text-[0.875rem] leading-snug text-bp-mute">{a.modules.join(' · ')}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="bp-mono mt-3 text-bp-mute">{copy.ess.hint}</p>
    </>
  )
}

/** The real, sanitized screenshot with the six areas drawn on it as numbered callouts. */
function Annotated({ state, g }) {
  const { screen, areas } = ess
  return (
    <>
      <div className="relative w-full" style={{ aspectRatio: figureAspect(screen, g) }}>
        <div className="absolute inset-y-0 outline outline-1 outline-bp-line" style={{ left: `${g}%`, right: `${g}%` }}>
          <img
            src={screen.src}
            alt={screen.alt}
            width={screen.width}
            height={screen.height}
            loading="lazy"
            decoding="async"
            className="block h-full w-full"
          />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false" className="wk-veil">
            {areas.map((a) => (
              <path key={a.id} d={veilPath(a.regions)} fillRule="evenodd" data-on={state.active === a.id} />
            ))}
          </svg>
          {areas.map((a) =>
            a.regions.map((q, i) => (
              <div
                key={`${a.id}-${i}`}
                aria-hidden="true"
                data-on={state.active === a.id}
                className="wk-region"
                style={{ left: `${q.x}%`, top: `${q.y}%`, width: `${q.w}%`, height: `${q.h}%` }}
                {...state.pointer(a.id)}
                onClick={() => state.toggle(a.id)}
              />
            )),
          )}
        </div>
        {areas.map((a, i) => {
          const l = leaderOf(a, g)
          const on = state.active === a.id
          const d = `${500 + i * 130}ms`
          return (
            <div key={a.id} aria-hidden="true">
              <span
                className="wk-leader bg-bp-line"
                data-on={on}
                style={{ left: `${l.gutter.left}%`, width: `${l.gutter.width}%`, top: `${l.y}%`, transformOrigin: `${l.origin} center`, '--d': d }}
              />
              <span
                className="wk-leader bg-bp-bg"
                data-on={on}
                style={{ left: `${l.image.left}%`, width: `${l.image.width}%`, top: `${l.y}%`, transformOrigin: `${l.origin} center`, '--d': d }}
              />
              <span className="wk-marker bp-fade" style={{ left: `${l.markerX}%`, top: `${l.y}%`, '--nudge': a.side === 'right' ? '5px' : '-5px', '--d': `${900 + i * 130}ms` }} />
              <span
                className="wk-badge wk-badge--fig bp-mono bp-fade"
                data-on={on}
                style={{ left: `${l.labelX}%`, top: `${l.y}%`, '--d': `${300 + i * 130}ms` }}
                {...state.pointer(a.id)}
                onClick={() => state.toggle(a.id)}
              >
                {no(i)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-6" style={{ marginLeft: `${g}%`, marginRight: `${g}%` }}>
        <Dimension axis="x" measure delay={900} />
      </div>
    </>
  )
}

export default function Ess() {
  const state = useActiveArea()
  const wide = useMedia('(min-width: 768px)')
  const g = wide ? GUTTER.wide : GUTTER.narrow
  return (
    <Plate
      id={ess.id}
      code={ess.code}
      name={ess.name}
      eyebrow={ess.eyebrow}
      title={ess.title}
      status={<Chip kind="confirmed">{chips.confirmed}</Chip>}
    >
      <Spec>
        <SpecRow label={fields.problem}>{ess.problem}</SpecRow>
        <SpecRow label={fields.architecture}>
          <AreaList state={state} />
        </SpecRow>
        <SpecRow label={fields.technology}>
          <Chip kind="illustrative">{work.techPending}</Chip>
        </SpecRow>
        <SpecRow label={fields.outcome}>
          <PendingBox>{work.outcomePending}</PendingBox>
        </SpecRow>
      </Spec>
      <Frame fig={copy.ess.fig} title={copy.ess.figTitle} note={copy.ess.sampleNote} className="max-sm:-mx-5 max-[1199px]:order-first">
        <Annotated state={state} g={g} />
      </Frame>
    </Plate>
  )
}
