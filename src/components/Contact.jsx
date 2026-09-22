import { Phone, Mail, MapPin } from 'lucide-react'
import { contact } from '../content/site'
import IconBadge from './IconBadge'

export default function Contact() {
  return (
    <section id="contact" className="border-t border-line bg-navy text-paper">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl md:text-4xl">Let&rsquo;s build something real</h2>
        <p className="mt-3 max-w-xl text-paper/60">
          Reach out and we&rsquo;ll get back to you from one of our offices below.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div className="group">
            <IconBadge icon={Phone} size="sm" />
            <h3 className="mt-4 text-sm font-medium uppercase tracking-wide text-paper/40">
              Phone
            </h3>
            <ul className="mt-3 space-y-1 text-sm">
              {contact.phones.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>

          <div className="group">
            <IconBadge icon={Mail} size="sm" />
            <h3 className="mt-4 text-sm font-medium uppercase tracking-wide text-paper/40">
              Email
            </h3>
            <p className="mt-3 text-sm">{contact.email}</p>
          </div>

          <div className="group">
            <IconBadge icon={MapPin} size="sm" />
            <h3 className="mt-4 text-sm font-medium uppercase tracking-wide text-paper/40">
              Offices
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-paper/70">
              {contact.addresses.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
