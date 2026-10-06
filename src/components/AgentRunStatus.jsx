import { Activity, CheckCircle2, GitBranch, OctagonAlert, Pause, RotateCw, UserCheck } from 'lucide-react'

const PHASE = {
  running: [Activity, 'border-accent text-accent'],
  decision: [GitBranch, 'border-accent text-accent'],
  approval: [UserCheck, 'border-accent text-accent'],
  error: [OctagonAlert, 'border-danger text-danger'],
  retrying: [RotateCw, 'border-accent text-accent'],
  recovered: [CheckCircle2, 'border-success text-success'],
  completed: [CheckCircle2, 'border-success text-success'],
  paused: [Pause, 'border-line text-muted'],
}

// Simple run status (MOTION §10): a phase chip and one aria-live line. While the run waits for the
// visitor it adds the human-control message (MOTION §12). The chip repeats the line's meaning, so
// it is hidden from screen readers.
export default function AgentRunStatus({ phase, word, text, message, statusRef, className = '' }) {
  const [Icon, tone] = PHASE[phase] ?? PHASE.running
  return (
    <div
      ref={statusRef}
      tabIndex={-1}
      aria-live="polite"
      className={`rounded-xl border bg-surface p-3 shadow-depth-2 focus:outline-none ${phase === 'approval' ? 'border-accent' : 'border-line'} ${className}`}
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink">
        <span aria-hidden="true" className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
          <Icon className="h-3 w-3" strokeWidth={2} />
          {word}
        </span>
        <span className="min-w-0">{text}</span>
      </p>
      {message && (
        <p className="wf-rise mt-2 flex items-center gap-1.5 text-sm font-medium text-accent">
          <UserCheck aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {message}
        </p>
      )}
    </div>
  )
}
