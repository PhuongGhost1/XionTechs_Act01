import { brand, contact, footer } from '../content.js'
import { Container, Mono } from '../ui/index.jsx'

export default function Footer() {
  return (
    <footer className="border-t border-x-line bg-x-bg pb-16 pt-12 sm:pb-20">
      <Container className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <img src={brand.logo.src} width={brand.logo.width} height={brand.logo.height} alt="XionTechs" className="h-7 w-auto" loading="lazy" decoding="async" />
          <p className="mt-4 text-sm text-x-mute">{footer.line}</p>
          <Mono as="p" className="mt-6 text-x-faint">
            {footer.note}
          </Mono>
        </div>
        <div>
          <Mono as="h2" className="text-x-faint">
            Offices
          </Mono>
          <ul className="mt-4 space-y-3 text-sm text-x-mute">
            {contact.offices.map((o) => (
              <li key={o.address}>{o.address}</li>
            ))}
          </ul>
        </div>
        <div>
          <Mono as="h2" className="text-x-faint">
            Contact
          </Mono>
          <ul className="mt-4 space-y-2 text-sm text-x-mute">
            <li>
              <a className="underline decoration-x-line underline-offset-4 hover:text-x-text hover:decoration-x-signal" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </li>
            {contact.phones.map((p) => (
              <li key={p} className="tabular">
                <a className="hover:text-x-text" href={`tel:${p.replace(/\s/g, '')}`}>
                  {p}
                </a>
              </li>
            ))}
            {contact.social.map((s) => (
              <li key={s.label}>
                <a className="underline decoration-x-line underline-offset-4 hover:text-x-text hover:decoration-x-signal" href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  )
}
