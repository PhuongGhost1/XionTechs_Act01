import { useId } from 'react'
import { AlertTriangle, Bot, CheckCircle2, Flag, GitBranch, OctagonAlert, RotateCw, Undo2, UserCheck, Zap } from 'lucide-react'

// Icon per log tone; the words carry the meaning, the icon and colour only support it.
const TONE = {
  signal: [Zap, 'text-accent'],
  working: [Bot, 'text-accent'],
  decision: [GitBranch, 'text-accent'],
  problem: [AlertTriangle, 'text-accent'],
  approval: [UserCheck, 'text-accent'],
  approved: [CheckCircle2, 'text-success'],
  rejected: [Undo2, 'text-accent'],
  error: [OctagonAlert, 'text-danger'],
  retry: [RotateCw, 'text-accent'],
  success: [CheckCircle2, 'text-success'],
  done: [Flag, 'text-success'],
}

const SIZE = 3

// The small execution log (MOTION §8): the newest few entries from src/workflow/log.js. Not a
// live region; the status line above the workflow announces changes.
export default function AgentRunLog({ title, entries, className = '' }) {
  const id = useId()
  const shown = entries.slice(-SIZE)
  return (
    <div className={`rounded-xl border border-line bg-surface p-3 shadow-depth-2 ${className}`}>
      <p id={id} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {title}
      </p>
      <ol aria-labelledby={id} className="mt-2 space-y-1.5">
        {shown.map((e, i) => {
          const [Icon, colour] = TONE[e.tone]
          const latest = i === shown.length - 1
          return (
            <li key={e.key} className="wf-rise flex min-w-0 items-start gap-2 text-xs leading-snug">
              <Icon aria-hidden="true" className={`mt-px h-3.5 w-3.5 shrink-0 ${colour}`} strokeWidth={2} />
              <span className={`min-w-0 ${latest ? 'font-medium text-ink' : 'text-muted'}`}>
                {e.text}
                {e.detail && <span className="font-normal text-muted"> · {e.detail}</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
