// Square-cornered link-button. Hover or focus extends a yellow dimension line under it (CSS `.bp-btn::after`).
// `variant` is "primary" (navy fill) or "ghost" (hairline outline). Always an <a>: every CTA here navigates.
export default function Button({ href, variant = 'primary', children, className = '', ...rest }) {
  return (
    <a href={href} className={`bp-btn bp-btn--${variant} ${className}`} {...rest}>
      <span>{children}</span>
      <span className="bp-btn__mark" aria-hidden="true" />
    </a>
  )
}
