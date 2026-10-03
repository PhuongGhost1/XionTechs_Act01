import { useState } from 'react'
import { work } from '../content.js'
import { Chip, Mono } from '../ui/index.jsx'
import Record from './Record.jsx'

const COLS = 'md:grid-cols-[6.5rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.3fr)_1.5rem] md:gap-x-6'

// Mobile shows each cell as a stacked key:value pair; from md up the labels become the column header.
function Cell({ label, children }) {
  return (
    <span className="flex items-baseline justify-between gap-4 md:block">
      <Mono className="text-x-faint md:sr-only">{label}</Mono>
      <span className="min-w-0 text-right md:text-left">{children}</span>
    </span>
  )
}

// The deployment ledger: one row per record, one open at a time, the first open by default.
export default function Ledger() {
  const [open, setOpen] = useState(work.records[0].key)
  const cols = work.columns
  return (
    <div className="border-t border-x-line">
      <div aria-hidden="true" className={`hidden border-b border-x-line px-3 py-3 text-x-faint md:grid sm:px-6 ${COLS}`}>
        <Mono>{cols.id}</Mono>
        <Mono>{cols.system}</Mono>
        <Mono>{cols.domain}</Mono>
        <Mono>{cols.status}</Mono>
        <span />
      </div>
      <ul className="m-0 list-none p-0">
        {work.records.map((r) => {
          const on = open === r.key
          return (
            <li
              key={r.key}
              data-open={on}
              className="relative border-b border-x-line before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:origin-top before:scale-y-0 before:bg-x-signal before:transition-transform before:duration-300 before:ease-x data-[open=true]:before:scale-y-100"
            >
              <h3 className="m-0 text-base font-normal">
                <button
                  type="button"
                  id={`${r.id}-head`}
                  aria-expanded={on}
                  aria-controls={`${r.id}-record`}
                  onClick={() => setOpen(on ? null : r.key)}
                  className={`grid min-h-11 w-full gap-2 px-3 py-5 text-left transition-colors duration-200 ease-x hover:bg-x-bg2 sm:px-6 md:items-center ${COLS} ${on ? 'bg-x-bg2' : ''}`}
                >
                  <Cell label={cols.id}>
                    <Mono className="text-x-text">{r.id}</Mono>
                  </Cell>
                  <Cell label={cols.system}>
                    <span className="text-xl font-semibold tracking-tight text-x-text md:text-2xl">{r.system}</span>
                  </Cell>
                  <Cell label={cols.domain}>
                    <span className="text-sm text-x-mute">{r.domain}</span>
                  </Cell>
                  <Cell label={cols.status}>
                    <Chip tone={r.status.tone}>{r.status.label}</Chip>
                  </Cell>
                  <span className="flex items-center justify-between md:justify-end">
                    <Mono className="text-x-faint md:hidden">{on ? work.close : work.open}</Mono>
                    <span aria-hidden="true" className="x-mono text-base text-x-text">
                      {on ? '−' : '+'}
                    </span>
                  </span>
                </button>
              </h3>
              <Record record={r} open={on} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
