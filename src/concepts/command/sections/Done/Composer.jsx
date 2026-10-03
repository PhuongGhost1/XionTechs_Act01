import { useEffect, useRef, useState } from 'react'
import { contact } from '../../content/index.js'
import { useBrief } from '../../runtime/hooks.js'
import { Button } from '../../ui/Button.jsx'
import { Frame } from '../../ui/Frame.jsx'
import { Label } from '../../ui/Label.jsx'
import { COPIED_MS, copyText } from './copy.js'

// The composer (doc 4.8, 4.9 step 4, M17): everything the visitor selected while reading, a note
// of their own, and two ways out. SEND EMAIL is a plain <a href="mailto:..."> that is rebuilt from
// the brief and the note on every change, so it works with no script at the moment of the click
// and for 0, 1 or any number of selections. COPY TEXT is the way out when no mail app opens.
// The form never posts: there is no submit control and no action, and Enter in the textarea is
// just a new line. Nothing is stored, nothing is sent anywhere.

const { composer, mail } = contact

function BriefGroup({ heading, items }) {
  return (
    <div className="flex flex-col gap-2">
      <Label as="p">{heading}</Label>
      <ul className="flex flex-col font-mono text-data text-ink">
        {items.map((item) => (
          <li key={item.id} className="flex items-baseline gap-3 border-t border-hair py-2 first:border-t-0">
            {/* A 6 px confirmed node, as in the arm instrument: solid, because every item here
                is a service or record the page already shows as real. */}
            <span aria-hidden="true" data-decor="" className="h-[6px] w-[6px] shrink-0 rounded-full bg-ink2" />
            <span className="min-w-0 break-words">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Composer() {
  const brief = useBrief()
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const timer = useRef(0)
  const fallbackRef = useRef(null)

  const mailto = brief.mailto(note)
  const text = brief.text(note)
  // The cap of brief.js cut the note: say so, so the visitor is not surprised by the marker.
  const cut = text.includes(mail.truncated.text)
  const services = brief.items.filter((i) => i.kind === 'service')
  const looked = brief.items.filter((i) => i.kind === 'record')

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // When both copy routes are refused, show the text selected so Ctrl+C / long press works.
  useEffect(() => {
    if (!blocked) return
    fallbackRef.current?.focus()
    fallbackRef.current?.select()
  }, [blocked])

  async function onCopy() {
    const ok = await copyText(text)
    window.clearTimeout(timer.current)
    setBlocked(!ok)
    setCopied(ok)
    if (ok) timer.current = window.setTimeout(() => setCopied(false), COPIED_MS)
  }

  return (
    <Frame
      as="form"
      noValidate
      onSubmit={(e) => e.preventDefault()}
      className="bg-void/40"
    >
      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-hair">
        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:p-8">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Label as="p">{composer.briefLabel.text}</Label>
            {brief.count > 0 && (
              <button
                type="button"
                onClick={brief.clear}
                className="inline-flex h-11 min-w-11 items-center justify-center px-3 font-mono text-label uppercase text-ink2 transition-colors duration-ui ease-ui hover:text-ink motion-off:transition-none"
              >
                {composer.clear.text}
              </button>
            )}
          </div>
          <div className="composer-pane flex flex-col gap-4">
            {brief.count === 0 ? (
              <p className="font-mono text-data text-ink3">{composer.briefEmpty.text}</p>
            ) : (
              <>
                {services.length > 0 && <BriefGroup heading={mail.servicesHeading.text} items={services} />}
                {looked.length > 0 && <BriefGroup heading={mail.recordsHeading.text} items={looked} />}
              </>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4 border-t border-hair p-4 sm:p-6 lg:border-t-0 lg:p-8">
          <label htmlFor="brief-note" className="flex min-h-11 flex-wrap items-center justify-between gap-x-3">
            <Label as="span">{composer.noteLabel.text}</Label>
            <Label as="span">{composer.noteOptional.text}</Label>
          </label>
          <textarea
            id="brief-note"
            name="note"
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="composer-pane block w-full resize-y rounded-none border border-hairStrong bg-void px-4 py-3 font-body text-base leading-6 text-ink transition-colors duration-ui ease-ui focus-visible:border-ink2 motion-off:transition-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t border-hair p-4 sm:p-6 md:flex-row md:flex-wrap md:items-start md:gap-x-10 lg:p-8">
        <div className="flex flex-col gap-2">
          <Button href={mailto} arrow="right" flow aria-describedby="contact-send-hint" className="self-start max-sm:w-full max-sm:justify-between">
            {composer.send.text}
          </Button>
          <p id="contact-send-hint" className="composer-hint text-data text-ink2">
            {composer.sendHint.text}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="ghost" flow onClick={onCopy} className="min-w-[min(11rem,100%)] self-start justify-center max-sm:w-full">
            {copied ? composer.copied.text : composer.copy.text}
          </Button>
          <p className="composer-hint text-data text-ink2">{composer.copyHint.text}</p>
        </div>
      </div>

      {/* One polite live region: COPIED, a blocked copy and a cut note are announced here (M17). */}
      <div aria-live="polite" className="px-4 sm:px-6 lg:px-8">
        {copied && <span className="sr-only">{composer.copied.text}</span>}
        {(cut || blocked) && (
          <div className="flex flex-col gap-3 pb-4 sm:pb-6 lg:pb-8">
            {cut && <p className="font-mono text-data text-ink2">{composer.noteLong.text}</p>}
            {blocked && (
              <>
                <p className="font-mono text-data text-ink">{composer.copyFailed.text}</p>
                <textarea
                  ref={fallbackRef}
                  readOnly
                  value={text}
                  rows={8}
                  aria-label={composer.copy.text}
                  className="block w-full resize-y rounded-none border border-hairStrong bg-void px-4 py-3 font-mono text-data leading-6 text-ink"
                />
              </>
            )}
          </div>
        )}
      </div>
    </Frame>
  )
}
