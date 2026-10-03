import { useLayoutEffect } from 'react'
import { hero, ui } from '../content.js'
import Chip from '../ui/Chip.jsx'
import HeroDrawing from './HeroDrawing.jsx'
import HeroOverlay from './HeroOverlay.jsx'
import HeroScene from './HeroScene.jsx'

/**
 * The model figure: a drawing frame with the SVG drawing, the optional WebGL canvas, the overlay and the figure
 * note. `gl` says the quality gate passed, so the canvas may be mounted; the SVG stays until the scene reports
 * ready and then the canvas fades in over it. The frame is `role="img"`; the list of layers beside it carries the
 * detail, so nothing is lost without sight or without WebGL.
 */
export default function HeroFigure({ driver, figRef, gl }) {
  useLayoutEffect(() => {
    const el = figRef.current
    const measure = () => driver.setSize(el.clientWidth, el.clientHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [driver, figRef])

  // Stop all work while the figure is off screen.
  useLayoutEffect(() => {
    const el = figRef.current
    if (typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([entry]) => driver.setVisible(entry.isIntersecting), { rootMargin: '80px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [driver, figRef])

  return (
    <figure className="hero-figure">
      <div ref={figRef} className="hero-fig" data-gl="off">
        <div className="hero-frame" role="img" aria-label={hero.figureAlt}>
          <div className="hero-art">
            <p className="hero-loader bp-mono" aria-hidden="true">
              {ui.loading}
            </p>
            <HeroDrawing driver={driver} />
            {gl ? <HeroScene driver={driver} figRef={figRef} /> : null}
          </div>
          <HeroOverlay driver={driver} />
        </div>
      </div>
      <figcaption className="hero-caption">
        <Chip kind="illustrative">{hero.figureNote}</Chip>
      </figcaption>
    </figure>
  )
}
