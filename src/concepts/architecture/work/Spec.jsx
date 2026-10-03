import Plot from '../ui/Plot.jsx'
import { Cross } from '../ui/Marks.jsx'
import { titleBlock } from '../content.js'
import { copy } from './copy.js'
import './work.css'

// The shared parts of a project sheet ("plate"): the sheet itself, the four-row specification list, the
// drawing frame and the title block. Sheet 06 draws every project the same way (Problem, Architecture,
// Technology, Outcome, diagram), so what differs is only the content.

const CORNERS = ['-left-2 -top-2', '-right-2 -top-2', '-left-2 -bottom-2', '-right-2 -bottom-2']

/**
 * One project sheet. It is its own `Plot`, so it plots itself when it scrolls into view, whatever the sheet
 * around it is doing. Roughly a full viewport tall on desktop.
 */
export function Plate({ id, code, name, eyebrow, title, status, children }) {
  return (
    <Plot
      as="article"
      id={id}
      aria-labelledby={`${id}-title`}
      className="wk-plate relative flex min-h-[90vh] scroll-mt-20 flex-col border border-bp-line bg-bp-bg"
    >
      {CORNERS.map((pos) => (
        <Cross key={pos} className={`absolute ${pos} text-bp-line`} />
      ))}
      <header className="px-5 pt-5 sm:px-8 sm:pt-7 lg:px-10">
        <div className="bp-mono flex flex-wrap items-center gap-x-3 gap-y-2 text-bp-mute">
          <span className="bg-bp-signal px-1.5 py-0.5 text-bp-onsignal">{code}</span>
          <span aria-hidden="true" className="hidden h-px min-w-6 flex-1 bg-bp-rule sm:block" />
          <span>{eyebrow}</span>
          {status}
        </div>
        <div className="mt-5 grid gap-3 min-[1200px]:grid-cols-[minmax(0,4.2fr)_minmax(0,7.8fr)] min-[1200px]:items-end min-[1200px]:gap-12">
          <h3 id={`${id}-title`} className="bp-h3 text-[clamp(2.5rem,4.4vw,3.25rem)] text-bp-text">
            {name}
          </h3>
          <p className="max-w-[34ch] text-[1.125rem] leading-snug text-bp-text sm:text-[1.3125rem] min-[1200px]:pb-2">{title}</p>
        </div>
      </header>
      <div className="grid flex-1 content-start gap-10 px-5 pb-10 pt-8 sm:px-8 min-[1200px]:grid-cols-[minmax(0,4.2fr)_minmax(0,7.8fr)] min-[1200px]:gap-12 lg:px-10">
        {children}
      </div>
      <TitleBlock code={code} name={name} />
    </Plot>
  )
}

/** The mini title block in the bottom right corner of a plate, as on a drawing sheet. */
function TitleBlock({ code, name }) {
  const cells = [
    [copy.titleBlock.drawing, name],
    [copy.titleBlock.sheet, code],
    [titleBlock.fields.scale, titleBlock.fields.scaleValue],
  ]
  return (
    <dl className="ml-auto grid w-full grid-cols-3 border-l border-t border-bp-line sm:w-auto sm:min-w-[26rem]">
      {cells.map(([k, v]) => (
        <div key={k} className="min-w-0 border-r border-bp-rule px-3 py-2 last:border-r-0 sm:px-4">
          <dt className="bp-mono text-bp-mute">{k}</dt>
          <dd className="bp-mono mt-0.5 text-bp-text">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** The four-row specification list. Labels on the left, content on the right, hairlines between. */
export function Spec({ children }) {
  return <dl className="border-t border-bp-line">{children}</dl>
}

export function SpecRow({ label, children }) {
  return (
    <div className="grid gap-x-6 gap-y-2 border-b border-bp-rule py-5 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
      <dt className="bp-mono pt-[0.2rem] text-bp-mute">{label}</dt>
      <dd className="min-w-0 text-[1rem] leading-relaxed text-bp-text">{children}</dd>
    </div>
  )
}

/** A dashed box for an outcome nobody has confirmed (or an illustrative one). */
export function PendingBox({ children }) {
  return <p className="border border-dashed border-bp-line px-3.5 py-3 text-[0.9375rem] leading-snug text-bp-mute">{children}</p>
}

/**
 * The drawing frame: a figure with a caption strip, a blueprint grid for a floor and an optional note.
 * `chip` sits at the right of the caption strip.
 */
export function Frame({ fig, title, chip, note, className = '', children }) {
  return (
    <figure className={`min-w-0 self-start border border-bp-line bg-bp-bg min-[1200px]:sticky min-[1200px]:top-20 ${className}`}>
      <figcaption className="bp-mono flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-bp-line px-4 py-2.5 text-bp-mute">
        <span>
          <span className="text-bp-text">{fig}</span>
          <span aria-hidden="true"> / </span>
          {title}
        </span>
        {chip}
      </figcaption>
      <div className="bp-grid px-0 py-6 sm:px-4 sm:py-10" style={{ '--g': '80px' }}>
        {children}
      </div>
      {note ? <p className="bp-mono border-t border-bp-rule px-4 py-2.5 text-bp-mute">{note}</p> : null}
    </figure>
  )
}
