import { chips, work } from '../content.js'
import Chip from '../ui/Chip.jsx'
import Dimension from '../ui/Dimension.jsx'
import { useMedia } from '../hooks/hooks.js'
import AgentFlow from './AgentFlow.jsx'
import { WIDE_QUERY, layouts, nodeOf } from './agentGraph.js'
import { Frame, PendingBox, Plate, Spec, SpecRow } from './Spec.jsx'
import { copy } from './copy.js'

const { agents, fields } = work
const tall = layouts.tall
const DIM = { top: nodeOf(tall, 'request').y, bottom: nodeOf(tall, 'done').y + nodeOf(tall, 'done').h }

// Project 2 is an illustrative scenario, never a client project: the chip, the dashed linework, the figure
// caption and the Outcome row all say so.
export default function Agents() {
  const wide = useMedia(WIDE_QUERY)
  return (
    <Plate
      id={agents.id}
      code={agents.code}
      name={agents.name}
      eyebrow={agents.eyebrow}
      title={agents.title}
      status={<Chip kind="illustrative">{chips.illustrative}</Chip>}
    >
      <Spec>
        <SpecRow label={fields.problem}>{agents.problem}</SpecRow>
        <SpecRow label={fields.architecture}>{agents.architectureNote}</SpecRow>
        <SpecRow label={fields.technology}>
          <Chip kind="illustrative">{work.techPending}</Chip>
        </SpecRow>
        <SpecRow label={fields.outcome}>
          <PendingBox>{agents.outcome}</PendingBox>
        </SpecRow>
      </Spec>
      <Frame
        fig={copy.agents.fig}
        title={copy.agents.figTitle}
        chip={<Chip kind="illustrative">{chips.illustrative}</Chip>}
        note={agents.note}
        className="max-sm:-mx-5"
      >
        {wide ? (
          <>
            <AgentFlow />
            <div className="mx-auto mt-6 max-w-[43.75rem]">
              <Dimension axis="x" label={copy.agents.dimension} delay={1800} />
            </div>
          </>
        ) : (
          <div className="relative mx-auto max-w-[24rem]">
            <AgentFlow />
            {/* The vertical dimension rides in the empty left margin of the drawing, from the top of the first node to the foot of the last. */}
            <div
              className="absolute left-1 w-[22px]"
              style={{ top: `${(DIM.top / tall.h) * 100}%`, height: `${((DIM.bottom - DIM.top) / tall.h) * 100}%` }}
            >
              <Dimension axis="y" label={copy.agents.dimension} delay={1800} />
            </div>
          </div>
        )}
      </Frame>
    </Plate>
  )
}
