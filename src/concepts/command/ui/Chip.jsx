import { legend, showDraftMarks } from '../content/index.js'
import { cx } from './cx.js'
import { CHIP_KINDS } from './kinds.js'

// <Chip kind="live|real|sample|measured|build|pending|illustrative|draft">word</Chip>
// A chip is always a word, never colour alone (doc 5.5): solid outline = a source, dashed =
// not confirmed, hatched = artwork. Children override the default word (a PENDING chip carries
// the value it stands for). `draft` renders only in dev or with ?review; pass `review` to force
// that for a test.
// Every chip carries data-chip="<kind>": the ledger's chip highlight (M18) selects on it.

const WORDS = Object.fromEntries(legend.chips.map((c) => [c.kind, c.text]))
const MEANINGS = Object.fromEntries(Object.entries(legend.meanings).map(([k, v]) => [k, v.text]))

const LOOK = {
  live: 'border border-ink3 text-ink2',
  real: 'border border-ink3 text-ink2',
  sample: 'border border-dashed border-ink3 text-ink3',
  measured: 'border border-ink3 text-ink2',
  build: 'border border-ink3 text-ink2',
  pending: 'border border-dashed border-ink3 text-ink3',
  illustrative: 'hatch border border-ink3 text-ink2',
  draft: 'border border-dashed border-ink3 text-ink3',
}

export function Chip({ kind, children, className, review }) {
  if (!CHIP_KINDS.includes(kind)) return null
  if (kind === 'draft' && !(review ?? showDraftMarks())) return null
  return (
    <span
      data-chip={kind}
      title={MEANINGS[kind]}
      className={cx(
        'inline-flex items-center rounded-chip px-2 py-0.5 font-mono text-label font-medium uppercase',
        LOOK[kind],
        className,
      )}
    >
      {children ?? WORDS[kind]}
    </span>
  )
}
