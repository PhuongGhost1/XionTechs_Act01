// Shared node styling for WorkflowGraph and WorkflowList. Off-path nodes dim their chrome
// (dashed border) only — text always keeps full contrast.
import { AlertTriangle, Bot, CheckCircle2, GitBranch, RotateCw, UserCheck, Zap } from 'lucide-react'

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
  // Exactly one background, one text colour and one border colour per status — conflicting
  // Tailwind colour classes on one element are resolved by stylesheet order, not class order.
  const base = 'border transition-colors duration-300'
  const byStatus = {
    working: 'bg-paper text-ink border-accent',
    active: node.type === 'outcome' ? 'bg-accent text-paper border-accent' : 'bg-paper text-ink border-accent',
    idle: 'bg-paper text-ink border-muted',
    off: 'bg-paper text-ink border-dashed border-muted',
  }
  const sel = selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''
  return `${base} ${byStatus[status]} ${sel}`
}

export const isWorking = (status) => status === 'working'

// Problem / retry tag for a node in the current run, or null. Icon + word, never colour alone.
export function runTag(nodeId, run, state, reduced = false) {
  if (state.retrying.has(nodeId)) return { Icon: RotateCw, word: 'Retrying' }
  if ((reduced || state.done || state.waiting) && [...run.retries].some((i) => run.steps[i].includes(nodeId))) {
    return { Icon: RotateCw, word: 'Retried' }
  }
  if (run.problemNodeId === nodeId && state.problemSeen) return { Icon: AlertTriangle, word: 'Problem' }
  return null
}
