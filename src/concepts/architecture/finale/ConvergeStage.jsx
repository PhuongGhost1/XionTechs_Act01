import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { brand, finale, hero } from '../content.js'
import { useMedia, useReducedMotion, useScrollProgress } from '../hooks/hooks.js'
import { range } from '../model/timeline.js'
import { LABEL_ANCHORS, THIN, frame } from './converge.js'
import { copy } from './copy.js'

// The signature final transition (BRIEF 02 §14): the exploded model compresses into the X mark, and the chain
// ARCHITECT, ENGINEER, DEPLOY, XIONTECHS lights up beside it. On a wide screen the stage is pinned for 240vh.
// Below 1024 px there is no pin: the same drawing converges once while it passes through the viewport. Under
// reduced motion nothing moves: the mark is shown formed and every caption is lit.
//
// Per frame the scroll controller calls onProgress(p). It writes two `d` attributes, a width and a colour on
// SVG paths through refs. React state changes only when the lit caption changes (four times in a pass).

const LAST = finale.chain.length - 1
const PASS_FROM = 0.2 // 'pass' mode: the drawing starts to converge once it is well inside the screen...
const PASS_TO = 0.5 // ...and has become the mark by the time it is centred

// The tokens are RGB channels ("247 246 241"), so the yellow reveal is mixed in JS from the computed values.
function channels(el, name) {
  const v = getComputedStyle(el).getPropertyValue(name).trim().split(/\s+/).map(Number)
  return v.length === 3 && v.every(Number.isFinite) ? v : null
}
const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(', ')})`

function Arrow({ lit }) {
  return (
    <svg className="fn-arrow" data-lit={lit} width="16" height="44" viewBox="0 0 16 44" aria-hidden="true" focusable="false">
      <path d="M8 0V41M3 35.5 8 41 13 35.5" />
    </svg>
  )
}

export default function ConvergeStage() {
  const reduced = useReducedMotion()
  const wide = useMedia('(min-width: 1024px)')
  const roomForLabels = useMedia('(min-width: 640px)')
  const animated = !reduced
  const sticky = animated && wide

  const stageRef = useRef(null)
  const lineRef = useRef(null)
  const signalRef = useRef(null)
  const tones = useRef(null)
  const stepRef = useRef(-1)
  const [step, setStep] = useState(reduced ? LAST : 0)

  const apply = useCallback((p) => {
    const line = lineRef.current
    const signal = signalRef.current
    if (!line || !signal) return
    const fr = frame(p)
    stageRef.current?.style.setProperty('--q', p.toFixed(4)) // the converge progress; --p is the raw scroll progress
    line.setAttribute('d', fr.line)
    signal.setAttribute('d', fr.signal)
    line.setAttribute('stroke-width', fr.width)
    signal.setAttribute('stroke-width', fr.width)
    const t = tones.current
    if (t) signal.style.stroke = mix(t.line, t.signal, fr.mix)
    if (fr.step !== stepRef.current) {
      stepRef.current = fr.step
      setStep(fr.step)
    }
  }, [])

  const onProgress = useCallback((raw) => apply(sticky ? raw : range(raw, PASS_FROM, PASS_TO)), [apply, sticky])
  useScrollProgress(stageRef, { mode: sticky ? 'stage' : 'pass', onProgress, enabled: animated })

  // First paint, and every change between animated and still: draw the right frame before the browser paints.
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    tones.current = { line: channels(el, '--bp-line'), signal: channels(el, '--bp-signal') }
    if (!tones.current.line || !tones.current.signal) tones.current = null
    apply(animated ? 0 : 1)
  }, [animated, apply])

  return (
    <div
      ref={stageRef}
      className="fn-stage"
      data-mode={sticky ? 'sticky' : 'static'}
      role="group"
      aria-label={finale.chainLabel}
      style={animated ? undefined : { '--q': 1 }}
    >
      <div className="fn-pin">
        <div className="bp-wrap fn-grid">
          <figure className="fn-figure">
            <svg
              className="fn-draw"
              viewBox={roomForLabels ? '-60 0 720 600' : '0 0 600 600'}
              aria-hidden="true"
              focusable="false"
            >
              {/* construction axes through the centre of the mark; decoration only */}
              <path d="M300 -20V620M-60 300H660" className="stroke-bp-rule" strokeWidth="1" fill="none" />
              {roomForLabels ? (
                <g className="fn-labels">
                  {LABEL_ANCHORS.map((a, i) => (
                    <g key={hero.layers[i].id}>
                      <path d={`M${a.x + 8} ${a.y}H${a.x + 24}`} className="stroke-bp-mute" strokeWidth="1" fill="none" />
                      <text x={a.x + 32} y={a.y} dy="0.35em" className="fn-label fill-bp-mute">
                        {hero.layers[i].label}
                      </text>
                    </g>
                  ))}
                </g>
              ) : null}
              <path ref={lineRef} className="stroke-bp-line" fill="none" strokeWidth={THIN} strokeLinecap="square" />
              <path ref={signalRef} className="stroke-bp-line" fill="none" strokeWidth={THIN} strokeLinecap="square" />
            </svg>
            <figcaption className="fn-caption bp-mono mt-5 text-bp-mute" data-step={step}>
              <span aria-hidden={step === LAST}>{copy.figureDrawing}</span>
              <span aria-hidden={step !== LAST}>{copy.figureMark}</span>
            </figcaption>
          </figure>

          <div>
            <p className="bp-mono text-bp-mute" aria-hidden="true">
              {finale.chainLabel}
            </p>
            <ol role="list" className="mt-6">
              {finale.chain.map((word, i) => (
                <li
                  key={word}
                  className="fn-step"
                  data-lit={i <= step}
                  data-logo={i === LAST && step === LAST}
                  aria-current={i === step ? 'step' : undefined}
                >
                  <span className="bp-mono fn-step__no" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="bp-display fn-step__word text-[clamp(2.1rem,3.7vw,3.6rem)]">{word}</span>
                  {i === LAST ? (
                    <img
                      className="fn-step__logo"
                      src={brand.logoReversed.src}
                      width={brand.logoReversed.width}
                      height={brand.logoReversed.height}
                      alt=""
                      decoding="async"
                    />
                  ) : (
                    <Arrow lit={i < step} />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
