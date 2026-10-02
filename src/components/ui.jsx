import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { useInView } from '../hooks/useInView'

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

const pill = 'group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors'

export function PrimaryLink({ href, children, onPointerEnter, onFocus }) {
  return (
    <a href={href} onPointerEnter={onPointerEnter} onFocus={onFocus} className={`${pill} bg-primary text-primaryInk hover:bg-primaryHover`}>
      {children}
      <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
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
      {children}
    </a>
  )
}

// Underlined text link with an arrow, for in-section next steps.
export function TextLink({ href, children, onPointerEnter, onFocus }) {
  return (
    <a
      href={href}
      onPointerEnter={onPointerEnter}
      onFocus={onFocus}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      {children}
      <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
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
