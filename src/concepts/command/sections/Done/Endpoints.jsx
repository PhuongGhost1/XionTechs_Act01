import { contact } from '../../content/index.js'
import { cx } from '../../ui/cx.js'

// The endpoints as spec rows (doc 4.8): EMAIL, PHONE US, PHONE VN, LINKEDIN, FACEBOOK, straight
// from content contact.endpoints. Each row is ONE link covering the whole row, so a tap anywhere
// on it works. The email row is the contact row of doc 4.9 step 4: the largest tap target on the
// page, set at display size. No office, no street address, no legal name (those are review only).

function Arrow() {
  // Same drawn arrow as Button: a stem that extends on hover and focus (M15), transform only.
  return (
    <span aria-hidden="true" data-decor="" className="relative block h-[10px] w-[56px] shrink-0 max-sm:hidden">
      <span className="absolute right-px top-1/2 h-px w-full origin-right -translate-y-1/2 scale-x-[0.43] bg-current transition-transform duration-ui ease-ui group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-off:transition-none" />
      <svg viewBox="0 0 6 10" className="absolute right-0 top-0 h-[10px] w-[6px]">
        <path d="M1 1L5 5L1 9" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  )
}

const external = (e) => e.kind === 'social'

function rowProps(e) {
  return external(e) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

export function Endpoints() {
  const lead = contact.endpoints.find((e) => e.kind === 'email')
  const rest = contact.endpoints.filter((e) => e !== lead)
  const row =
    'group relative flex w-full px-4 transition-colors duration-ui ease-ui hover:bg-panel focus-visible:bg-panel motion-off:transition-none'

  return (
    <ul className="flex flex-col border-y border-hair">
      {lead && (
        <li>
          <a
            href={lead.href}
            data-flow=""
            className={cx(row, 'contact-lead flex-col justify-between gap-6 py-5 sm:py-6')}
          >
            <span className="font-mono text-label uppercase text-ink3">{lead.label}</span>
            <span className="flex items-end justify-between gap-6">
              <span className="contact-lead-value min-w-0 break-words font-display font-medium text-ink">
                {lead.text}
              </span>
              <Arrow />
            </span>
          </a>
        </li>
      )}
      {rest.map((e) => (
        <li key={e.id} className="border-t border-hair">
          <a
            href={e.href}
            {...rowProps(e)}
            className={cx(
              row,
              'min-h-16 items-center gap-x-3 gap-y-1 py-3 font-mono max-sm:flex-col max-sm:items-start max-sm:justify-center',
            )}
          >
            <span className="shrink-0 text-label uppercase text-ink3">{e.label}</span>
            <span
              aria-hidden="true"
              data-leader=""
              className="min-w-4 flex-1 border-b border-dotted border-hairStrong max-sm:hidden"
            />
            <span className="min-w-0 break-all text-[0.9375rem] text-ink">
              {e.text}
              {external(e) && <span className="sr-only"> {contact.newTab.text}</span>}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
