import { displayName } from '../../content/index.js'
import { Chip } from '../../ui/Chip.jsx'
import { EvidenceDot } from '../../ui/Evidence.jsx'
import { Label } from '../../ui/Label.jsx'
import Arrow from './Arrow.jsx'

// DEP-003 (doc 8.6): no screenshot, a dashed hairline row with a hatched node. It is the third
// proof point and is never presented as delivered work: the ILLUSTRATIVE chip and the sentence
// say so on every visit. The link goes to the main page's agent demo; it preloads nothing.
export default function DemoRow({ record, index }) {
  const link = record.link
  return (
    <article className="of-demo" aria-labelledby="of-demo-title">
      <EvidenceDot kind="illustrative" size={16} className="of-demo__node text-ink2" />
      <div className="of-demo__id">
        <Label>
          04.{index + 1} / {record.code.text}
        </Label>
        <h3 id="of-demo-title" className="font-mono text-body font-medium uppercase text-ink">
          {displayName(record)}
        </h3>
      </div>
      <Chip kind="illustrative" className="of-demo__chip" />
      <p className="of-demo__sentence text-ink2">{record.sentence.text}</p>
      <a className="of-link group" href={link.href}>
        <span>{link.text}</span>
        <Arrow />
      </a>
    </article>
  )
}

