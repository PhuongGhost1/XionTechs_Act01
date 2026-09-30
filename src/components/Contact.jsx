import { useState } from 'react'
import { Copy, Mail, MapPin, Phone } from 'lucide-react'
import { contact, ctaBand } from '../content/site'
import SocialIcon from './SocialIcon'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: the address is still visible as text */
    }
  }

  return (
    <section id="contact" className="theme-fade border-t border-line bg-navy text-navyInk">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-navyInk/50">Work with us</p>
          <h2 className="mt-3 text-3xl md:text-4xl">{ctaBand.title}</h2>
          <p className="mt-4 max-w-md text-navyInk/60">{ctaBand.body}</p>
          <a
            href={`mailto:${contact.email}`}
            className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primaryInk transition hover:bg-primaryHover"
          >
            Book a call
          </a>
        </div>

        <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-navyInk/50">
              <Mail className="h-4 w-4" /> Email
            </dt>
            <dd className="mt-3 flex items-center gap-2 text-sm">
              <span>{contact.email}</span>
              <button
                type="button"
                onClick={copyEmail}
                aria-label="Copy email address"
                className="rounded-full border border-navyInk/20 p-1.5 text-navyInk/70 transition hover:border-navyAccent hover:text-navyAccent"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              {copied && <span className="text-xs text-navyAccent">Copied</span>}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-navyInk/50">
              <Phone className="h-4 w-4" /> Phone
            </dt>
            <dd className="mt-3 space-y-1 text-sm">
              {contact.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s+/g, '')}`} className="block hover:text-navyAccent">
                  {p}
                </a>
              ))}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-navyInk/50">
              <MapPin className="h-4 w-4" /> Offices
            </dt>
            <dd className="mt-3 space-y-2 text-sm text-navyInk/70">
              {contact.addresses.map((a) => (
                <p key={a}>{a}</p>
              ))}
            </dd>
          </div>
          <div className="flex gap-3 sm:col-span-2">
            {contact.social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-navyInk/20 text-navyInk/70 transition hover:border-primary hover:bg-primary hover:text-primaryInk"
              >
                <SocialIcon name={s.icon} />
              </a>
            ))}
          </div>
        </dl>
      </div>
    </section>
  )
}
