// STUB (WP1 replaces this file). The yellow line that crosses the top of the viewport once when
// a key station activates (M05, doc 7.2). WP1 triggers it from the station change and from
// motion.css .anim-signal-line; under reduced motion the dock tick lights instead.
export default function SignalLine() {
  return (
    <div
      aria-hidden="true"
      data-decor=""
      data-signal-line=""
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px origin-left bg-signal opacity-0"
    />
  )
}
