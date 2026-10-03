import { brand, meta, sheetOf, sheets, titleBlock, ui } from '../content.js'
import Chip from '../ui/Chip.jsx'
import { Cross } from '../ui/Marks.jsx'
import Plot from '../ui/Plot.jsx'
import { copy } from './copy.js'

// The footer is the title block of the drawing set: a bordered grid of cells in the bottom right corner of an
// engineering sheet (studio, drawing, scale, sheet, revision), here full width, with the About text and the
// contact details as cells. Hairlines are the 1 px gap between cells over a `bp-rule` background.
// REV is the real git commit count injected by Vite; the SYS / ARCH / BUILD labels are the brief's decoration.

const BUILD = typeof __BUILD_NUMBER__ === 'number' ? __BUILD_NUMBER__ : 0
const sheet = sheetOf('about')
const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`
const { about, contact, fields } = titleBlock

function Cell({ className = '', children, ...rest }) {
  return (
    <div className={`bg-bp-bg p-5 lg:p-6 ${className}`} {...rest}>
      {children}
    </div>
  )
}

function Label({ as = 'p', className = '', ...rest }) {
  const Tag = as
  return <Tag className={`bp-mono text-bp-mute ${className}`} {...rest} />
}

function Row({ label, children }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-4">
      <dt className="bp-mono pt-1 text-bp-mute">{label}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  )
}

export default function TitleBlock() {
  return (
    <Plot className="bp-wrap pb-6 pt-20 lg:pb-8 lg:pt-28">
      <div className="fn-tb bp-rise grid grid-cols-2 gap-px border border-bp-rule bg-bp-rule lg:grid-cols-12">
        <Cell className="col-span-2 flex flex-col justify-between gap-10 lg:col-span-3">
          <img src={brand.logoReversed.src} width={brand.logoReversed.width} height={brand.logoReversed.height} alt={copy.logoAlt} className="h-auto max-w-full" />
          <div>
            <Label>{fields.studio}</Label>
            <p className="mt-1 text-[0.9375rem] text-bp-text">{brand.legalName}</p>
          </div>
        </Cell>

        <Cell className="col-span-2 md:col-span-1 lg:col-span-5">
          <Label as="h3">{about.heading}</Label>
          <p className="mt-4 max-w-[36ch] text-[1.1875rem] leading-snug text-bp-text">{about.body}</p>
          <div className="mt-6 border border-dashed border-bp-mute/70 p-4">
            <ul className="grid gap-5 sm:grid-cols-2" role="list">
              {about.facts.map((fact) => (
                <li key={fact.value}>
                  <span className="bp-display block text-[2.6rem] text-bp-text">{fact.value}</span>
                  <span className="mt-2 block text-[0.875rem] leading-snug text-bp-mute">{fact.label}</span>
                </li>
              ))}
            </ul>
            <Chip className="mt-5">{about.factNote}</Chip>
          </div>
        </Cell>

        <Cell id="contact" tabIndex={-1} role="group" aria-labelledby="contact-title" className="fn-anchor col-span-2 md:col-span-1 lg:col-span-4">
          <Label as="h3" id="contact-title">
            {contact.heading}
          </Label>
          <address className="mt-4 text-[0.9375rem] not-italic leading-snug text-bp-text">
            <dl className="grid gap-5">
              <Row label={copy.labels.email}>
                <a href={`mailto:${contact.email}`} className="inline-block py-1">
                  {contact.email}
                </a>
              </Row>
              <Row label={copy.labels.phone}>
                {contact.phones.map((phone) => (
                  <a key={phone} href={telHref(phone)} className="block py-1">
                    {phone}
                  </a>
                ))}
              </Row>
              <Row label={copy.labels.address}>
                {contact.addresses.map((line) => (
                  <p key={line} className="mb-2 last:mb-0">
                    {line}
                  </p>
                ))}
              </Row>
              <Row label={copy.labels.social}>
                <ul className="flex flex-wrap gap-x-5" role="list">
                  {contact.social.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-block py-1">
                        {s.label}
                        <span className="sr-only"> ({copy.newTab})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </Row>
            </dl>
          </address>
        </Cell>

        <Cell className="col-span-2 lg:col-span-4">
          <Label>{fields.drawing}</Label>
          <p className="mt-1 text-[0.9375rem] text-bp-text">{fields.drawingValue}</p>
        </Cell>
        <Cell className="lg:col-span-2">
          <Label>{fields.scale}</Label>
          <p className="mt-1 text-[0.9375rem] text-bp-text">{fields.scaleValue}</p>
        </Cell>
        <Cell className="lg:col-span-2">
          <Label>{fields.sheet}</Label>
          <p className="bp-mono mt-1 text-bp-text">
            {sheet.no} {ui.of} {String(sheets.length).padStart(2, '0')}
          </p>
        </Cell>
        <Cell className="lg:col-span-2">
          <Label>{fields.revision}</Label>
          <p className="bp-mono mt-1 text-bp-text">
            {ui.rev}.{BUILD}
          </p>
        </Cell>
        <Cell className="lg:col-span-2">
          <Label>{copy.labels.reference}</Label>
          <ul className="bp-mono mt-1 text-bp-text" role="list">
            {[meta.sys, meta.arch, meta.build].map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Cell>
      </div>

      <div aria-hidden="true" className="mt-4 flex justify-between text-bp-line">
        <Cross />
        <Cross />
      </div>
    </Plot>
  )
}
