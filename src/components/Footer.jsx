import { company, contact, footerBlurb, footerServiceLinks, footerCompanyLinks } from '../content/site'
import SocialIcon from './SocialIcon'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-navy text-paper/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={company.logo} alt={company.name} className="h-8 w-auto brightness-0 invert" />
          <p className="mt-4 text-sm">{footerBlurb}</p>
          <div className="mt-4 flex gap-3">
            {contact.social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/20 text-paper/70 transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 hover:border-accent hover:bg-accent hover:text-paper"
                aria-label={s.label}
              >
                <SocialIcon name={s.icon} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-paper">Address</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>{contact.email}</li>
            {contact.phones.map((p) => (
              <li key={p}>{p}</li>
            ))}
            {contact.addresses.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-paper">Company</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {footerCompanyLinks.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-paper">Services</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {footerServiceLinks.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/10 px-6 py-6 text-center text-sm">
        &copy; {new Date().getFullYear()} {company.legalName}. All Rights Reserved.
      </div>
    </footer>
  )
}
