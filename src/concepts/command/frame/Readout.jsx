import { frame } from '../content/index.js'
import { ATTR } from '../contract/attributes.js'
import { useHtmlAttribute, useReducedMotion, useTierReport } from '../runtime/hooks.js'
import { readoutValues } from '../runtime/readout.js'
import { cx } from '../ui/cx.js'

// RENDER SVG   QUALITY OFF   MOTION ON : the honest readout (doc 4.9, 9). The values are read
// from the page (the tier control, data-webgl, data-motion), never typed; a value that is not
// known yet shows N/A. Not a live region (doc 10.2: no chatter). Used by the dock (from lg) and
// by the menu panel, where `stacked` lists the rows and adds the reasons as plain text.
export default function Readout({ stacked = false, className }) {
  const { tier, reasons } = useTierReport()
  const webgl = useHtmlAttribute(ATTR.webgl)
  const motionOff = useReducedMotion()
  const v = readoutValues({ tier, webgl, motionOff })
  const r = frame.readout
  const word = (key) => (key === null ? r.na.text : r[key].text)
  const rows = [
    { id: 'render', label: r.render.text, value: word(v.render) },
    { id: 'quality', label: r.quality.text, value: word(v.quality) },
    { id: 'motion', label: r.motion.text, value: word(v.motion) },
  ]
  const why = reasons.length ? reasons.join(', ') : ''

  return (
    <dl
      aria-label={r.label.text}
      title={why}
      className={cx(
        'm-0 font-mono text-label uppercase',
        stacked ? 'flex flex-col gap-1' : 'flex items-center gap-x-4',
        className,
      )}
    >
      {rows.map((row) => (
        <div key={row.id} className="flex items-baseline gap-2">
          <dt className="text-ink3">{row.label}</dt>
          <dd className="m-0 text-ink">
            {row.value}
            {stacked && row.id === 'quality' && why && <span className="normal-case text-ink2"> ( {why} )</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
