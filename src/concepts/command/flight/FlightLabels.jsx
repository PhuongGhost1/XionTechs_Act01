import { memo } from 'react'
import { flightPlan } from '../content'
import { createFlatView } from './flat2d'
import { journeyNodeStatus, planNodeStatus } from './model'

// The labels of the plot are HTML: crisp mono, selectable, read in flight order by assistive
// technology. In the 3D plot the scene writes each label's CSS transform every frame (camera.js
// projectPoint); in the flat drawing React writes it once from the same layout. Nothing here changes
// per frame. On a narrow stage a label is only its flight number; the full names are in the readout.

const CHIP_TONE = {
  signal: 'border-cmd-signal text-cmd-signal-fg',
  danger: 'border-cmd-danger text-cmd-danger',
  ok: 'border-cmd-ok text-cmd-ok',
  muted: 'border-cmd-faint text-cmd-muted',
}

function chipFor(status, run, copy) {
  switch (status) {
    case 'working': return { text: copy.chip.working, tone: 'signal' }
    case 'waiting': return { text: copy.chip.waiting, tone: 'signal' }
    case 'failing': return { text: run?.fault ?? copy.chip.problem, tone: 'danger' }
    case 'retrying': return { text: copy.chip.retrying, tone: 'danger' }
    case 'recovered': return { text: copy.chip.recovered, tone: 'ok' }
    case 'retried': return { text: copy.chip.retried, tone: 'muted' }
    default: return null
  }
}

const Label = memo(function Label({ node, status, chip, compact, transform, labelRef }) {
  const kind = node.kind === 'outcome' && node.abort ? flightPlan.kinds.abort : flightPlan.kinds[node.kind]
  const title = node.title ?? flightPlan.kinds.compact
  return (
    <li
      ref={labelRef}
      data-fp-node={node.id}
      data-status={status}
      data-side={node.x < -0.1 ? 'left' : 'right'}
      data-compact={compact ? 'true' : 'false'}
      className="fp-label"
      style={transform ? { transform } : undefined}
    >
      {compact ? (
        <span className="fp-label__box fp-label__num">
          <span aria-hidden="true">{node.num}</span>
          <span className="sr-only">
            {node.num} {kind}, {title}
            {chip ? `, ${chip.text}` : ''}
          </span>
        </span>
      ) : (
        <span className="fp-label__box">
          <span className="fp-chips flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="cmd-label !text-[10.5px] text-cmd-faint">
              <span aria-hidden="true" className="text-cmd-signal-fg">
                {node.num}
              </span>{' '}
              <span className="sr-only">{node.num} </span>
              {kind}
            </span>
            {node.capability && (
              <span
                title={flightPlan.capabilityNote}
                className="cmd-label border border-dashed border-cmd-faint px-1 py-px !text-[10px] text-cmd-muted"
              >
                {node.capability}
              </span>
            )}
          </span>
          <span className="fp-label__title block font-cmd-mono text-[12px] leading-snug">{title}</span>
          {chip && (
            <span className="fp-chips mt-1 flex">
              <span className={`cmd-label border px-1 py-px !text-[10px] ${CHIP_TONE[chip.tone]}`}>{chip.text}</span>
            </span>
          )}
        </span>
      )}
    </li>
  )
})

export default function FlightLabels({ model, demo, size, three, compact, labelRef }) {
  const { project } = createFlatView(model.frame, size)
  const nodes = [...model.nodes].sort((a, b) => a.num.localeCompare(b.num))
  return (
    <ol aria-label={model.view === 'journey' ? flightPlan.readout.stops : flightPlan.readout.path} className="fp-labels absolute inset-0 m-0 list-none p-0">
      {nodes.map((n) => {
        const status = model.view === 'journey' ? journeyNodeStatus(Number(n.id.slice(5)), demo.jState) : planNodeStatus(n.id, demo.run, demo.state)
        const chip = model.view === 'journey' ? null : chipFor(status, demo.run, demo.copy)
        let transform
        if (!three) {
          const p = project(n.pos)
          transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`
        }
        return <Label key={n.id} node={n} status={status} chip={chip} compact={compact} transform={transform} labelRef={labelRef(n.id)} />
      })}
    </ol>
  )
}
