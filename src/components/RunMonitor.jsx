import { useEffect, useState } from 'react'
import { CheckCircle2, Flag, RotateCw } from 'lucide-react'
import { runLog, sections } from '../content/site'
import { visibleRows } from '../workflow/run'

const ROW_MS = 3000
const VISIBLE = 4

// Status is always shown as icon + word, never colour alone.
const STATUS = {
  passed: { Icon: CheckCircle2, word: 'Passed checks' },
  flagged: { Icon: Flag, word: 'Flagged for review' },
  retried: { Icon: RotateCw, word: 'Retried' },
}

export default function RunMonitor({ reduced, inView, playing }) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (reduced || !inView || !playing) return
    const id = setInterval(() => setOffset((o) => o + 1), ROW_MS)
    return () => clearInterval(id)
  }, [reduced, inView, playing])

  const rows = reduced ? runLog : visibleRows(runLog, offset, VISIBLE)

  return (
    <div className="mt-8 border-t border-line pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{sections.monitor.title}</h3>
          <p className="mt-1 text-sm text-muted">{sections.monitor.intro}</p>
        </div>
        <span className="rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
          Illustrative run log
        </span>
      </div>
      <ul className="mt-4 space-y-2" aria-label="Recent agent runs">
        {rows.map((r) => {
          const { Icon, word } = STATUS[r.status]
          return (
            <li key={r.text} className="monitor-row flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                {word}
              </span>
              <span className="text-muted">{r.text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
