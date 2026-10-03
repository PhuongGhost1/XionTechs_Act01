import { deploy, modules } from '../../content/index.js'
import { CoreAnchor } from '../../contract/anchors.js'
import { STATIONS } from '../../contract/stations.js'
import { CoreFigure } from '../../core/CoreFigure.jsx'
import { useTrack } from '../../runtime/hooks.js'
import { Label } from '../../ui/Label.jsx'

// STUB (WP3 replaces this file). Station 02 DEPLOY, id "deploy". WP3 builds doc 4.4: four module
// rows as buttons, the sticky instrument with the arms, the service checkboxes wired to the brief.
export default function Deploy() {
  const ref = useTrack('deploy')
  return (
    <section id="deploy" ref={ref} data-track="deploy" aria-labelledby="deploy-title" className="track">
      <div className="column relative flex flex-col gap-6 py-[var(--station-gap)]">
        <Label>{STATIONS[2].label}</Label>
        <h2 id="deploy-title" className="font-display text-h2 font-medium text-ink">
          {deploy.heading.text} <span className="text-ink2">{deploy.headingMuted.text}</span>
        </h2>
        <ol className="flex flex-col gap-3 font-mono text-label uppercase text-ink2">
          {modules.map((m) => (
            <li key={m.id}>
              {m.index} {m.label} ( {m.state.text} )
            </li>
          ))}
        </ol>
        <CoreAnchor name="deploy" className="sticky top-header h-[160px] w-[160px] self-end md:h-[300px] md:w-[300px]">
          <CoreFigure layout="arms" />
        </CoreAnchor>
      </div>
    </section>
  )
}
