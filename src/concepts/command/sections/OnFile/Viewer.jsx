import { useEffect, useRef, useState } from 'react'
import { hotspotEvidence, onFile } from '../../content/index.js'
import { useInView, useReducedMotion } from '../../runtime/hooks.js'
import { Frame } from '../../ui/Frame.jsx'
import { cx } from '../../ui/cx.js'
import { useElementWidth } from './useViewer.js'
import {
  NO_ZOOM,
  boxById,
  formatScanTime,
  limitedTag,
  scanRow,
  tagAlign,
  tagEdge,
  tagSide,
  veilClip,
  zoomFor,
} from './viewerMath.js'

// The screenshot viewer of a record (doc 8.5): the real capture, unaltered, in a 1 px frame on
// --void, with decorative layers on top (sector grid, hotspot boxes, tags, scan line). Every
// layer over the image is aria-hidden and data-decor; the region buttons of the spec list are
// the accessible twin and share the same data.
//
// The picture itself is never blank: it is a plain <img> with explicit size, in a box that is
// visible and unclipped at rest, so loading="lazy" is safe. Its 12 percent to 100 percent fade
// (M10) is driven by an IntersectionObserver on the viewer, not by the image load, and every way
// of not running it (reduced motion, no observer, RAW) leaves it at full opacity.

const SCAN_MS = 600

/**
 * M10, once, when 35 percent of the viewer is visible. Returns what the markup needs:
 * `ref` for the observed element, `phase` ('idle' dim | 'scan' running | 'done' full), `time`.
 * Reduced motion and data-motion=off skip straight to 'done': the image shows at once.
 */
function usePlateScan() {
  const motionOff = useReducedMotion()
  const [ref, seen] = useInView({ once: true, threshold: 0.35 })
  const [phase, setPhase] = useState('idle')
  const [time, setTime] = useState('')

  useEffect(() => {
    if (!seen || motionOff) return undefined
    setTime(formatScanTime(new Date()))
    setPhase('scan')
    const done = setTimeout(() => setPhase('done'), SCAN_MS + 160)
    return () => clearTimeout(done)
  }, [seen, motionOff])

  return { ref, phase: motionOff ? 'done' : phase, revealed: motionOff || seen, time }
}

/**
 * Writes the sector under the scan line into two labels while it runs (no React state per
 * frame). The line's own CSS animation is the clock, so the label cannot drift from the line;
 * without the Web Animations API it falls back to elapsed time.
 */
