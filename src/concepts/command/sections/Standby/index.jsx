import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { deploy, hero, legend, moduleById, records } from '../../content/index.js'
import { CoreAnchor } from '../../contract/anchors.js'
import { STATIONS } from '../../contract/stations.js'
import { CoreFigure } from '../../core/CoreFigure.jsx'
import { heroHairlines } from '../../core/geometry.js'
import { useReducedMotion, useTrack } from '../../runtime/hooks.js'
import { Button } from '../../ui/Button.jsx'
import { cx } from '../../ui/cx.js'
import { EvidenceDot } from '../../ui/Evidence.jsx'
import { FullStop } from '../../ui/FullStop.jsx'
import { Label } from '../../ui/Label.jsx'
import { requestArm } from '../Deploy/arm.js'
import { hairlineSegments, heroPlacement, leaderEnd, litArm, tipOf } from './placement.js'
import { usePaused } from './usePaused.js'
import { useViewport } from './useViewport.js'
import './standby.css'

// Station 00 STANDBY (doc 4.2, 6.1, 6.5). One sentence, cut by two 32 degree hairlines that cross
// at a small X core, four tags on the arm tips, one yellow button.
//
// Layering, back to front:
//   hairlines   SVG, edge to edge, drawn outward from P at boot (M01). Decoration (data-decor).
//   core        <CoreAnchor name="hero"> with the static figure. The WebGL core, when it runs, is
//               placed on this same box (doc 6.4), so the tags never need to know about it.
//   tags        real buttons on the arm tips, with a leader line that draws on hover and focus.
//   text        label, h1, sentence, CTAs, legend. Readable at first paint: nothing here is a gate.
//
// Geometry is one source: heroPlacement(viewport width) -> CSS custom properties on the section.
// The core box and the tags read them in CSS; the hairlines read the same numbers in JS.

const MODULE_ORDER = hero.tags.map((t) => moduleById(t.module))

// Warm the two screenshots when the visitor shows interest in the work (doc 5.8). Once.
let warmed = false
function warmWork() {
  if (warmed || typeof Image === 'undefined') return
  warmed = true
  for (const r of records) {
    if (r.image?.url) new Image().src = r.image.url
  }
}

const coarsePointer = () => typeof matchMedia === 'function' && matchMedia('(hover: none)').matches

function HeroTag({ index, tag, mode, open, onHover, onActivate }) {
  const mod = moduleById(tag.module)
  const tip = tipOf(mod.short)
  const end = leaderEnd(tip.placement, mode)
  const full = `${deploy.fullTag.mod.text} ${mod.index} / ${mod.label} / ${mod.state.text}`
  return (
    <li
      className="hero-tag"
      data-p={tip.placement}
      data-open={open ? '' : undefined}
      style={{ '--x': tip.x, '--y': tip.y, '--dx': `${end.dx}px`, '--dy': `${end.dy}px` }}
      onPointerEnter={() => onHover(index)}
      onPointerLeave={() => onHover(-1)}
      onFocus={() => onHover(index)}
      onBlur={() => onHover(-1)}
    >
      <svg className="hero-leader" width="1" height="1" aria-hidden="true" focusable="false" data-decor="">
        <line className="hero-leader__ghost" x1="0" y1="0" x2={end.dx} y2={end.dy} />
        <line className="hero-leader__lit" x1="0" y1="0" x2={end.dx} y2={end.dy} pathLength="1" />
      </svg>
      <button
        type="button"
        className="hero-tag__btn"
        aria-label={`${mod.index} ${mod.short}. ${full}. ${hero.tagAction.text}.`}
        onClick={(e) => onActivate(e, index)}
      >
        <span className="hero-tag__short">
          {mod.index} {mod.short}
        </span>
        {/* The full tag (doc 6.5): three lines. It sits on top of the short one, same corner. */}
        <span className="hero-tag__full" aria-hidden="true">
          <span className="text-ink3">
            {deploy.fullTag.mod.text} {mod.index}
          </span>
          <span className="text-ink">{mod.label}</span>
          <span className="flex items-center gap-2 text-ink2">
            <EvidenceDot kind="confirmed" size={8} />
            {mod.state.text}
          </span>
        </span>
      </button>
    </li>
  )
}

function Legend({ className }) {
  const tone = { confirmed: 'text-ink2', pending: 'text-ink3', illustrative: 'text-ink2' }
  return (
    <ul aria-label={hero.legendLabel.text} className={cx('flex flex-wrap gap-x-6 gap-y-1', className)}>
      {legend.glyphs.map((g) => (
        <li key={g.id} className="flex items-center gap-2 font-mono text-label uppercase text-ink3">
          <EvidenceDot kind={g.kind} size={10} className={tone[g.kind]} />
          {g.text}
        </li>
      ))}
    </ul>
  )
}

