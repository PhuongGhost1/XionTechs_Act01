import { chips } from '../content.js'
import Chip from './Chip.jsx'

const reviewing = () =>
  Boolean(import.meta.env && import.meta.env.DEV) ||
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('review'))

/** A "Draft" marker for copy written for this concept and not yet signed off. Dev and `?review` only. */
export function DraftMark({ on }) {
  if (!on || !reviewing()) return null
  return <Chip kind="illustrative">{chips.draft}</Chip>
}

/**
 * Kicker, headline and lede, the same on every sheet. The headline carries the id `${id}-title`, which the
 * enclosing <section> should reference with aria-labelledby.
 */
export default function SectionHead({ id, kicker, title, lede, draft, className = '', ledeClassName = '' }) {
  return (
    <header className={className}>
      <p className="bp-mono text-bp-mute">{kicker}</p>
      <h2 id={`${id}-title`} className="bp-h2 mt-3 text-[clamp(2.4rem,5.6vw,5rem)] text-bp-text">
        {title}
      </h2>
      {lede ? (
        <p className={`bp-lede mt-5 max-w-[46ch] text-bp-mute ${ledeClassName}`}>
          {lede} <DraftMark on={draft} />
        </p>
      ) : null}
    </header>
  )
}
