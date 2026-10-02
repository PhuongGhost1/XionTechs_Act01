import { lazy, Suspense } from 'react'
import { aiAgents } from '../content/site'
import { loadAgentDemo } from './agentDemoLoader'
import { iconMap } from './icons'
import SectionErrorBoundary from './SectionErrorBoundary'
import { DraftMark, Eyebrow } from './ui'

const AgentDemo = lazy(loadAgentDemo)

// Dark section around the lazy Agent Demo. The anchor lives here, outside the lazy chunk, so
// links to #ai-agents work before the demo has loaded.
export default function AiAgents() {
  return (
    <section id="ai-agents" data-tone="dark" aria-labelledby="ai-agents-title" className="bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16">
          <div>
            <Eyebrow>{aiAgents.eyebrow}</Eyebrow>
            <h2 id="ai-agents-title" className="mt-4 text-4xl leading-[1.1] md:text-5xl">
              {aiAgents.title}
            </h2>
          </div>
          <p className="text-pretty text-lg text-muted">{aiAgents.intro}</p>
        </div>

        <div className="mt-12">
          <SectionErrorBoundary>
            <Suspense
              fallback={
                <div aria-busy="true" className="flex min-h-[32rem] items-center justify-center rounded-2xl border border-line bg-surface text-sm text-muted">
                  Loading the agent demo…
                </div>
              }
            >
              <AgentDemo />
            </Suspense>
          </SectionErrorBoundary>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-10 border-t border-line pt-10 md:grid-cols-3">
          {aiAgents.callouts.map((c) => {
            const Icon = iconMap[c.icon]
            return (
              <li key={c.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-accent">
                  {Icon && <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />}
                </span>
                <h3 className="mt-5 text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-pretty text-muted">
                  {c.desc}
                  <DraftMark draft={c.draft} />
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
