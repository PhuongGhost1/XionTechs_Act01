import { useState } from 'react'
import { PENDING, SECTIONS, contributors } from '../content.js'
import { Chip, Edited, Folio, PassHeading, Reveal } from '../ui/primitives.jsx'

const meta = SECTIONS[6]

// The roles behind the work, set at poster size. No portraits, names or quotes until real ones exist.
export default function Contributors() {
  const [active, setActive] = useState(contributors.roles[0].id)
  const role = contributors.roles.find((r) => r.id === active)

  return (
    <section id={meta.id} data-band={meta.band} aria-labelledby="about-title">
      <div className="pf-wrap py-20 lg:py-32">
        <Folio no={meta.no} head={meta.head} />
        <PassHeading id="about-title" className="mt-12 max-w-[18ch] !text-[clamp(2rem,4.4vw,4rem)]">
          <Edited text={contributors.title} mark={contributors.mark} />
        </PassHeading>

        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          <ul className="lg:col-span-8">
            {contributors.roles.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={active === r.id}
                  onClick={() => setActive(r.id)}
                  onMouseEnter={() => setActive(r.id)}
                  onFocus={() => setActive(r.id)}
                  className={`pf-display block w-full text-left text-[clamp(3rem,12vw,10rem)] transition-colors duration-300 ${active === r.id ? '' : '!text-pf-rule/70'}`}
                >
                  <span className={active === r.id ? 'pf-hl !bg-[length:100%_var(--pf-hl-size)]' : ''}>{r.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="lg:col-span-4 lg:pt-6">
            <div aria-live="polite" className="min-h-[9rem] border-t border-pf-text pt-4">
              <p className="pf-mono text-pf-mute">{role.name}</p>
              {role.line ? <p className="pf-standfirst mt-3">{role.line}</p> : <p className="mt-3"><Chip dashed>{PENDING}</Chip></p>}
            </div>
            <p className="mt-8">
              <Chip dashed>{contributors.portraits}</Chip>
            </p>
          </div>
        </div>

        <Reveal className="mt-16">
          <dl className="grid gap-8 border-t border-pf-text pt-6 sm:grid-cols-2">
            {contributors.facts.map((f) => (
              <div key={f.label} className="flex items-start gap-6">
                <dt className="order-2 max-w-[34ch] pt-2 text-pf-mute">{f.label}</dt>
                <dd className="order-1 font-display text-[clamp(3.5rem,7vw,6rem)] font-light italic leading-[0.85] text-pf-text">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
