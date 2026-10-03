// Small drawing marks. `Cross` is the registration mark at sheet corners; `XMark` is the X of the brand
// logo turned into a structural element (brief 00: do not use the X only as the logo). The vector logo has
// not been supplied, so the mark is drawn here from two strokes, navy and yellow, like the logo's X.
// The finale converges onto the same two strokes: keep `X_STROKES` in finale/converge.js in step with this.

export function Cross({ className = '', size = 16 }) {
  const c = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true" focusable="false">
      <path d={`M${c} 0V${size}M0 ${c}H${size}`} fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx={c} cy={c} r={size * 0.22} fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export function XMark({ className = '', title }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      <path d="M16 14 84 86" fill="none" className="stroke-bp-line" strokeWidth="13" strokeLinecap="square" />
      <path d="M84 14 16 86" fill="none" className="stroke-bp-signal" strokeWidth="13" strokeLinecap="square" />
    </svg>
  )
}
