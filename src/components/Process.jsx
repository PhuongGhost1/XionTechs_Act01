import { useCallback, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { process as pipeline } from './content'
import { anchorProps } from './scene/store'
import { DraftMark, Reveal, SectionHead } from './ui'
import { activeStep, pipelineProgress, stepReadout, stepState } from './processProgress'
import './Process.css'

// NEEDS content.js: the readout's label, "Step 02 / 04" in docs/concepts/01-command-implementation.md §8.
// Interface chrome, not marketing copy.
const READOUT_LABEL = 'Step'

// The step node's drawing: a square holding a small X, drawn twice so the yellow copy can crossfade in.
const NODE_FRAME = { x: 1, y: 1, width: 26, height: 26 }
const NODE_X = 'M8 8 L20 20 M20 8 L8 20'

function StepNode() {
  return (
    <span aria-hidden="true" className="cmdp-node xcore-fallback">
      <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
        <rect className="cmdp-n-bg" {...NODE_FRAME} />
        <g className="cmdp-n-base">
          <rect {...NODE_FRAME} />
          <path d={NODE_X} />
        </g>
        <g className="cmdp-n-on">
          <rect {...NODE_FRAME} />
          <path d={NODE_X} />
        </g>
        <rect className="cmdp-core" x="12" y="12" width="4" height="4" />
      </svg>
      <span className="cmdp-ping" />
    </span>
  )
}

// Section 03. The four steps as one pipeline (M9). As the page scrolls, a fill runs along the track
// and each step lights as the fill reaches its node. The fill is a CSS variable written straight to the
// DOM, never React state per frame; React only hears about the step index, and only when it changes.
// Without motion the track is full and every step is on. Geometry and the packet are in Process.css.
export default function Process() {
  const rootRef = useRef(null)
  const trackRef = useRef(null)
  const reachedRef = useRef(0)
  const reduced = useReducedMotion()
  const live = useInView(rootRef)
  const [scrolled, setScrolled] = useState(0)
  const { steps } = pipeline
  const count = steps.length
  const active = reduced ? count - 1 : scrolled

  const onProgress = useCallback(() => {
    const root = rootRef.current
    const track = trackRef.current
    if (!root || !track) return
    // The track is measured, not the section: it is exactly node centre to node centre.
    const { top, height } = track.getBoundingClientRect()
    const t = pipelineProgress(top, height, window.innerHeight)
    root.style.setProperty('--p', t.toFixed(4))
    const next = activeStep(t, count)
    if (next !== reachedRef.current) {
      reachedRef.current = next
      setScrolled(next)
    }
  }, [count])

  useScrollProgress(trackRef, onProgress, { enabled: !reduced })

  return (
    <section
      id="process"
      data-cmd-section
      aria-labelledby="process-title"
      className="relative overflow-x-clip border-t border-cmd-line py-24 lg:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <SectionHead
            index={pipeline.index}
            label={pipeline.label}
            title={pipeline.title}
            intro={pipeline.intro}
            titleId="process-title"
          />
        </Reveal>

        <div
          ref={rootRef}
          data-live={live ? 'true' : 'false'}
          className="cmdp mt-14 lg:mt-20"
          style={{ '--n': count, '--p': reduced ? 1 : 0 }}
        >
          {/* Readout. Decorative: all six steps are in the list below. Sticks under the header on small screens. */}
          <div
            aria-hidden="true"
            className="sticky top-[4.25rem] z-20 mb-8 flex w-fit items-center gap-4 border border-cmd-line bg-cmd-bg px-3 py-2 lg:static"
          >
            <span className="flex items-center gap-1">
              {steps.map((step, i) => (
                <span key={step.id} className="cmdp-seg" data-on={i <= active} />
              ))}
            </span>
            <span className="cmd-label tabular-nums text-cmd-text">{stepReadout(active, count, READOUT_LABEL)}</span>
            <span className="cmd-label hidden text-cmd-signal-fg sm:inline">{steps[active].title}</span>
          </div>

          <div className="cmdp-body">
            <div ref={trackRef} aria-hidden="true" className="cmdp-track">
              <span className="cmdp-base" />
              <span className="cmdp-fill" />
              <span className="cmdp-clip">
                <span className="cmdp-run">
                  <span className="cmdp-packet" />
                </span>
              </span>
            </div>

            <ol role="list" className="cmdp-list">
              {steps.map((step, i) => (
                <li key={step.id} data-state={stepState(i, active, reduced)} className="cmdp-step">
                  <div {...anchorProps(step.anchor)} className="cmdp-anchor">
                    <StepNode />
                  </div>
                  <div className="cmdp-text">
                    <p className="cmd-label flex items-center gap-3">
                      <span aria-hidden="true" className="cmdp-dash" />
                      <span className="relative inline-block">
                        <span className="text-cmd-faint">{step.index}</span>
                        <span aria-hidden="true" className="cmdp-idx-on text-cmd-signal-fg">
                          {step.index}
                        </span>
                      </span>
                    </p>
                    <h3 className="mt-2 break-words font-cmd-display text-2xl font-semibold uppercase tracking-tight text-cmd-text lg:break-normal lg:text-[clamp(0.9rem,1.2vw,1.15rem)]">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-[34ch] text-pretty text-[0.9375rem] leading-relaxed text-cmd-muted md:max-w-[52ch] lg:max-w-[34ch]">
                      {step.desc}
                      <DraftMark draft={step.draft} />
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
