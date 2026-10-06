// Shared node styling for WorkflowGraph and WorkflowList. Off-path and dimmed nodes change their
// chrome (border) only; node text always keeps full contrast.
import { AlertTriangle, Bot, CheckCircle2, GitBranch, LoaderCircle, OctagonAlert, RotateCw, UserCheck, Zap } from 'lucide-react'
import { aiAgents } from '../content/site'

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

// failing → recovered → waiting/working → active → idle (on this run) → off (not on this run).
export function nodeStatus(id, run, state) {
  if (state.failing?.has(id)) return 'failing'
  if (state.recovered?.has(id)) return 'recovered'
  if (state.working.has(id)) return state.waiting ? 'waiting' : 'working'
  if (state.active.has(id)) return 'active'
  const onPath = run.steps.some((step) => step.includes(id))
  return onPath ? 'idle' : 'off'
}

const BORDER = {
  failing: 'border-danger',
  recovered: 'border-success',
  waiting: 'border-accent',
  working: 'border-accent',
  active: 'border-accent',
  idle: 'border-muted',
  off: 'border-muted',
}

// `dim` quiets the border while the run waits for the visitor (MOTION §12).
export function nodeClasses(node, status, selected, dim = false) {
  // Exactly one background, one text colour and one border colour per status — conflicting
  // Tailwind colour classes on one element are resolved by stylesheet order, not class order.
  const fill = status === 'active' && node.type === 'outcome' ? 'bg-accent text-paper' : 'bg-paper text-ink'
  const border = dim ? 'border-line' : BORDER[status]
  const dashed = status === 'off' || status === 'failing' ? 'border-dashed' : ''
  const sel = selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''
  return ['border', fill, border, dashed, sel].filter(Boolean).join(' ')
}

// Glow behind a node (opacity only): the waiting step gets the strongest one.
export function glowTone(status) {
  if (status === 'waiting') return 'focus'
  if (status === 'working') return 'accent'
  if (status === 'failing') return 'danger'
  if (status === 'recovered') return 'success'
  return undefined
}

// Status chip for a node in the current run, or null. Always icon + word, never colour alone.
// tone: accent | danger | success.
export function nodeChip(node, run, state, words = aiAgents.run.chip) {
  const id = node.id
  if (state.failing?.has(id)) return { Icon: OctagonAlert, word: run.fault ?? words.problem, tone: 'danger' }
  if (state.retrying.has(id)) return { Icon: RotateCw, word: words.retrying, tone: 'accent' }
  if (state.recovered?.has(id)) return { Icon: CheckCircle2, word: words.recovered, tone: 'success' }
  if (state.waiting && state.working.has(id)) return { Icon: UserCheck, word: words.waiting, tone: 'accent' }
  if (state.retried?.has(id)) return { Icon: RotateCw, word: words.retried, tone: 'accent' }
  // A retry drill shows its failure instead of a generic problem tag.
  if (run.problemNodeId === id && state.problemSeen && !run.retries?.size) return { Icon: AlertTriangle, word: words.problem, tone: 'accent' }
  if (state.working.has(id) && node.type === 'router') return { Icon: GitBranch, word: words.deciding, tone: 'accent' }
  if (state.working.has(id) && node.type !== 'trigger') return { Icon: LoaderCircle, word: words.working, tone: 'accent' }
  if (node.type === 'outcome' && state.active.has(id)) return { Icon: CheckCircle2, word: words.done, tone: 'success' }
  return null
}

// Chip colour classes per tone (full class names so Tailwind keeps them).
export const chipTone = {
  accent: { border: 'border-accent', icon: 'text-accent' },
  danger: { border: 'border-danger', icon: 'text-danger' },
  success: { border: 'border-success', icon: 'text-success' },
}
