import { selectedWork } from '../content/site'
import { loadAgentDemo } from './agentDemoLoader'
import StoryEss from './StoryEss'
import StoryStaffxp from './StoryStaffxp'
import { SectionHeader, TextLink } from './ui'

// Plan v3 §6–9: an editorial portfolio with two product stories, each with its own visual
// treatment, and the Agent Demo as the third proof point.
export default function SelectedWork() {
  const { proofs } = selectedWork
  return (
    <section id="work" aria-labelledby="work-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader eyebrow={selectedWork.eyebrow} title={selectedWork.title} intro={selectedWork.intro} titleId="work-title" />

        <ol className="mt-12 grid grid-cols-1 border-y border-line sm:grid-cols-3" aria-label="Proof points">
          {proofs.map((p, i) => (
            <li key={p.id} className="border-line py-5 sm:px-6 sm:first:pl-0 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-t-0">
              <a
                href={p.href}
                onPointerEnter={p.id === 'agents' ? loadAgentDemo : undefined}
                className="group block"
              >
                <span className="text-sm tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="mt-2 flex items-center gap-2 text-lg font-semibold text-ink group-hover:text-primary">
                  {p.name}
                  {p.note && (
                    <span className="rounded-full border border-dashed border-accent px-2 py-0.5 text-[11px] font-medium text-accent">{p.note}</span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-muted">{p.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <StoryStaffxp />
      <StoryEss />

      <div className="mx-auto mt-24 max-w-6xl px-6">
        <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-baseline gap-4 text-muted">
            <span className="font-display text-2xl tabular-nums">03</span>
            {selectedWork.agentsNote}
          </p>
          <TextLink href={selectedWork.agentsLink.href} onPointerEnter={loadAgentDemo} onFocus={loadAgentDemo}>
            {selectedWork.agentsLink.label}
          </TextLink>
        </div>
      </div>
    </section>
  )
}
