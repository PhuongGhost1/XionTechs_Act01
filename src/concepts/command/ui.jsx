import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { useInView } from '../../hooks/useInView'
import { FLOW_FAST, FLOW_IDLE, setFlowTarget } from './scene/store'

// Shared primitives for the Command concept. Sections compose these so the page reads as one
// system: hairline panels, mono labels, one yellow signal. See docs/concepts/01-command-implementation.md §3-4.

// DRAFT copy is marked in `npm run dev` and with `?review`, never for production visitors
// (same rule as src/components/ui.jsx, CLAUDE.md "Content rules" item 3).
const SHOW_DRAFTS =
  import.meta.env.DEV || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('review'))

export function DraftMark({ draft, label = 'Draft copy' }) {
  if (!draft || !SHOW_DRAFTS) return null
  return (
    <span className="cmd-label ml-2 inline-block border border-dashed border-cmd-signal-fg px-1.5 py-0.5 align-middle text-cmd-signal-fg">
      {label}
    </span>
  )
}

// Not real, and always labelled for every visitor (CLAUDE.md "Content rules" item 4).
export function IllustrativeTag({ children = 'Illustrative · demo data', className = '' }) {
  return (
    <span className={`cmd-label inline-block border border-dashed border-cmd-faint px-1.5 py-0.5 text-cmd-muted ${className}`}>
      {children}
    </span>
  )
}

// A value that does not exist yet. Shown as a labelled gap, never as a plausible-looking number.
export function PendingTag({ children = 'Pending confirmation', className = '' }) {
  return (
    <span className={`cmd-label inline-block border border-dashed border-cmd-signal-fg px-1.5 py-0.5 text-cmd-signal-fg ${className}`}>
      {children}
    </span>
  )
}

// "01 / Section name" in mono, with the index as the yellow signal.
export function SectionLabel({ index, children, className = '' }) {
  return (
    <p className={`cmd-label flex items-center gap-3 text-cmd-muted ${className}`}>
      <span className="text-cmd-signal-fg">{index}</span>
      <span aria-hidden="true" className="h-px w-8 bg-cmd-line" />
      <span>{children}</span>
    </p>
  )
}

// Eyebrow label + h2 + optional intro. `titleId` lets the section use aria-labelledby.
export function SectionHead({ index, label, title, intro, titleId, draft, className = '' }) {
  return (
    <header className={className}>
      <SectionLabel index={index}>{label}</SectionLabel>
      <h2 id={titleId} className="cmd-h2 mt-5 max-w-4xl text-4xl sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {intro && (
        <p className="mt-5 max-w-2xl text-pretty text-lg text-cmd-muted">
          {intro}
          <DraftMark draft={draft} />
        </p>
      )}
    </header>
  )
}

// Reveals its content once as it scrolls into view. Reduced motion shows it at once (CSS).
export function Reveal({ as = 'div', delay = 0, y, className = '', style, children, ...rest }) {
  const Tag = as
  const ref = useRef(null)
  const shown = useInView(ref, { once: true, rootMargin: '0px 0px -10% 0px' })
  return (
    <Tag
      ref={ref}
      data-in={shown ? 'true' : 'false'}
      className={`cmd-reveal ${className}`}
      style={{ ...style, '--reveal-delay': `${delay}ms`, ...(y != null ? { '--reveal-y': `${y}px` } : null) }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

const buttonBase =
  'group/btn relative inline-flex items-center justify-center gap-3 px-6 py-3.5 font-cmd-mono text-[12px] font-medium uppercase tracking-[0.14em] transition-[color,background-color,border-color] duration-micro ease-cmd'

// The two CTA styles. `flow` makes the data core speed up while the button is hovered or focused
// (Concept 01 §14, "Hover CTA: data flow accelerates"). `href` may be an anchor or a mailto.
export function SignalButton({ href, children, variant = 'primary', flow = false, className = '', ...rest }) {
  const hot = flow ? () => setFlowTarget(FLOW_FAST) : undefined
  const cool = flow ? () => setFlowTarget(FLOW_IDLE) : undefined
  const tone =
    variant === 'primary'
      ? 'bg-cmd-signal text-cmd-signal-ink hover:bg-white focus-visible:bg-white'
      : 'border border-cmd-faint text-cmd-text hover:border-cmd-signal hover:text-cmd-signal-fg'
  return (
    <a
      href={href}
      onPointerEnter={hot}
      onPointerLeave={cool}
      onFocus={hot}
      onBlur={cool}
      className={`${buttonBase} ${tone} ${className}`}
      {...rest}
    >
      <span>{children}</span>
      {variant === 'primary' && (
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-micro ease-cmd motion-safe:group-hover/btn:translate-x-1 motion-safe:group-focus-visible/btn:translate-x-1"
        />
      )}
    </a>
  )
}

// A status line: pulsing dot, label and state word, e.g. "AI agents · ● Online".
export function StatusDot({ tone = 'ok', className = '' }) {
  return <span aria-hidden="true" data-tone={tone === 'signal' ? 'signal' : undefined} className={`cmd-dot ${className}`} />
}
