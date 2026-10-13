import { ArrowRight } from 'lucide-react'
import { modules } from './content'
import { anchorProps } from './scene/store'
import { Reveal, SectionHead, StatusDot } from './ui'
import ModuleVisual from './ModuleVisual'
import './Modules.css'

// The particles M6 lets drift across a hovered row: left %, top %, start delay (s), travel (px).
// Fixed rather than random, so every row and every render looks the same.
const DRIFT = [
  [31, 72, 0, 96],
  [38, 26, 0.5, 80],
  [46, 58, 1.1, 104],
  [54, 82, 0.3, 72],
  [62, 34, 0.8, 92],
  [70, 66, 1.4, 84],
  [78, 22, 0.2, 76],
  [86, 50, 1, 60],
]

// Section 02. Capabilities as system modules: four hairline-separated rows, not cards. Each row's
// right-hand box is an anchor the data core settles into (docs/concepts/01-command-implementation.md §5);
// until the canvas draws there, the box shows the module's static diagram.
export default function Modules() {
  return (
    <section
      id="modules"
      data-cmd-section
      aria-labelledby="modules-title"
      className="relative overflow-x-clip py-24 lg:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <SectionHead
            index={modules.index}
            label={modules.label}
            title={modules.title}
            intro={modules.intro}
            titleId="modules-title"
          />
        </Reveal>

        <ol role="list" className="mt-14 border-t border-cmd-line lg:mt-20">
          {modules.items.map((item) => (
            <ModuleRow key={item.id} item={item} statusLabel={modules.statusLabel} />
          ))}
        </ol>
      </div>
    </section>
  )
}

// Hovering or focusing a row runs M6: the status chip appears, the title picks up a tick and a few
// particles drift (all in Modules.css). The row is only keyboard-reachable through its link, if it has one.
function ModuleRow({ item, statusLabel }) {
  return (
    <Reveal as="li" className="cmdm relative overflow-x-clip border-b border-cmd-line">
      <div aria-hidden="true" className="cmdm-fx">
        {DRIFT.map(([x, y, delay, travel]) => (
          <span key={x} className="cmdm-p" style={{ '--x': `${x}%`, '--y': `${y}%`, '--d': `${delay}s`, '--dx': `${travel}px` }} />
        ))}
      </div>

      <div className="relative grid gap-x-8 gap-y-6 py-10 md:grid-cols-[minmax(0,1fr)_220px] lg:grid-cols-12 lg:py-12">
        {/* Index, short label and status */}
        <div className="flex items-center justify-between gap-4 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:flex-col lg:items-start lg:justify-start lg:gap-4">
          <p className="cmd-label flex items-center gap-3">
            <span className="text-cmd-signal-fg">{item.index}</span>
            <span aria-hidden="true" className="h-px w-5 bg-cmd-line" />
            <span className="text-cmd-muted">{item.short}</span>
          </p>
          <p className="cmdm-chip cmd-label inline-flex items-center gap-2 border border-cmd-line px-2 py-1 text-cmd-text">
            <StatusDot />
            {statusLabel}
          </p>
        </div>

        {/* Title, description and the optional link */}
        <div className="lg:col-span-4 lg:col-start-3 lg:row-start-1">
          <div className="relative">
            <span aria-hidden="true" className="cmdm-tick" />
            <h3 className="font-cmd-display text-2xl font-semibold uppercase tracking-tight text-cmd-text">{item.title}</h3>
          </div>
          <p className="mt-4 max-w-[46ch] text-pretty text-base text-cmd-muted">{item.desc}</p>
          {item.link && (
            <a
              href={item.link.href}
              className="group/link mt-5 inline-flex min-h-[44px] items-center gap-2 font-cmd-mono text-[12px] font-medium uppercase tracking-[0.14em] text-cmd-signal-fg underline decoration-cmd-signal/40 decoration-1 underline-offset-[6px] hover:decoration-cmd-signal"
            >
              <span>{item.link.label}</span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-micro ease-cmd motion-safe:group-hover/link:translate-x-1 motion-safe:group-focus-visible/link:translate-x-1"
              />
            </a>
          )}
        </div>

        {/* Three points, separated by hairlines */}
        <ul role="list" className="divide-y divide-cmd-line self-start border-y border-cmd-line lg:col-span-3 lg:col-start-7 lg:row-start-1">
          {item.points.map((point) => (
            <li key={point} className="flex items-start gap-3 py-2.5 text-sm text-cmd-muted">
              <span aria-hidden="true" className="mt-[0.5em] h-1 w-1 shrink-0 bg-cmd-faint" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        {/* The data core's anchor. Transparent so the canvas shows through; stable size so it can be measured. */}
        <div
          {...anchorProps(item.anchor)}
          className="cmd-ticks order-first h-[132px] w-[220px] self-start md:order-none md:col-start-2 md:row-span-3 md:row-start-1 md:justify-self-end lg:col-span-3 lg:col-start-10 lg:row-span-1"
        >
          <ModuleVisual kind={item.kind} />
        </div>
      </div>
    </Reveal>
  )
}
