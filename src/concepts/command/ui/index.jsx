// Shared primitives for the X / Command page. Colour comes only from the x-* Tailwind tokens.
import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion, useStore } from '../hooks/index.js'
import { store } from '../state/store.js'
import { sections } from '../content.js'

// Mono label: IDs, states, timestamps. Never body copy.
export function Mono(props) {
  const { as: Tag = 'span', className = '', children, ...rest } = props
  return (
    <Tag className={`x-mono ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

// A status dot is never the only signal: always render the state word beside it.
// on = filled signal, pending = hollow ring, illustrative = dashed ring.
export function Dot({ tone = 'on', className = '' }) {
  const look =
    tone === 'on'
      ? 'bg-x-signal'
      : tone === 'pending'
        ? 'border border-x-faint'
        : 'border border-dashed border-x-faint'
  return <span aria-hidden="true" className={`inline-block size-2 shrink-0 rounded-full ${look} ${className}`} />
}

// State chip: PENDING / ILLUSTRATIVE / CONFIRMED. Dashed outline marks "not a verified fact".
export function Chip({ tone = 'neutral', children, className = '' }) {
  const look =
    tone === 'pending' || tone === 'illustrative'
      ? 'border-dashed border-x-faint text-x-mute'
      : tone === 'ok'
        ? 'border-x-text/40 text-x-text'
        : 'border-x-line text-x-mute'
  return (
    <span className={`x-mono inline-flex items-center gap-1.5 border px-1.5 py-0.5 ${look} ${className}`}>
      {tone === 'ok' && <Dot tone="on" className="ring-1 ring-x-ink" />}
      {children}
    </span>
  )
}

const BTN =
  'group inline-flex min-h-11 items-center gap-3 px-5 py-3 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] transition-colors duration-200 ease-x'

export function Button({ variant = 'primary', href, arrow = false, children, className = '', onHover, ...rest }) {
  const look =
    variant === 'primary'
      ? 'bg-x-signal text-x-ink hover:bg-x-text'
      : 'border border-x-faint text-x-text hover:border-x-text'
  const hover = onHover
    ? { onPointerEnter: () => onHover(true), onPointerLeave: () => onHover(false), onFocus: () => onHover(true), onBlur: () => onHover(false) }
    : {}
  const Tag = href ? 'a' : 'button'
  return (
    <Tag href={href} className={`${BTN} ${look} ${className}`} {...hover} {...rest}>
      {children}
      {arrow && (
        <span aria-hidden="true" className="transition-transform duration-200 ease-x group-hover:translate-x-1 group-focus-visible:translate-x-1">
          →
        </span>
      )}
    </Tag>
  )
}

// Fade/slide in once. `delay` in ms staggers children. Final state is the default without motion.
export function Reveal(props) {
  const { as: Tag = 'div', delay = 0, className = '', children, ...rest } = props
  const ref = useRef(null)
  const seen = useInView(ref, { amount: 0.15 })
  return (
    <Tag ref={ref} className={`x-reveal ${className}`} data-in={seen} style={{ '--d': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  )
}

const pad = (n) => String(n).padStart(2, '0')
const stamp = () => {
  const d = new Date()
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`
}

// A section: a yellow line travels across its top edge once and a scan line sweeps down with a
// `SYS hh:mm:ssZ / SEC nn` label (about half a second). Both are skipped under reduced motion.
// It also reports itself as the active section and feeds the build counter.
export function Section({ id, band, className = '', children, ...rest }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const [fired, setFired] = useState(false)
  const [time, setTime] = useState('')
  const meta = sections.find((s) => s.id === id)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(
      ([it]) => {
        if (it.isIntersecting) {
          setFired((was) => {
            if (!was) setTime(stamp())
            return true
          })
          store.set((s) => (s.sectionsSeen.includes(id) ? {} : { sectionsSeen: [...s.sectionsSeen, id] }))
        }
      },
      { threshold: 0.18 },
    )
    io.observe(el)
    const active = new IntersectionObserver(
      ([it]) => {
        if (it.isIntersecting) store.set({ section: id })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    active.observe(el)
    return () => {
      io.disconnect()
      active.disconnect()
    }
  }, [id])

  return (
    <section ref={ref} id={id} data-section={id} data-band={band} className={`relative bg-x-bg text-x-text ${className}`} {...rest}>
      <div className="x-signal-line" data-fired={fired && !reduced} aria-hidden="true" />
      <div className="x-scan" data-fired={fired && !reduced} style={{ '--scan-h': '420px' }} aria-hidden="true" />
      {fired && !reduced && meta && (
        <Mono className="pointer-events-none absolute right-5 top-3 hidden text-x-faint sm:block lg:right-12" aria-hidden="true">
          SYS {time} / SEC {meta.code}
        </Mono>
      )}
      {children}
    </section>
  )
}

export function Container({ className = '', children, ...rest }) {
  return (
    <div className={`mx-auto w-full max-w-page px-5 sm:px-8 lg:px-12 ${className}`} {...rest}>
      {children}
    </div>
  )
}

// Section head: mono code line, one headline, optional intro. Left aligned, never centred.
export function SectionHead({ code, label, title, intro, className = '' }) {
  return (
    <header className={`max-w-3xl ${className}`}>
      <Mono as="p" className="flex items-center gap-3 text-x-faint">
        <span className="text-x-text">{code}</span>
        <span aria-hidden="true" className="h-px w-8 bg-x-line" />
        <span>{label}</span>
      </Mono>
      <h2 className="x-h2 mt-5 text-4xl text-balance sm:text-5xl lg:text-6xl">{title}</h2>
      {intro && <p className="mt-5 max-w-xl text-lg leading-relaxed text-x-mute">{intro}</p>}
    </header>
  )
}

// Visible Pause Motion control (WCAG 2.2.2). Stops the render loop and the CSS loops.
export function PauseButton({ labels, className = '' }) {
  const paused = useStore((s) => s.paused)
  const reduced = useReducedMotion()
  if (reduced) return null
  return (
    <button
      type="button"
      aria-pressed={paused}
      onClick={() => store.set({ paused: !paused })}
      className={`x-mono inline-flex min-h-11 items-center gap-2 border border-x-faint px-3 text-x-mute transition-colors duration-200 ease-x hover:border-x-text hover:text-x-text ${className}`}
    >
      <span aria-hidden="true" className="inline-flex w-3 justify-between">
        {paused ? <span className="block size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-current" /> : (
          <>
            <span className="block h-2.5 w-[3px] bg-current" />
            <span className="block h-2.5 w-[3px] bg-current" />
          </>
        )}
      </span>
      {paused ? labels.play : labels.pause}
    </button>
  )
}
