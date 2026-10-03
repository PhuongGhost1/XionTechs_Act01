import { contact } from '../../content/index.js'
import { CoreAnchor } from '../../contract/anchors.js'
import { STATIONS } from '../../contract/stations.js'
import { CoreFigure } from '../../core/CoreFigure.jsx'
import { useTrack } from '../../runtime/hooks.js'
import { FullStop } from '../../ui/FullStop.jsx'
import { KeyValue } from '../../ui/KeyValue.jsx'
import { Label } from '../../ui/Label.jsx'

// STUB (WP6 replaces this file). Station 06 DONE: the pinned finale (id "done", track--pin) and,
// below it in normal flow, the composer (id "contact", same station for data-station). WP6 builds
// doc 4.8: GET / IT / DONE. in three stair-stepped lines (M14), the composer with SEND EMAIL and
// COPY TEXT from useBrief(), the endpoints, the footer with the reversed logo and the build stamp.
export default function Done() {
  const ref = useTrack('done')
  const { finale, composer, endpoints } = contact
  return (
    <>
      <section id="done" ref={ref} data-track="done" aria-labelledby="done-title" className="track track--pin">
        <div className="stage">
          <div className="column relative flex h-full flex-col justify-center gap-4">
            <Label>{STATIONS[6].label}</Label>
            <h2 id="done-title" className="font-display text-finale font-medium uppercase text-ink">
              {finale.lines.map((l) => l.text).join(' ')}
              <FullStop />
            </h2>
            <p className="font-mono text-label uppercase text-ink2">{finale.kicker.text}</p>
            <CoreAnchor name="done" className="absolute right-[var(--margin-x)] top-8 h-[160px] w-[160px] md:h-[320px] md:w-[320px]">
              <CoreFigure layout="mark" />
            </CoreAnchor>
          </div>
        </div>
      </section>
      <section id="contact" aria-labelledby="contact-title" className="track">
        <div className="column flex flex-col gap-6 py-[var(--station-gap)]">
          <h2 id="contact-title" className="font-display text-h2 font-medium text-ink">
            {composer.heading.text}
          </h2>
          <dl className="flex max-w-xl flex-col gap-2">
            {endpoints.map((e) => (
              <KeyValue key={e.id} label={e.label} value={<a href={e.href}>{e.text}</a>} />
            ))}
          </dl>
        </div>
      </section>
    </>
  )
}
