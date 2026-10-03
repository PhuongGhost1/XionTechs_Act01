import { process as line } from '../../content/index.js'
import { useBrief } from '../../runtime/hooks.js'
import { cx } from '../../ui/cx.js'

// Step 1 (REQUEST): the visitor's own request is the first node. A mono line `YOUR BRIEF ( n )`
// and the services picked so far, or the empty state. The count is the live size of the brief
// store; polite live region so a change made elsewhere is announced.

const SHOWN = 5

export function BriefLine({ className }) {
  const { count, items } = useBrief()
  const shown = items.slice(0, SHOWN)
  const rest = items.length - shown.length
  return (
    <div className={cx('font-mono', className)} aria-live="polite">
      <p className="text-counter font-medium uppercase text-ink">{`${line.brief.label.text} ( ${count} )`}</p>
      {count > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-data uppercase text-ink2">
          {shown.map((item) => (
            <li key={`${item.kind}:${item.id}`}>{item.label}</li>
          ))}
          {rest > 0 && <li className="text-ink3">{`+ ${rest} ${line.brief.more.text}`}</li>}
        </ul>
      ) : (
        <p className="mt-2 text-data text-ink3">{line.brief.empty.text}</p>
      )}
    </div>
  )
}
