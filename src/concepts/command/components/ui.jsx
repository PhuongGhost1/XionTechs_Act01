import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { useInView } from '../../../hooks/useInView'

// Draft copy is marked on the page in development and when the URL has `?review`, so the team
// can see what still needs sign-off. Production visitors see the copy without the marker.
const SHOW_DRAFTS =
  import.meta.env.DEV || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('review'))

export function DraftMark({ draft, label = 'Draft copy' }) {
  if (!draft || !SHOW_DRAFTS) return null
  return (
    <span className="ml-2 inline-block rounded-full border border-dashed border-accent px-2 py-0.5 align-middle font-sans text-[11px] font-medium normal-case tracking-normal text-accent">
      {label}
    </span>
  )
}

export function Eyebrow({ children, className = '' }) {
  return <p className={`text-xs font-semibold uppercase tracking-[0.14em] text-accent ${className}`}>{children}</p>
}

// Stacked eyebrow + serif title + intro. `titleId` lets the section use aria-labelledby.
export function SectionHeader({ eyebrow, title, intro, titleId, draft, className = '' }) {
  return (
    <div className={className}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 id={titleId} className="mt-4 max-w-3xl text-4xl leading-[1.1] md:text-5xl">
        {title}
      </h2>
      {intro && (
        <p className="mt-5 max-w-2xl text-pretty text-lg text-muted">
          {intro}
          <DraftMark draft={draft} />
        </p>
      )}
    </div>
  )
}

// Link micro-interactions (MOTION §6, §22): fast (micro) and small, on hover and keyboard focus
// alike, never a scale. Named groups (group/link) keep a hovered parent card from triggering them.
const pill =
  'group/link relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-[color,background-color,border-color,transform] duration-micro ease-brand'

// The arrow steps right; the button lifts a pixel and gains depth (a shadow layer that fades in).
const arrow =
  'h-4 w-4 transition-transform duration-micro ease-brand motion-safe:group-hover/link:translate-x-1 motion-safe:group-focus-visible/link:translate-x-1'
const depth =
  'after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:shadow-depth-2 after:opacity-0 after:transition-opacity after:duration-micro hover:after:opacity-100 focus-visible:after:opacity-100 motion-safe:hover:-translate-y-px motion-safe:focus-visible:-translate-y-px'

// A gold line that draws under the label from the left.
function GoldUnderline({ children }) {
  return (
    <span className="relative">
      {children}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-1 h-[1.5px] origin-left scale-x-0 rounded-full bg-accent transition-transform duration-base ease-brand group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100 motion-reduce:transition-none"
      />
    </span>
  )
}

export function PrimaryLink({ href, children, onPointerEnter, onFocus }) {
  return (
    <a
      href={href}
      onPointerEnter={onPointerEnter}
      onFocus={onFocus}
      className={`${pill} ${depth} bg-primary text-primaryInk hover:bg-primaryHover`}
    >
      {children}
      <ArrowRight aria-hidden="true" className={arrow} />
    </a>
  )
}

export function SecondaryLink({ href, children, onPointerEnter, onFocus }) {
  return (
    <a
      href={href}
      onPointerEnter={onPointerEnter}
      onFocus={onFocus}
      className={`${pill} border border-ink/20 text-ink hover:border-primary hover:text-primary`}
    >
      <GoldUnderline>{children}</GoldUnderline>
    </a>
  )
}

// Text link with an arrow, for in-section next steps: gold underline draws in, arrow steps right.
export function TextLink({ href, children, onPointerEnter, onFocus }) {
  return (
    <a
      href={href}
      onPointerEnter={onPointerEnter}
      onFocus={onFocus}
      className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-primary"
    >
      <GoldUnderline>{children}</GoldUnderline>
      <ArrowRight aria-hidden="true" className={arrow} />
    </a>
  )
}

// Fades and lifts its content in once, the first time it scrolls into view (MOTION §22: trigger
// once per section). `delay` staggers siblings. Reduced motion shows content immediately (CSS).
export function Reveal({ as = 'div', delay = 0, className = '', style, children, ...rest }) {
  const Tag = as
  const ref = useRef(null)
  const shown = useInView(ref, { once: true, rootMargin: '0px 0px -12% 0px' })
  return (
    <Tag
      ref={ref}
      data-revealed={shown ? 'true' : 'false'}
      className={`reveal ${className}`}
      style={{ ...style, '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
