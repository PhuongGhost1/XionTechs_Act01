import { Bot, CheckCircle2, GitBranch, UserCheck, Zap } from 'lucide-react'

// Illustrative mock-up of an agent workflow, in the same node-and-connector language as the
// Agent Demo but static: the demo is the interactive version. Labels come from `projects[].mock`.
const line = 'mx-auto h-3 w-px bg-accent'
const card = 'flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 font-medium text-ink'

export default function MockAgentFlow({ project }) {
  const { flow } = project.mock
  return (
    <div className="p-4 text-xs sm:p-5">
      <div className="mx-auto max-w-sm">
        <div className={`${card} mx-auto w-fit rounded-full`}>
          <Zap className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
          {flow.trigger}
        </div>
        <div className={line} />
        <div className={`${card} mx-auto w-fit`}>
          <Bot className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
          {flow.triage}
        </div>
        <div className={line} />
        <div className={`${card} mx-auto w-fit rounded-full border-dashed`}>
          <GitBranch className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
          {flow.decision}
        </div>
        <div className={line} />
        <div className="mx-auto h-3 w-1/2 rounded-t-lg border-x border-t border-accent" />
        <div className="grid grid-cols-2 gap-3">
          {flow.agents.map((a) => (
            <div key={a.title} className={`${card} flex-col items-start gap-1`}>
              <span className="flex items-center gap-2">
                <Bot className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.75} />
                {a.title}
              </span>
              <span className="rounded border border-dashed border-line px-1.5 text-[11px] font-normal text-muted">{a.does}</span>
            </div>
          ))}
        </div>
        <div className="mx-auto h-3 w-1/2 rounded-b-lg border-x border-b border-accent" />
        <div className={line} />
        <div className={`${card} mx-auto w-fit border-accent ring-2 ring-accent/30`}>
          <UserCheck className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
          {flow.approval}
        </div>
        <div className={line} />
        <div className="mx-auto flex w-fit items-center gap-2 rounded-xl bg-primary px-3 py-2 font-medium text-primaryInk">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          {flow.outcome}
        </div>
      </div>
    </div>
  )
}
