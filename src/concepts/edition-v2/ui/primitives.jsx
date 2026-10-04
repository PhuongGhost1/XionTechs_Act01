import { useRef } from 'react'
import { chrome } from '../content.js'
import { useInView, usePass } from '../hooks/index.js'
import { editParts } from '../pass/states.js'

// A headline fragment with the copy-editor's pass applied. With `edit`, the struck word is hidden from
// screen readers, so they read only the final copy. With `mark`, the phrase is only highlighted.
export function Edited({ text, edit, mark }) {
  const parts = editParts(text, edit ? edit.insert : mark)
  if (!parts) return text
  // Trailing punctuation stays with the word so it cannot wrap onto a line of its own.
  const tail = parts.after.match(/^S*/)[0]
  const keep = edit?.keep === 'lg' ? 'pf-edit--keep-lg' : edit?.keep ? 'pf-edit--keep' : ''
  return (
    <>
      {parts.before}
      {edit ? (
        <span className={`pf-edit ${edit.end ? 'pf-edit--end' : ''} ${keep}`}>
          <del aria-hidden="true" className="pf-edit__old">
            {edit.strike}
          </del>
          <span className="pf-edit__new pf-hl">{parts.match}</span>
          {tail}
        </span>
      ) : (
        <span className="whitespace-nowrap">
          <span className="pf-hl">{parts.match}</span>
          {tail}
        </span>
      )}
      {parts.after.slice(tail.length)}
    </>
  )
}

// An h2 that is passed once when it comes into view.
export function PassHeading({ id, className = '', children }) {
  const ref = useRef(null)
  const pass = usePass(ref)
  return (
    <h2 ref={ref} id={id} data-pass={pass} className={`pf-display pf-h2 ${className}`}>
      {children}
    </h2>
  )
}

// Running head with the oversized folio number, e.g. "03 / Feature".
export function Folio({ no, head, className = '' }) {
  const ref = useRef(null)
  const seen = useInView(ref, { threshold: 0.6 })
  return (
    <div ref={ref} data-in={seen} className={`flex items-end gap-4 border-b border-pf-rule/60 pb-3 ${className}`}>
      <span className="pf-folio__clip overflow-hidden pr-2 pt-[0.16em] font-display text-[clamp(3rem,6vw,5.5rem)] font-light italic leading-[0.8] text-pf-text" aria-hidden="true">
        <span className="pf-folio__num">{no}</span>
      </span>
      <span className="pf-mono pb-1 text-pf-mute">
        <span className="sr-only">Section {no}: </span>
        {head}
      </span>
      <span className="pf-rule-draw mb-2 h-px flex-1 bg-pf-mark" style={{ '--d': '200ms' }} aria-hidden="true" />
    </div>
  )
}

export function Reveal({ className = '', delay = 0, children }) {
  const ref = useRef(null)
  const seen = useInView(ref)
  return (
    <div ref={ref} data-in={seen} className={`pf-reveal ${className}`} style={{ '--d': `${delay}ms` }}>
      {children}
    </div>
  )
}

// Solid chip = a fact or a tag. Dashed chip = pending or illustrative; the text always says which.
export function Chip({ dashed = false, children }) {
  return (
    <span className={`pf-mono inline-flex min-h-[24px] items-center px-2 text-pf-text ${dashed ? 'pf-dashed' : 'border border-pf-text/40'}`}>
      {children}
    </span>
  )
}

const showDraft = import.meta.env.DEV || new URLSearchParams(window.location.search).has('review')

// Marks DRAFT wording in development and on any build opened with `?review` (CLAUDE.md, content rules).
export function DraftMark() {
  if (!showDraft) return null
  return <span className="pf-mono ml-2 inline-block bg-pf-mark px-1.5 align-middle text-pf-onmark">{chrome.draft}</span>
}

export function CropMarks() {
  return (
    <span aria-hidden="true">
      <span className="pf-crop pf-crop--tl" />
      <span className="pf-crop pf-crop--tr" />
      <span className="pf-crop pf-crop--bl" />
      <span className="pf-crop pf-crop--br" />
    </span>
  )
}

// A plate: a real screenshot with crop marks, optional highlighted regions (% boxes) and a caption.
// `regions` is [{ id, boxes: [{x,y,w,h}] }]; `active` is the id to highlight.
export function Figure({ figure, regions = [], active = null, chips = null, className = '', eager = false }) {
  const ref = useRef(null)
  const seen = useInView(ref, { threshold: 0.15 })
  return (
    <figure ref={ref} data-in={seen} className={`pf-figure ${className}`}>
      <div className="relative">
        <CropMarks />
        <div className="pf-figure__frame relative border border-pf-rule/60 bg-pf-bg2">
          <img
            src={figure.src}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="block h-auto w-full"
          />
          {regions.map((r) =>
            r.boxes.map((b, i) => (
              <span
                key={`${r.id}-${i}`}
                aria-hidden="true"
                data-on={active === r.id}
                className="pf-region"
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
              />
            )),
          )}
        </div>
      </div>
      <figcaption className="pf-mono mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-pf-mute">
        <span>{figure.caption}</span>
        {chips}
      </figcaption>
    </figure>
  )
}
