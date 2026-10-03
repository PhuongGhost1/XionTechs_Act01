import { frame } from '../content/index.js'

// STUB (WP1 replaces this file). First in tab order; visible only on focus. Targets <main id="main">.
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only z-50 bg-signal px-4 py-3 font-mono text-label font-medium uppercase text-onSignal focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      data-fill="signal"
    >
      {frame.skip.text}
    </a>
  )
}
