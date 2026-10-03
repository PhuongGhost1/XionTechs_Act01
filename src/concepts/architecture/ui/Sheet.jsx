import { useRef } from 'react'
import { sheetOf, sheets, ui } from '../content.js'
import { useInView } from '../hooks/hooks.js'
import { Cross } from './Marks.jsx'

/**
 * A drawing sheet: one section of the page. It sets `data-in="true"` once it has entered the viewport,
 * which is what makes every `.bp-draw`, `.bp-fade`, `.bp-rise` and `Dimension` inside it plot itself
 * (the page-wide "blueprint assembly" signature). `band` is "alt" or "navy" to re-scope the colour tokens.
 */
export function Sheet({ id, band, as = 'section', className = '', children, labelledBy, rootMargin = '0px 0px -12% 0px', ...rest }) {
  const Tag = as
  const ref = useRef(null)
  const inView = useInView(ref, { rootMargin })
  const sheet = sheetOf(id)
  return (
    <Tag
      ref={ref}
      id={id}
      data-sheet={sheet ? sheet.no : undefined}
      data-band={band}
      data-in={inView ? 'true' : 'false'}
      aria-labelledby={labelledBy}
      className={`bp-sheet ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** The strip at the top of every sheet: registration cross, drawing code, rule, sheet number. */
export function SheetHeader({ id, className = '' }) {
  const sheet = sheetOf(id)
  if (!sheet) return null
  return (
    <div className={`bp-mono flex items-center gap-3 text-bp-mute ${className}`}>
      <Cross className="shrink-0 text-bp-line" />
      <span className="text-bp-text">{sheet.code}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-bp-rule" />
      <span>
        {ui.sheet} {sheet.no} {ui.of} {String(sheets.length).padStart(2, '0')}
      </span>
      <span aria-hidden="true" className="hidden sm:inline">
        /
      </span>
      <span className="hidden sm:inline">{sheet.title}</span>
    </div>
  )
}
