import { engineering } from '../content/site'
import { DraftMark, Eyebrow } from './ui'

// Plan v3 §10: a compact strip of technology categories after Selected Work.
export default function EngineeringStrip() {
  return (
    <section aria-labelledby="engineering-title" className="border-y border-line bg-surface/70">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:py-20 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div>
          <Eyebrow>{engineering.eyebrow}</Eyebrow>
          <h2 id="engineering-title" className="mt-4 text-3xl leading-tight md:text-4xl">
            {engineering.title}
          </h2>
        </div>
        <ul className="grid grid-cols-1 border-t border-line sm:grid-cols-2">
          {engineering.layers.map((c) => (
            <li key={c.label} className="flex flex-col justify-center border-b border-line py-4 sm:odd:pr-6 sm:even:border-l sm:even:pl-6">
              <span className="font-medium text-ink">
                {c.label}
                <DraftMark draft={c.draft} label="Confirm" />
              </span>
              {c.items && <span className="mt-1 text-sm text-muted">{c.items}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
