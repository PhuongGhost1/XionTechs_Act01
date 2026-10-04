import { SECTIONS, manifesto } from '../content.js'
import { Edited, Folio, PassHeading, Reveal } from '../ui/primitives.jsx'

const meta = SECTIONS[1]
// Each line starts on a different column of the grid (desktop only).
const INDENT = ['', 'lg:ml-[26%]', 'lg:ml-[9%]', 'lg:text-right']

export default function Manifesto() {
  return (
    <section id={meta.id} data-band={meta.band} aria-labelledby="manifesto-title" className="overflow-x-clip">
      <div className="pf-wrap py-20 lg:py-32">
        <Folio no={meta.no} head={meta.head} />
        <PassHeading id="manifesto-title" className="mt-12 !text-[clamp(3rem,12.5vw,11rem)] lg:mt-16">
          {manifesto.lines.map((line, i) => (
            <span key={line} className={`block pt-[0.06em] ${INDENT[i]}`}>
              {line === manifesto.edit.insert ? <Edited text={line} edit={manifesto.edit} /> : line}{' '}
            </span>
          ))}
        </PassHeading>
        <div className="mt-14 grid gap-8 lg:mt-20 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <ol className="pf-mono space-y-2 text-pf-mute">
              {manifesto.equation.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span aria-hidden="true" className="text-pf-text">
                    {i === 0 ? '·' : '→'}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal className="lg:col-span-7 lg:col-start-6" delay={120}>
            <p className="pf-standfirst">{manifesto.body}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
