import { useRef } from 'react'
import { SECTIONS, edition, signoff } from '../content.js'
import { usePass } from '../hooks/index.js'
import { Edited, Folio, PassHeading, Reveal } from '../ui/primitives.jsx'

const meta = SECTIONS[7]
const { colophon } = signoff

// The sign-off: the last correction, then the slogan approved with the marker.
export default function Signoff() {
  const slogan = useRef(null)
  const pass = usePass(slogan)

  return (
    <section id={meta.id} data-band={meta.band} aria-labelledby="signoff-title" className="overflow-x-clip">
      <div className="pf-wrap pt-20 lg:pt-32">
        <Folio no={meta.no} head={meta.head} />
        <PassHeading id="signoff-title" className="mt-12 !text-[clamp(2.25rem,6vw,5.5rem)]">
          {signoff.lines.map((line) => (
            <span key={line} className="block pt-[0.06em]">
              <Edited text={line} edit={signoff.edit} />{' '}
            </span>
          ))}
        </PassHeading>

        <p
          ref={slogan}
          data-pass={pass}
          className="pf-display mt-10 whitespace-nowrap text-[clamp(2.5rem,11.6vw,10.6rem)] transition-[letter-spacing,opacity] duration-[1200ms] ease-pf data-[pass=draft]:tracking-[0.12em] data-[pass=draft]:opacity-40"
        >
          <span className="pf-hl inline-block pb-[0.14em] !bg-[position:0_100%]">{signoff.slogan}</span>
        </p>

        <Reveal className="mt-14 grid gap-8 lg:grid-cols-12">
          <p className="pf-standfirst lg:col-span-6">{signoff.intro}</p>
          <div className="lg:col-span-5 lg:col-start-8">
            <a href={signoff.primary.href} className="pf-btn">
              {signoff.primary.label} <span aria-hidden="true">→</span>
            </a>
            <p className="mt-3 text-[15px] text-pf-mute">{signoff.primaryNote}</p>
          </div>
        </Reveal>
      </div>

      <footer className="pf-wrap pb-10 pt-20 lg:pt-28">
        <div className="grid gap-10 border-t border-pf-rule/60 pt-8 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <img src={edition.logoReversed.src} alt="XionTechs" width={edition.logoReversed.width} height={edition.logoReversed.height} loading="lazy" className="h-7 w-auto" />
            <p className="pf-mono mt-5 text-pf-mute">{colophon.title}</p>
            <p className="mt-2 text-[15px] text-pf-mute">{colophon.legalName}</p>
            <p className="text-[15px] text-pf-mute">{colophon.set}</p>
          </div>
          <div className="lg:col-span-3">
            <p className="pf-mono text-pf-mute">Contact</p>
            <ul className="mt-2 space-y-1">
              <li>
                <a href={`mailto:${colophon.contact.email}`} className="pf-link inline-flex min-h-[28px] items-center">
                  {colophon.contact.email}
                </a>
              </li>
              {colophon.contact.phones.map((p) => (
                <li key={p}>
                  <a href={`tel:${p.replace(/\s/g, '')}`} className="pf-link inline-flex min-h-[28px] items-center">
                    {p}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <p className="pf-mono text-pf-mute">Offices</p>
            <ul className="mt-2 space-y-2 text-[15px]">
              {colophon.contact.addresses.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2">
            <p className="pf-mono text-pf-mute">Elsewhere</p>
            <ul className="mt-2 space-y-1">
              {colophon.contact.social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="pf-link inline-flex min-h-[28px] items-center">
                    {s.label} <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="pf-mono mt-10 flex flex-wrap justify-between gap-x-8 gap-y-2 text-pf-mute">
          <span>
            {edition.label} · {edition.year}
          </span>
          <span>{colophon.concept}</span>
          <span>
            {colophon.rev} {__BUILD_NUMBER__}
          </span>
        </p>
      </footer>
    </section>
  )
}
