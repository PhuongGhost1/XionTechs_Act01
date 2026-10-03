// The arrow of a text link: a stem that grows on hover and focus (M15), then a head. Drawn,
// never typed, because the display font has no arrow glyph in its latin range. The parent link
// needs the `group` class; the styles are in onfile.css.
export default function Arrow() {
  return (
    <span className="of-arrow" aria-hidden="true">
      <span className="of-arrow__stem" />
      <svg viewBox="0 0 6 10" className="of-arrow__head">
        <path d="M1 1L5 5L1 9" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  )
}
