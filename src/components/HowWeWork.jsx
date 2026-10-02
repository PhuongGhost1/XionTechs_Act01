import { useEffect, useRef, useState } from 'react'
import { howWeWork } from '../content/site'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { SectionHeader } from './ui'

const STEP_MS = 450

// Plan v3 §11: one journey line instead of four cards. Horizontal from lg, vertical below.
// The line fills step by step the first time the section is on screen; pointing at a step
// highlights the journey up to it. Every step's text is always visible.
export default function HowWeWork() {
  const { steps } = howWeWork
  const listRef = useRef(null)
  const reduced = useReducedMotion()
  const inView = useInView(listRef, { once: true, threshold: 0.3 })
  const [reached, setReached] = useState(-1)
  const [hovered, setHovered] = useState(null)
  const last = steps.length - 1
  const filled = reduced ? last : reached

  useEffect(() => {
    if (reduced || !inView || reached >= last) return
    const id = setTimeout(() => setReached((r) => r + 1), STEP_MS)
    return () => clearTimeout(id)
  }, [reduced, inView, reached, last])

  const upTo = hovered ?? filled

  return (
    <section id="how-we-work" aria-labelledby="how-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader eyebrow={howWeWork.eyebrow} title={howWeWork.title} titleId="how-title" />

        <div className="relative mt-16">
          <ol ref={listRef} className="relative grid grid-cols-1 gap-10 lg:grid-cols-4 lg:gap-8">
            {steps.map((s, i) => {
              const on = i <= upTo
              return (
                <li
                  key={s.id}
                  onPointerEnter={() => setHovered(i)}
                  onPointerLeave={() => setHovered(null)}
                  className="relative pl-12 lg:pl-0 lg:pt-12"
                >
                  {/* Connector to the next step: vertical below lg, horizontal from lg. */}
                  {i < last && (
                    <span aria-hidden="true" className="absolute -bottom-9 left-[11px] top-7 w-px bg-line lg:-right-7 lg:bottom-auto lg:left-7 lg:top-[11px] lg:h-px lg:w-auto">
                      <span
                        className={`block h-full w-full origin-top bg-accent transition-transform duration-500 ease-out lg:origin-left ${
                          i < upTo ? 'scale-100' : 'scale-y-0 lg:scale-x-0 lg:scale-y-100'
                        }`}
                      />
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-paper transition-colors duration-300 ${
                      on ? 'border-accent' : 'border-line'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full transition-opacity duration-300 ${on ? 'bg-accent opacity-100' : 'opacity-0'}`} />
                  </span>
                  <span className="text-sm tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 font-display text-2xl">{s.title}</h3>
                  <p className="mt-3 max-w-xs text-pretty text-muted">{s.desc}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
