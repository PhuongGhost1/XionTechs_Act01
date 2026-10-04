import { useEffect, useRef, useState } from 'react'
import { cover, edition } from '../content.js'
import { useMotionOff, useScrollProgress } from '../hooks/index.js'
import { CLEAN, DRAFT } from '../pass/states.js'
import { CropMarks, Edited } from '../ui/primitives.jsx'

// Where each headline line enters from (plan §5: words enter from different directions).
const FROM = [
  { '--fx': '-6vw' },
  { '--fy': '0.5em' },
  { '--fx': '6vw' },
  { '--fy': '-0.4em' },
  { '--fx': '-4vw', '--fy': '0.3em' },
]

export default function Cover() {
  const off = useMotionOff()
  const [on, setOn] = useState(off)
  const [pass, setPass] = useState(off ? CLEAN : DRAFT)
  const [loaded, setLoaded] = useState(false)
  const section = useRef(null)
  useScrollProgress(section, { mode: 'exit', enabled: !off })

  // The opening sequence, once: lines enter, then the copy-editor's correction on line two.
  useEffect(() => {
    if (off) {
      setOn(true)
      setPass(CLEAN)
      return
    }
    const frame = requestAnimationFrame(() => setOn(true))
    const timer = setTimeout(() => setPass(CLEAN), 1300)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [off])

  return (
    <section ref={section} id="top" data-band="paper" aria-labelledby="cover-title" className="relative overflow-x-clip">
      <div className="pf-wrap pb-16 pt-6 lg:pb-24 lg:pt-8">
        <div data-in={on} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-1">
          <p className="pf-mono text-pf-text">{edition.label}</p>
          <p className="pf-mono text-pf-mute">{edition.topics}</p>
          <p className="pf-mono text-pf-mute">{edition.year}</p>
          <span className="pf-rule-draw mt-3 h-px w-full bg-pf-text" aria-hidden="true" />
        </div>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-14">
          <h1
            id="cover-title"
            data-in={on}
            data-pass={pass}
            className="pf-display text-[clamp(2.6rem,13vw,7rem)] lg:text-[clamp(5rem,9vw,9.25rem)]"
          >
            {cover.lines.map((line, i) => (
              <span key={line} className="pf-line block pt-[0.06em]">
                <span className="pf-enter" style={{ ...FROM[i], '--d': `${i * 90}ms` }}>
                  {line === cover.edit.insert ? <Edited text={line} edit={cover.edit} /> : line}
                </span>{' '}
              </span>
            ))}
          </h1>

          <div className="flex flex-col justify-end gap-8">
            <figure className="relative">
              <CropMarks />
              <div
                className="relative aspect-[4/3] overflow-hidden border border-pf-rule/60 bg-pf-bg2 transition-[clip-path] duration-[1400ms] ease-pf lg:aspect-[4/5]"
                style={{ clipPath: on ? 'inset(0)' : 'inset(0 0 100% 0)', transitionDelay: off ? '0ms' : '900ms' }}
              >
                {!loaded && <span className="pf-mono absolute inset-0 grid place-items-center text-pf-mute">{cover.plate.loading}</span>}
                {/* The plate "develops": a grey proof first, full colour as the cover scrolls away. */}
                <img
                  src={cover.plate.src}
                  alt={cover.plate.alt}
                  width={cover.plate.width}
                  height={cover.plate.height}
                  onLoad={() => setLoaded(true)}
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full object-cover object-left-top grayscale"
                />
                <span className="absolute inset-0 bg-pf-text/25 mix-blend-multiply" aria-hidden="true" />
                <img
                  src={cover.plate.src}
                  alt=""
                  aria-hidden="true"
                  width={cover.plate.width}
                  height={cover.plate.height}
                  className="absolute inset-0 h-full w-full object-cover object-left-top"
                  style={{ opacity: 'clamp(0, calc(var(--p, 0) * 2.4), 1)' }}
                />
              </div>
              <figcaption className="pf-mono mt-4 text-pf-mute">{cover.plate.caption}</figcaption>
            </figure>
          </div>
        </div>

        <div className="mt-12 grid gap-8 border-t border-pf-rule/60 pt-6 lg:grid-cols-12">
          <p className="pf-standfirst lg:col-span-7">{cover.standfirst}</p>
          <div className="flex flex-wrap items-start gap-4 lg:col-span-5 lg:justify-end">
            <a href={cover.primary.href} className="pf-btn">
              {cover.primary.label} <span aria-hidden="true">→</span>
            </a>
            <a href={cover.secondary.href} className="pf-mono pf-link inline-flex min-h-[48px] items-center px-2 text-pf-text">
              {cover.secondary.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