function useScanSectors(running, scanRef, leftRef, rightRef) {
  useEffect(() => {
    if (!running || typeof requestAnimationFrame !== 'function') return undefined
    const start = performance.now()
    let raf = 0
    let last = 0
    const progress = (now) => {
      const anim = scanRef.current?.getAnimations?.()[0]
      const t = anim && typeof anim.currentTime === 'number' ? anim.currentTime : now - start
      return Math.min(1, Math.max(0, t / SCAN_MS))
    }
    const tick = (now) => {
      const p = progress(now)
      const row = scanRow(p)
      if (row !== last) {
        last = row
        if (leftRef.current) leftRef.current.textContent = `A${row}`
        if (rightRef.current) rightRef.current.textContent = `H${row}`
      }
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, scanRef, leftRef, rightRef])
}

function Tag({ box, active }) {
  const align = tagAlign(box)
  return (
    <>
      {/* Limited tag, UI-03 CALENDAR. Hidden on phones, where the picture is too small for it. */}
      <span className="of-tag" data-side={tagSide(box)} data-edge={tagEdge(box)}>
        {limitedTag(box)}
      </span>
      {/* Full tag on hover, focus or tap: id, label, evidence (doc 8.5). */}
      <span className="of-tag-full" data-h={align.h} data-v={align.v} data-open={active ? '' : undefined}>
        <span className="text-ink">{box.code}</span>
        <span className="text-ink">{box.label}</span>
        <span className="text-ink3">{hotspotEvidence.text}</span>
      </span>
    </>
  )
}

export default function Viewer({
  record,
  boxes,
  imageSize,
  activeId,
  pinnedId,
  zoomEnabled,
  debug,
  onHover,
  onTap,
  onReset,
}) {
  const { ref, phase, revealed, time } = usePlateScan()
  const windowRef = useRef(null)
  const scanRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const windowWidth = useElementWidth(windowRef)
  const image = record.image
  useScanSectors(phase === 'scan', scanRef, leftRef, rightRef)

  const pinned = pinnedId ? boxById(boxes, pinnedId) : null
  const zoomed = Boolean(zoomEnabled && pinned && windowWidth > 0)
  const zoom = zoomed ? zoomFor(pinned, { windowWidth, imageWidth: imageSize.width }) : null
  const transform = zoom ? zoom.transform : NO_ZOOM
  const active = activeId ? boxById(boxes, activeId) : null

  // A tablet zooms by touch but is too wide for the sticky viewer of phones: bring the picture
  // into view so the zoom the visitor just asked for is seen. Phones need nothing: it sticks.
  useEffect(() => {
    if (!zoomed || typeof window === 'undefined' || window.innerWidth < 768) return
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }, [zoomed, pinnedId, ref])

  return (
    <div ref={ref} className="of-viewer" data-zoomed={zoomed ? '' : undefined} data-scan={phase}>
      <Frame ticks className="bg-void">
        <div ref={windowRef} className="of-window" style={{ aspectRatio: `${image.width} / ${image.height}` }}>
          <div className="of-stage" style={{ transform, '--zoom': zoom ? zoom.scale : 1 }}>
            <img
              className={cx('of-img', phase === 'idle' && 'of-img--dim', phase === 'scan' && 'anim-scan-reveal')}
              src={image.url}
              alt={image.alt.text}
              width={image.width}
              height={image.height}
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            />
            <div className="of-grid" data-decor="" aria-hidden="true" />
            <div
              className="of-veil"
              data-decor=""
              aria-hidden="true"
              data-on={active && !zoomed ? '' : undefined}
              style={active ? { clipPath: veilClip(active) } : undefined}
            />
            <div className="of-boxes" data-decor="" aria-hidden="true" data-revealed={revealed ? '' : undefined}>
              {boxes.map((box) => {
                const state = box.id === activeId ? 'active' : activeId ? 'dim' : 'idle'
                return (
                  <div
                    key={box.id}
                    className="of-box"
                    data-state={state}
                    data-debug={debug ? '' : undefined}
                    style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
                    onPointerEnter={(e) => e.pointerType !== 'touch' && onHover(box.id)}
                    onPointerLeave={() => onHover(null)}
                    onClick={() => onTap(box.id)}
                  >
                    <Tag box={box} active={box.id === activeId} />
                    {debug && (
                      <span className="of-debug-id">
                        {box.id} {box.x},{box.y},{box.w},{box.h}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {phase === 'scan' && (
            <div ref={scanRef} className="of-scan anim-scan" data-decor="" aria-hidden="true">
              <span ref={leftRef} className="of-scan__label of-scan__label--left">
                A1
              </span>
              <span className="of-scan__label of-scan__label--right">
                {time} <span ref={rightRef}>H1</span>
              </span>
            </div>
          )}
        </div>
      </Frame>
      {/* Phones: the picture is small, so the active region is named here and the zoom can be undone. */}
      <div className="of-readout">
        <p className="of-readout__text" aria-hidden="true">
          {active ? (
            <>
              <span className="text-ink">
                {active.code} / {active.label}
              </span>
              <span className="text-ink3">{hotspotEvidence.text}</span>
            </>
          ) : (
            <span className="text-ink3">{onFile.tapHint.text}</span>
          )}
        </p>
        <button type="button" className="of-reset" onClick={onReset} hidden={!zoomed}>
          {onFile.resetZoom.text}
        </button>
      </div>
    </div>
  )
}
