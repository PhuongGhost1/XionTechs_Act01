import { SECTIONS, dispatches } from '../content.js'
import { DraftMark, Edited, Folio, PassHeading, Reveal } from '../ui/primitives.jsx'

const meta = SECTIONS[5]
// Three columns of unequal weight, like a broadsheet page: the lead is wider and starts higher.
const SPAN = ['lg:col-span-5', 'lg:col-span-4 lg:mt-24', 'lg:col-span-3 lg:mt-48']

export default function Dispatches() {
  return (
    <section id={meta.id} data-band={meta.band} aria-labelledby="dispatches-title">
      <div className="pf-wrap py-20 lg:py-32">
        <Folio no={meta.no} head={meta.head} />
        <div className="mt-12 flex flex-wrap items-end justify-between gap-6">
          <PassHeading id="dispatches-title">
            <Edited text={dispatches.title} edit={dispatches.edit} />
          </PassHeading>
          <p className="pf-mono text-pf-mute">
            {dispatches.note}
            {dispatches.draft && <DraftMark />}
          </p>
        </div>
        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-10">
          {dispatches.items.map((d, i) => (
            <Reveal key={d.id} className={SPAN[i]} delay={i * 120}>
              <article aria-labelledby={`dispatch-${d.id}`} className="border-t border-pf-text pt-4">
                <p className="pf-mono flex items-center gap-3 text-pf-mute">
                  <span className="bg-pf-mark px-1.5 text-pf-onmark">{String.fromCharCode(65 + i)}</span>
                  {d.kicker}
                </p>
                <h3 id={`dispatch-${d.id}`} className={`mt-5 font-display font-semibold leading-[0.98] tracking-[-0.01em] text-pf-text ${i === 0 ? 'text-[clamp(2.5rem,4.6vw,4.25rem)]' : 'text-[clamp(2rem,3vw,2.75rem)]'}`}>
                  {d.title}
                </h3>
                <p className="pf-standfirst mt-5 italic">{d.standfirst}</p>
                {d.paras.map((p) => (
                  <p key={p} className="mt-4">
                    {p}
                  </p>
                ))}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
