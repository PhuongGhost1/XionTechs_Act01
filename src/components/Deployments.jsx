import { useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useInView } from '../hooks/useInView'
import { deployments } from './content'
import ProductViewer from './ProductViewer'
import { nextTabIndex } from './regions'
import { anchorProps } from './scene/store'
import { Reveal, SectionHead } from './ui'
import './Deployments.css'

const tabId = (id) => `deploy-tab-${id}`
const PANEL_ID = 'deploy-panel'

// The static stand-in for the compact chain the data core draws over this section (phase 3): six
// nodes, one per pipeline step, with the fifth, Deploy, lit. It is the only thing in the anchor box
// when WebGL is off; with the canvas on it fades out (.xcore-fallback) and the scene draws the chain.
const CHAIN_X = [24, 72, 120, 168, 216, 264]
const LIT = 4

function MiniChain() {
  const ref = useRef(null)
  const live = useInView(ref) // the packet only runs while the chain is on screen
  return (
    <div
      ref={ref}
      {...anchorProps('deploy')}
      aria-hidden="true"
      data-live={live ? 'true' : 'false'}
      className="dv-chain h-24 w-72 max-w-full shrink-0"
    >
      <svg viewBox="0 0 288 96" fill="none" className="xcore-fallback block h-full w-full">
        <line x1="24" y1="48" x2="264" y2="48" strokeWidth="1" className="stroke-cmd-line" />
        {CHAIN_X.slice(0, -1).map((x) => (
          <line key={x} x1={x + 24} y1="44" x2={x + 24} y2="52" strokeWidth="1" className="stroke-cmd-line" />
        ))}
        {CHAIN_X.map((x, i) => (
          <g key={x}>
            {i === LIT && <circle cx={x} cy="48" r="10" strokeWidth="1" className="stroke-cmd-signal/45" />}
            <circle
              cx={x}
              cy="48"
              r={i === LIT ? 4.5 : 3.5}
              strokeWidth="1"
              className={i === LIT ? 'fill-cmd-signal stroke-cmd-signal' : 'fill-cmd-bg stroke-cmd-faint'}
            />
            <text x={x} y="72" textAnchor="middle" fontSize="9" letterSpacing="0.9" className="fill-cmd-faint font-cmd-mono">
              {String(i + 1).padStart(2, '0')}
            </text>
          </g>
        ))}
        <circle cx="24" cy="48" r="2.5" className="dv-packet fill-cmd-signal" />
      </svg>
    </div>
  )
}

// One row of the ledger. A real WAI-ARIA tab: only the selected one is in the tab order.
function LedgerRow({ record, selected, onSelect, tabRef }) {
  return (
    <button
      ref={tabRef}
      type="button"
      role="tab"
      id={tabId(record.id)}
      aria-selected={selected}
      aria-controls={PANEL_ID}
      tabIndex={selected ? 0 : -1}
      data-on={selected ? 'true' : 'false'}
      onClick={onSelect}
      className="dv-pick group flex min-h-[44px] w-full items-center justify-between gap-4 px-5 py-5 text-left focus-visible:[outline-offset:-2px]"
    >
      <span className="block min-w-0">
        <span className="cmd-label block text-cmd-faint group-data-[on=true]:text-cmd-signal-fg">{record.code}</span>
        <span className="mt-2 block font-cmd-display text-2xl font-semibold uppercase tracking-tight text-cmd-text group-data-[on=true]:text-cmd-signal-fg">
          {record.name}
        </span>
        <span className="cmd-label mt-1.5 block text-cmd-muted">{record.kind}</span>
      </span>
      {/* Points at the viewer: to the right beside it on lg, down at it when the viewer is below. */}
      <ArrowRight
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-cmd-faint transition-transform duration-micro ease-cmd group-data-[on=true]:text-cmd-signal-fg max-lg:rotate-90 lg:motion-safe:group-hover:translate-x-1"
      />
    </button>
  )
}

// Section 04. The three records as a ledger beside a viewer: choosing a record swaps the viewer's
// screen and replays its scan (M10). Not a card grid.
export default function Deployments() {
  const { records } = deployments
  const [selected, setSelected] = useState(0)
  const tabRefs = useRef([])
  const viewerRef = useRef(null)
  // The first scan waits until the viewer is on screen; later ones play at once.
  const seen = useInView(viewerRef, { once: true, rootMargin: '0px 0px -25% 0px' })
  const record = records[selected]

  const onKeyDown = (e) => {
    const next = nextTabIndex(e.key, selected, records.length)
    if (next == null) return
    e.preventDefault()
    setSelected(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <section id="deployments" data-cmd-section aria-labelledby="deployments-title" className="relative border-t border-cmd-line py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="min-w-0">
            <SectionHead
              index={deployments.index}
              label={deployments.label}
              title={deployments.title}
              intro={deployments.intro}
              titleId="deployments-title"
            />
          </Reveal>
          <Reveal delay={120} className="lg:pb-1">
            <MiniChain />
          </Reveal>
        </div>

        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div
                role="tablist"
                aria-orientation="vertical"
                aria-label={deployments.label}
                onKeyDown={onKeyDown}
                className="divide-y divide-cmd-line border-y border-cmd-line"
              >
                {records.map((r, i) => (
                  <LedgerRow
                    key={r.id}
                    record={r}
                    selected={i === selected}
                    onSelect={() => setSelected(i)}
                    tabRef={(el) => {
                      tabRefs.current[i] = el
                    }}
                  />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(record.id)} className="min-w-0 lg:col-span-8">
            <div ref={viewerRef}>
              <ProductViewer key={record.id} record={record} play={seen} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
