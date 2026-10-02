import { howWeWork } from '../content/site'
import ProcessTimeline from './ProcessTimeline'
import { SectionHeader } from './ui'

// MOTION §18 / PLAN §11: one connected journey line instead of four cards, drawn as the page
// scrolls (ProcessTimeline). Horizontal from lg, vertical below.
export default function HowWeWork() {
  return (
    <section id="how-we-work" aria-labelledby="how-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader eyebrow={howWeWork.eyebrow} title={howWeWork.title} titleId="how-title" />
        <div className="mt-16">
          <ProcessTimeline steps={howWeWork.steps} />
        </div>
      </div>
    </section>
  )
}
