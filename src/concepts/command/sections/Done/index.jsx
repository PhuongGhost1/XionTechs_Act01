import { contact } from '../../content/index.js'
import { Reveal } from '../../ui/Reveal.jsx'
import { Composer } from './Composer.jsx'
import { Endpoints } from './Endpoints.jsx'
import { Finale } from './Finale.jsx'

// Station 06 DONE (doc 4.8). Two sections of one station (the footer follows <main>, App.jsx):
//   #done     the pinned finale: the X mark, the real logo, GET / IT / DONE. (Finale.jsx)
//   #contact  normal flow, below the pin: the composer and the endpoints. The finale and the core
//             never block it: this section sits above the canvas and starts after the pin ends.
//   footer    reversed logo, one line, build stamp, READ | RAW (Footer.jsx)
export default function Done() {
  return (
    <>
      <Finale />
      <section id="contact" aria-labelledby="contact-title" className="relative z-10">
        <div className="column flex flex-col gap-8 py-[var(--station-gap)] md:gap-12">
          <Reveal as="h2" id="contact-title" className="max-w-[18ch] font-display text-h2 font-medium text-ink">
            {contact.composer.heading.text}
          </Reveal>
          <Composer />
          <Endpoints />
        </div>
      </section>
    </>
  )
}
