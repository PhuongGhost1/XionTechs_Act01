import { useState } from 'react'
import { Copy, Mail, MapPin, Phone } from 'lucide-react'
import { contact, finalCta } from '../../../content/site'
import { loadAgentDemo } from './agentDemoLoader'
import FinalCompletion from './FinalCompletion'
import SocialIcon from './SocialIcon'
import { Eyebrow, PrimaryLink, SecondaryLink } from './ui'

// Plan v3 §15: the closing call to action, with every way to reach the team beside it, and the
// closing "Get IT Done" completion (MOTION §21) as the last thing on the page.
export default function Contact() {
  const [copied, setCopied] = useState(false)

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: the address is still visible and linked */
    }
  }

  const label = 'flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted'

  return (
    <section id="contact" data-tone="dark" aria-labelledby="contact-title" className="bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <Eyebrow>{finalCta.eyebrow}</Eyebrow>
          <h2 id="contact-title" className="mt-4 text-5xl leading-[1.05] md:text-6xl">
            {finalCta.title}
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-lg text-muted">{finalCta.intro}</p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <PrimaryLink href={finalCta.primary.href}>{finalCta.primary.label}</PrimaryLink>
            <SecondaryLink href={finalCta.secondary.href} onPointerEnter={loadAgentDemo} onFocus={loadAgentDemo}>
              {finalCta.secondary.label}
            </SecondaryLink>
          </div>
          <p className="mt-4 text-sm text-muted">{finalCta.primaryNote}</p>
        </div>

        <dl className="mt-20 grid grid-cols-1 gap-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.4fr_auto]">
          <div>
            <dt className={label}>
              <Mail aria-hidden="true" className="h-4 w-4" /> Email
            </dt>
            <dd className="mt-3 flex items-center gap-2">
              <a href={`mailto:${contact.email}`} className="break-all text-ink underline-offset-4 hover:text-primary hover:underline">
                {contact.email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                aria-label="Copy email address"
                className="rounded-full border border-line p-1.5 text-muted transition-colors hover:border-primary hover:text-primary"
              >
                <Copy aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              <span aria-live="polite" className="text-xs text-primary">
                {copied ? 'Copied' : ''}
              </span>
            </dd>
          </div>
          <div>
            <dt className={label}>
              <Phone aria-hidden="true" className="h-4 w-4" /> Phone
            </dt>
            <dd className="mt-3 space-y-1">
              {contact.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s+/g, '')}`} className="block tabular-nums text-ink hover:text-primary">
                  {p}
                </a>
              ))}
            </dd>
          </div>
          <div>
            <dt className={label}>
              <MapPin aria-hidden="true" className="h-4 w-4" /> Offices
            </dt>
            <dd className="mt-3 space-y-2 text-sm text-muted">
              {contact.addresses.map((a) => (
                <p key={a}>{a}</p>
              ))}
            </dd>
          </div>
          <div>
            <dt className={label}>Follow</dt>
            <dd className="mt-3 flex gap-3">
              {contact.social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${s.label} (opens in a new tab)`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:bg-primary hover:text-primaryInk"
                >
                  <SocialIcon name={s.icon} />
                </a>
              ))}
            </dd>
          </div>
        </dl>

        {/* MOTION §21: the page's visual conclusion, played once as the visitor reaches it. */}
        <div className="mt-20 border-t border-line pt-16 md:pt-20">
          <FinalCompletion />
        </div>
      </div>
    </section>
  )
}
