import { useEffect, useRef, useState } from 'react'
import { roadmap, sections } from '../content/site'
import IconBadge from './IconBadge'
import { iconMap } from './icons'

export default function Roadmap() {
  const [lit, setLit] = useState(() => new Set())
  const itemRefs = useRef([])

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) {
      setLit(new Set(roadmap.map((_, i) => i)))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number(e.target.dataset.index)
            setLit((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))
          }
        })
      },
      { threshold: 0.15 },
    )
    itemRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section id="roadmap" className="theme-fade border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">{sections.roadmap.eyebrow}</p>
        <h2 className="mt-3 text-3xl md:text-4xl">{sections.roadmap.title}</h2>
        <p className="mt-3 max-w-xl text-muted">{sections.roadmap.intro}</p>
        <p className="mt-2 text-xs italic text-muted">{sections.roadmap.draftNote}</p>

        <ol className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-6">
          {roadmap.map((r, i) => {
            const Icon = iconMap[r.icon]
            const on = lit.has(i)
            return (
              <li
                key={r.stage}
                ref={(el) => (itemRefs.current[i] = el)}
                data-index={i}
                className={`roadmap-stage relative rounded-2xl border p-6 ${
                  on ? 'roadmap-stage-on border-primary/40 bg-surface' : 'border-line bg-surface/50'
                }`}
              >
                <div className="group flex items-center gap-3">
                  <IconBadge icon={Icon} size="sm" />
                  <span className="text-xs font-medium uppercase tracking-wide text-accent">
                    {String(i + 1).padStart(2, '0')} · {r.stage}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{r.title}</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-ink">What you get</dt>
                    <dd className="text-muted">{r.get}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Your involvement</dt>
                    <dd className="text-muted">{r.involvement}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Next step</dt>
                    <dd className="text-muted">{r.next}</dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
