import { ArrowUp, ArrowUpRight } from 'lucide-react'
import { brand, footer } from './content'
import { telHref } from './frameFormat'
import { useThemeMode } from './theme'
import './Footer.css'

// NEEDS content.js: structural labels for the footer.
const LABELS = {
  contact: 'Contact',
  offices: 'Offices',
  follow: 'Follow',
  top: 'Back to Top',
  newTab: ' (opens in a new tab)',
}

const heading = 'cmd-label mb-4 text-cmd-faint'
// A text link: muted, with a hairline underline that turns yellow on hover. 44 px tall on touch.
const link =
  'inline-flex min-h-8 items-center gap-1.5 text-cmd-muted underline decoration-cmd-line decoration-1 underline-offset-[5px] transition-colors duration-micro ease-cmd hover:text-cmd-text hover:decoration-cmd-signal focus-visible:text-cmd-text [@media(pointer:coarse)]:min-h-11'

export default function Footer() {
  const logo = useThemeMode() === 'light' ? brand.logoLight : brand.logo
  return (
    // Opaque and above the fixed canvas, which must not show through behind the footer.
    <footer className="relative z-10 border-t border-cmd-line bg-cmd-bg">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <div className="cmd-foot__grid">
          <div className="cmd-foot__cell">
            <img src={logo.src} width={logo.width} height={logo.height} alt={brand.name} className="h-8 w-auto" />
            <p className="mt-5 max-w-sm text-pretty text-sm leading-relaxed text-cmd-muted">{footer.positioning}</p>
          </div>

          <div className="cmd-foot__cell">
            <h2 className={heading}>{LABELS.contact}</h2>
            <ul className="font-cmd-mono text-[13px]">
              <li>
                <a href={`mailto:${footer.email}`} className={link}>
                  {footer.email}
                </a>
              </li>
              {footer.phones.map((phone) => (
                <li key={phone}>
                  <a href={telHref(phone)} className={link}>
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="cmd-foot__cell">
            <h2 className={heading}>{LABELS.offices}</h2>
            <address className="max-w-xs space-y-3 text-sm not-italic leading-relaxed text-cmd-muted">
              {footer.addresses.map((address) => (
                <p key={address}>{address}</p>
              ))}
            </address>
          </div>

          <div className="cmd-foot__cell">
            <h2 className={heading}>{LABELS.follow}</h2>
            <ul className="font-cmd-mono text-[13px]">
              {footer.social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={link}>
                    {s.label}
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                    <span className="sr-only">{LABELS.newTab}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="cmd-label flex flex-col gap-1 border-t border-cmd-line py-4 text-cmd-faint sm:flex-row sm:items-center sm:justify-between sm:gap-6 [&>p]:py-1">
          <p>{footer.copyright}</p>
          <p className="sm:flex-1 sm:text-center">{footer.note}</p>
          <a
            href="#top"
            className="inline-flex min-h-8 items-center gap-2 text-cmd-muted transition-colors duration-micro ease-cmd hover:text-cmd-signal-fg focus-visible:text-cmd-signal-fg [@media(pointer:coarse)]:min-h-11"
          >
            {LABELS.top}
            <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </footer>
  )
}