export default function Standby() {
  const ref = useTrack('standby')
  const station = STATIONS[0]
  const vp = useViewport()
  const place = heroPlacement(vp.w)
  const motionOff = useReducedMotion()
  const [titleRef, paused] = usePaused()

  // Which tag is hovered or focused (-1 none), and which one a touch visitor opened with a first
  // tap. Both light the matching arm in the figure; neither re-renders per frame.
  const [hover, setHover] = useState(-1)
  const [opened, setOpened] = useState(-1)
  const lit = litArm(hover, opened)

  // Hairlines through P at the page angle, edge to edge (doc 6.1). P is in viewport pixels, and
  // the SVG is drawn in viewport pixels from the very top of the page, so they agree.
  const px = vp.w * place.p.x
  const py = vp.h * place.p.y
  const segments = hairlineSegments(heroHairlines(vp.w, vp.h, place.p), px, py)

  const activate = useCallback(
    (event, index) => {
      // Touch: the first tap opens the full tag (hover has no equivalent there), the second goes
      // to DEPLOY. A keyboard Enter (detail 0) and a mouse click go straight there.
      if (coarsePointer() && event.detail > 0 && opened !== index) {
        event.preventDefault()
        setOpened(index)
        return
      }
      setOpened(-1)
      requestArm(index)
      const target = document.getElementById('deploy')
      if (!target) return
      history.pushState(null, '', '#deploy')
      target.scrollIntoView({ behavior: motionOff ? 'auto' : 'smooth', block: 'start' })
    },
    [opened, motionOff],
  )

  // A tapped-open tag closes on a tap elsewhere or Escape.
  const tagsRef = useRef(null)
  useEffect(() => {
    if (opened < 0) return undefined
    const away = (e) => {
      if (!tagsRef.current?.contains(e.target)) setOpened(-1)
    }
    const esc = (e) => e.key === 'Escape' && setOpened(-1)
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [opened])

  const lines = hero.h1.lines
  return (
    <section
      id="standby"
      ref={ref}
      data-track="standby"
      aria-labelledby="standby-title"
      className="track hero"
      data-tags={place.tags}
      style={{ '--px': place.p.x, '--py': place.p.y, '--core': `${place.core}px` }}
    >
      {/* The two hairlines (M01: drawn outward from P, 700 ms). */}
      <svg
        data-decor=""
        aria-hidden="true"
        focusable="false"
        className="hero-hairlines"
        width={vp.w}
        height={vp.h}
        viewBox={`0 0 ${vp.w} ${vp.h}`}
      >
        <g fill="none" strokeWidth="1" className="stroke-hair">
          {segments.map((d) => (
            <path key={d} d={d} pathLength="1" className="anim-hairline" />
          ))}
        </g>
      </svg>

      <div className="column hero-stage relative z-10 flex flex-col">
        <Label>{station.label}</Label>
        <h1
          id="standby-title"
          ref={titleRef}
          className="hero-title mt-3 font-display sm:mt-4 text-display-xl font-medium uppercase text-ink"
        >
          {lines.map((line, i) => (
            <Fragment key={line}>
              <span className="hero-line anim-clip-rise" style={{ '--i': i }}>
                {line}
                {i === lines.length - 1 && (
                  // Only the blinking stop is paused off screen, never the boot of the type.
                  <span data-paused={paused ? '' : undefined}>
                    <FullStop className="hero-stop" />
                  </span>
                )}
              </span>{' '}
            </Fragment>
          ))}
          {/* The full stop is drawn, so the sentence keeps its period for assistive tech. */}
          <span className="sr-only">.</span>
        </h1>
        <p className="mt-4 max-w-measure text-body text-ink2 sm:mt-6">{hero.sub.text}</p>
        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-6">
          <Button
            href={hero.cta.primary.href}
            arrow="right"
            flow
            className="max-sm:w-full max-sm:justify-between"
          >
            {hero.cta.primary.text}
          </Button>
          <Button
            variant="ghost"
            href={hero.cta.secondary.href}
            arrow="down"
            className="max-sm:min-h-[44px] max-sm:w-full max-sm:justify-between"
            onPointerEnter={warmWork}
            onFocus={warmWork}
          >
            {hero.cta.secondary.text}
          </Button>
        </div>
        <div className="mt-auto flex pt-6 sm:justify-end sm:pt-10">
          <Legend />
        </div>
      </div>

      {/* The core and its four tags share one box, centred on P. */}
      <div className="hero-core" data-arm={lit}>
        <CoreAnchor name="hero" className="absolute inset-0">
          <div className="hero-core__fig h-full w-full">
            <CoreFigure layout="x" active={lit} />
          </div>
        </CoreAnchor>
        <ul ref={tagsRef} aria-label={hero.tagsLabel.text} className="hero-tags">
          {hero.tags.map((tag, i) => (
            <HeroTag
              key={tag.id}
              index={i}
              tag={tag}
              mode={place.tags}
              open={opened === i}
              onHover={setHover}
              onActivate={activate}
            />
          ))}
        </ul>
      </div>

      {/* FIG 01 (doc 4.2): says plainly that the layout is artwork. */}
      <p className="hero-fig font-mono text-label uppercase text-ink3">{hero.figCaption.text}</p>
    </section>
  )
}
