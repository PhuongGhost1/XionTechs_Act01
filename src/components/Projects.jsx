import { useState } from 'react'
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import { projects, sections } from '../content/site'
import MockPerformance from './MockPerformance'
import MockCrm from './MockCrm'
import MockAgentFlow from './MockAgentFlow'

// One illustrative mock-up per project id, until sanitized real screenshots are supplied.
const mocks = {
  performance: MockPerformance,
  crm: MockCrm,
  agent: MockAgentFlow,
}

function MockFrame({ project }) {
  const Mock = mocks[project.id]
  return (
    <figure>
      <div
        role="img"
        aria-label={`${project.mock.label} — ${sections.projects.mockNote}`}
        className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lg transition-transform duration-300 motion-safe:group-hover:-translate-y-1"
      >
        <div aria-hidden="true">
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-line" />
            <span className="h-2 w-2 rounded-full bg-line" />
            <span className="h-2 w-2 rounded-full bg-line" />
            <span className="ml-3 truncate text-[11px] text-muted">{project.mock.label}</span>
          </div>
          {Mock && <Mock project={project} />}
        </div>
      </div>
      <figcaption className="mt-3 text-xs italic text-muted">{sections.projects.mockNote}</figcaption>
    </figure>
  )
}

export default function Projects() {
  const [openId, setOpenId] = useState(null)

  return (
    <section id="work" className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">{sections.projects.eyebrow}</p>
      <h2 className="mt-3 text-3xl md:text-4xl">{sections.projects.title}</h2>
      <p className="mt-3 max-w-xl text-muted">{sections.projects.intro}</p>

      <div className="mt-12 space-y-16">
        {projects.map((p, i) => {
          const isOpen = openId === p.id
          return (
            <article key={p.id} className="group grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-12">
              <div className={i % 2 === 1 ? 'lg:order-last' : ''}>
                <MockFrame project={p} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">{p.eyebrow}</p>
                  {p.draft && (
                    <span className="rounded-full border border-dashed border-accent px-2 py-0.5 text-xs font-medium text-accent">
                      Draft copy
                    </span>
                  )}
                </div>
                {p.badge && (
                  <p className="mt-3 inline-block rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
                    {p.badge}
                  </p>
                )}
                <h3 className="mt-3 text-2xl font-semibold">{p.title}</h3>
                <p className="mt-3 text-muted">{p.desc}</p>
                <p className="mt-3 text-sm font-medium text-ink">{p.proofPoints.join(' · ')}</p>

                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Project type">
                  {p.tags.map((t) => (
                    <li key={t} className="rounded-full border border-line px-3 py-1 text-xs text-ink/80">
                      {t}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`project-detail-${p.id}`}
                    onClick={() => setOpenId(isOpen ? null : p.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                  >
                    {isOpen ? 'Show less' : p.cta}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {p.link && (
                    <a href={p.link.href} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      {p.link.label}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {isOpen && (
                  <div id={`project-detail-${p.id}`} className="mt-5 space-y-5 border-t border-line pt-5 text-sm">
                    <p className="text-muted">{p.detail}</p>
                    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="Workflow stages">
                      {p.stages.map((s, j) => (
                        <li key={s} className="flex items-center gap-1">
                          {j > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />}
                          <span className="rounded-lg bg-primarySoft px-2.5 py-1 text-xs font-medium text-primary">{s}</span>
                        </li>
                      ))}
                    </ol>
                    <div>
                      <p className="font-medium text-ink">What this project shows</p>
                      <ul className="mt-2 space-y-1.5">
                        {p.proves.map((x) => (
                          <li key={x} className="flex gap-2 text-muted">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {p.note && <p className="font-display text-base text-ink">{p.note}</p>}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
