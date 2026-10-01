// Shared node styling for WorkflowGraph and WorkflowList. Off-path nodes dim their chrome
// (dashed border) only — text always keeps full contrast.
import { Bot, CheckCircle2, GitBranch, UserCheck, Zap } from 'lucide-react'

export const typeIcon = {
  trigger: Zap,
  agent: Bot,
  router: GitBranch,
  human: UserCheck,
  outcome: CheckCircle2,
}

export const typeTag = {
  trigger: 'Trigger',
  human: 'Approval',
}

export function nodeStatus(id, run, state) {
  if (state.working.has(id)) return 'working'
  if (state.active.has(id)) return 'active'
  const onPath = run.steps.some((step) => step.includes(id))
  return onPath ? 'idle' : 'off'
}

export function nodeClasses(node, status, selected) {
  const base = 'border bg-surface text-ink transition-colors duration-300'
  const byStatus = {
    working: 'border-accent',
    active: node.type === 'outcome' ? 'border-accent bg-accent text-paper' : 'border-accent',
    idle: 'border-line',
    off: 'border-dashed border-line',
  }
  const sel = selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''
  return `${base} ${byStatus[status]} ${sel}`
}

export const isWorking = (status) => status === 'working'
