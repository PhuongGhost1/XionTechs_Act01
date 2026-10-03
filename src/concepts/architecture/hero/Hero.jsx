import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import './hero.css'
import { hero } from '../content.js'
import { useMedia, useReducedMotion, useScrollProgress } from '../hooks/hooks.js'
import { Sheet, SheetHeader } from '../ui/Sheet.jsx'
import Button from '../ui/Button.jsx'
import { heroCopy } from './copy.js'
import { createDriver } from './driver.js'
import HeroFigure from './HeroFigure.jsx'
import { qualityGate, readEnv } from './quality.js'

// Sheet 01. The headline, intro and buttons are plain HTML and are the first thing painted. On a wide screen
// the sheet is a tall "stage" with a sticky child: the model figure on the right is driven by scroll
// (plan view, then the layers lift, the camera tilts to axonometric, then dollies in). Below 1024 px, and
// under reduced motion, there is no sticky stage: the figure is the SVG drawing, opened as it scrolls past
// (phones) or already open (reduced motion). The WebGL scene is the stage layout's enhancement only.

export default function Hero() {
  const wide = useMedia('(min-width: 1024px)')
  const reduced = useReducedMotion()
  const mode = reduced ? 'final' : wide ? 'stage' : 'pass'
  const layout = wide ? (reduced ? 'split' : 'stage') : 'flow'

  const stageRef = useRef(null)
  const figRef = useRef(null)
  const [driver] = useState(() => createDriver({ mode }))
  useLayoutEffect(() => {
    driver.setMode(mode)
  }, [driver, mode])
  useLayoutEffect(() => {
    driver.start()
    return () => driver.stop()
  }, [driver])

  useScrollProgress(stageRef, { mode: 'stage', enabled: mode === 'stage', onProgress: (p) => driver.setProgress(p) })
  useScrollProgress(figRef, { mode: 'pass', enabled: mode === 'pass', onProgress: (p) => driver.setProgress(p) })

  const gl = useMemo(() => mode === 'stage' && qualityGate(readEnv()).ok, [mode])

  return (
    <Sheet id="top" className="hero" labelledBy="hero-title" data-layout={layout}>
      <div ref={stageRef} className="hero-stage">
        <div className="hero-pin bp-grid">
          <div className="bp-wrap hero-grid">
            <SheetHeader id="top" className="hero-head" />

            <div className="hero-copy">
              <p className="bp-mono hero-eyebrow">
                <span aria-hidden="true" className="hero-eyebrow__mark" />
                {hero.eyebrow}
              </p>
              <h1 id="hero-title" className="bp-display hero-title">
                {hero.headline}
              </h1>
              <p className="bp-lede hero-intro">{hero.intro}</p>
              <div className="hero-ctas">
                <Button href={hero.primary.href}>{hero.primary.label}</Button>
                <Button href={hero.secondary.href} variant="ghost">
                  {hero.secondary.label}
                </Button>
              </div>
              <p className="bp-mono hero-hint" aria-hidden="true">
                <span className="hero-hint__rule" />
                {hero.scrollHint}
              </p>
            </div>

            <HeroFigure driver={driver} figRef={figRef} gl={gl} />
          </div>
        </div>
      </div>

      <div className="bp-wrap hero-layers-wrap">
        <ol className="hero-layers" aria-label={heroCopy.layersLabel}>
          {hero.layers.map((layer, i) => (
            <li key={layer.id} className="hero-layer">
              <span className="bp-mono hero-layer__no">{String(i + 1).padStart(2, '0')}</span>
              <span className="hero-layer__name">{layer.label}</span>
              <span className="hero-layer__desc">{layer.desc}</span>
            </li>
          ))}
        </ol>
      </div>
    </Sheet>
  )
}
