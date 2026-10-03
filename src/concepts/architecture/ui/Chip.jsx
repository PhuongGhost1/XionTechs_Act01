/**
 * Status chip. Dashed outline = illustrative or pending confirmation, solid with a yellow square = seen in
 * the product. The meaning is carried by the text as well, never by line style alone (brief 00 a11y).
 */
export default function Chip({ kind = 'illustrative', children, className = '' }) {
  return <span className={`bp-chip bp-mono ${kind === 'confirmed' ? 'bp-chip--confirmed' : ''} ${className}`}>{children}</span>
}
