import { useCallback, useEffect, useRef, useState } from 'react'
import { contact, finale } from '../content.js'
import { useReducedMotion, useScrollProgress } from '../hooks/index.js'
import { Button, Container, Mono, Reveal, Section } from '../ui/index.jsx'
import { convergeProgress, logoBox, pointAt } from './converge.js'
import { LOGO } from './logoPoints.js'

const channel = (name) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace(/\s+/g, ',')
  return `rgb(${v})`
}

// The ending (BRIEF §15). A 2D canvas, not WebGL: about 570 points start on the diagonals of the
// page's X network and converge onto the logo as the visitor scrolls. It is scrubbed by scroll, so it
// costs nothing at rest and reverses on scroll up. Without motion the logo is simply formed.
export default function Finale() {
  const reduced = useReducedMotion()
  return (
    <Section id="build" className="overflow-clip pb-24 pt-24 lg:pb-32 lg:pt-32">
      <Container>
        <Mono as="p" className="flex items-center gap-3 text-x-faint">
          <span className="text-x-text">06</span>
          <span aria-hidden="true" className="h-px w-8 bg-x-line" />
          <span>{finale.kicker}</span>
        </Mono>

        <Stage reduced={reduced} />

        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h2 className="x-display text-[clamp(3.25rem,13vw,10.5rem)]">
            {finale.headline.map((line, i) => (
              <span
                key={line}
                className={`block ${i === 1 ? 'sm:pl-[10vw]' : i === 2 ? 'text-x-signal sm:pl-[20vw]' : ''}`}
              >
                {line}
              </span>
            ))}
          </h2>

          <Reveal className="max-w-md">
            <Button href={finale.cta.href} arrow={finale.cta.arrow} className="w-full justify-between sm:w-auto">
              {finale.cta.label}
            </Button>
            <div className="mt-10 border-t border-x-line pt-6">
              <Mono as="h3" className="text-x-faint">
                {finale.contactTitle}
              </Mono>
              <ul className="mt-4 space-y-2 text-base text-x-mute">
                <li>
                  <a
                    className="underline decoration-x-line underline-offset-4 transition-colors duration-200 ease-x hover:text-x-text hover:decoration-x-signal"
                    href={`mailto:${contact.email}`}
                  >
                    {contact.email}
                  </a>
                </li>
                {contact.phones.map((p) => (
                  <li key={p} className="tabular">
                    <a className="transition-colors duration-200 ease-x hover:text-x-text" href={`tel:${p.replace(/\s/g, '')}`}>
                      {p}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}

function Stage({ reduced }) {
  const stage = useRef(null)
  const canvas = useRef(null)
  const flow = useRef(0)
  const colors = useRef(null)
  const [done, setDone] = useState(false)

  const draw = useCallback(() => {
    const cv = canvas.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const dpr = cv.width / Math.max(1, cv.clientWidth)
    const w = cv.clientWidth
    const h = cv.clientHeight
    if (!w || !h) return
    if (!colors.current) colors.current = { signal: channel('--x-signal'), text: channel('--x-text'), line: channel('--x-faint') }
    const c = colors.current
    const p = convergeProgress(flow.current)
    const box = logoBox(w, h, LOGO.width, LOGO.height)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // The X network the points leave: two faint diagonals that fade as the logo forms.
    if (p < 0.98) {
      ctx.globalAlpha = (1 - p) * 0.5
      ctx.strokeStyle = c.line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(w, h)
      ctx.moveTo(w, 0)
      ctx.lineTo(0, h)
      ctx.stroke()
    }

    const size = Math.max(1.4, box.scale * 0.9)
    ctx.globalAlpha = 1
    for (let i = 0; i < LOGO.x.length; i++) {
      const q = pointAt(i, p, w, h, box, LOGO.x[i], LOGO.y[i])
      // In flight every point is a small signal-coloured node; it takes its logo colour on arrival.
      ctx.fillStyle = LOGO.yellow[i] === '1' || q.t < 0.98 ? c.signal : c.text
      const s = q.t < 0.98 ? 2 : size
      ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s)
    }
    setDone(p >= 0.995)
  }, [])

  // Size the backing store to the box and redraw.
  useEffect(() => {
    const cv = canvas.current
    if (!cv) return undefined
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.round(cv.clientWidth * dpr)
      cv.height = Math.round(cv.clientHeight * dpr)
      draw()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(cv)
    return () => ro.disconnect()
  }, [draw])

  useScrollProgress(stage, {
    mode: 'flow',
    onProgress: (p) => {
      flow.current = reduced ? 1 : p
      draw()
    },
  })

  useEffect(() => {
    if (reduced) {
      flow.current = 1
      draw()
    }
  }, [reduced, draw])

  return (
    <div ref={stage} className="mt-8 lg:mt-10">
      <div role="img" aria-label={finale.logoLabel} className="x-ticks relative h-[44vh] min-h-[280px] w-full border border-x-line lg:h-[52vh]">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="absolute bottom-[18%] left-1/2 h-[2px] w-[min(52%,420px)] -translate-x-1/2">
          <div className="x-sweep h-full w-full bg-x-signal" style={{ transformOrigin: 'center' }} data-fired={done} />
        </div>
      </div>
    </div>
  )
}
