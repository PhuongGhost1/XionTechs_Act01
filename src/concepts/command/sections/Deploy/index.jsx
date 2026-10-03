import { useCallback, useEffect, useRef, useState } from 'react'
import { deploy, modules, showDraftMarks } from '../../content/index.js'
import { CoreAnchor } from '../../contract/anchors.js'
import { STATIONS } from '../../contract/stations.js'
import { CoreFigure } from '../../core/CoreFigure.jsx'
import { useBrief, useHtmlAttribute, useTrack } from '../../runtime/hooks.js'
import { Chip } from '../../ui/Chip.jsx'
import { Frame } from '../../ui/Frame.jsx'
import { EvidenceDot } from '../../ui/Evidence.jsx'
import { Label } from '../../ui/Label.jsx'
import { ROOT_MARGIN, THRESHOLDS, pickActive } from './active.js'
import { publishArm, subscribeRequest } from './arm.js'
import { ServicesPanel } from './ServicesPanel.jsx'
import { useMediaQuery } from './useMediaQuery.js'
import './deploy.css'

// Station 02 DEPLOY, "what we can deploy" (doc 4.4, M07, M16). Four module rows on the left; a
// sticky instrument (the X in four separated arms) on the right, with the active module's
// services under it as real checkboxes. Not a full pin: the rows scroll and the instrument sticks.
//
// Which row is active (one at a time), by whichever happened last:
//   scroll   the row nearest the middle of the viewport (IntersectionObserver, a thin band)
//   focus    Tab onto a row, or into a panel (that panel's module becomes active)
//   click    a row, or a hero tag (arm.js requestArm); the page then scrolls to this section and
//            the observer is held back until that scroll has settled, so the asked-for arm sticks
//   hover    a mouse over a row (ignored right after a scroll, which moves rows under a still mouse)
//   While the keyboard is inside a services panel (wide screens), scroll and hover do not change the
//   module: the panel with the focused checkbox must stay drawn.
// The arm change is 160 ms and nothing else moves (M07): only stroke and text colour change.
//
// DOM order is the focus order: each module's row button is followed by its own services panel,
// so Tab goes row, then that row's checkboxes. On wide screens the panels are lifted into the
// sticky column with CSS grid (deploy.css, .deploy__item is display: contents there) and only the
// active one is drawn (the rest are clipped, still in the accessibility tree); on narrow screens
// every panel sits under its row. Each of the eight
// services is in the DOM exactly once either way.

const SETTLE_MS = 250 // after the page has arrived, before the observer takes over again (a smooth scroll has a long tail)
const NEAR_PX = 2 // "arrived": within this many px of where the request is scrolling to
const GIVE_UP_MS = 4000 // a request never holds the observer longer than this
const HOVER_AFTER_SCROLL_MS = 150
// 1024 px and up AND 500 px or more high: the pinned instrument and a panel fit (mirrors deploy.css).
const WIDE_QUERY = '(min-width: 1024px) and (min-height: 500px)'

// True while the keyboard is inside a services panel. Changing the module then (scroll or hover)
// would clip the panel that holds the focused checkbox, and its ring would vanish.
const keyboardInPanel = () => {
  const el = typeof document === 'undefined' ? null : document.activeElement
  return Boolean(el?.closest?.('.svc-panel') && el.matches(':focus-visible'))
}

export default function Deploy() {
  const ref = useTrack('deploy')
  const wide = useMediaQuery(WIDE_QUERY)
  const raw = useHtmlAttribute('data-view') === 'raw' // RAW lists every panel in full: none is collapsed
  const brief = useBrief()
  const [active, setActive] = useState(0)

  const activeRef = useRef(0)
  const rowEls = useRef([]) // the row (wide: its own box)
  const itemEls = useRef([]) // the row plus its panel (narrow: the box that scrolls through the band)
  const hold = useRef({ on: false, timer: 0, target: null })
  const lastScroll = useRef(0)

  const setArm = useCallback((i) => {
    activeRef.current = i
    setActive(i)
  }, [])

  // Releases the observer's hold after `ms`. A hero tag's request holds it while the page scrolls
  // here: until the page has arrived (within NEAR_PX of the target), scrollend where it exists, or
  // GIVE_UP_MS. Waiting for arrival, not for quiet, keeps it right on a slow device where frames
  // (and so scroll events) can be further apart than any quiet time.
  const releaseSoon = useCallback((ms = SETTLE_MS) => {
    clearTimeout(hold.current.timer)
    hold.current.timer = setTimeout(() => {
      hold.current.on = false
      hold.current.target = null
    }, ms)
  }, [])

  // The arm that is lit goes out to whoever draws it (the core scene reads arm.js).
  useEffect(() => {
    publishArm(active)
  }, [active])

  // Scroll proximity: the row sharing most of the middle band is active. Wide watches each row;
  // narrow watches each row together with its services, which is the block the reader is in.
  useEffect(() => {
    const els = (wide ? rowEls.current : itemEls.current).filter(Boolean)
    if (typeof IntersectionObserver === 'undefined' || !els.length) return undefined
    const ratios = els.map(() => 0)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios[Number(e.target.dataset.index)] = e.isIntersecting ? e.intersectionRatio : 0
        if (hold.current.on || (wide && keyboardInPanel())) return
        const next = pickActive(ratios, activeRef.current)
        if (next !== activeRef.current) setArm(next)
      },
      { rootMargin: ROOT_MARGIN, threshold: THRESHOLDS },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [wide, setArm])

  // Scroll bookkeeping: when it last moved, and when a held-back observer may speak again.
  useEffect(() => {
    const state = hold.current
    const onScroll = () => {
      lastScroll.current = performance.now()
      if (state.on && state.target !== null && Math.abs(window.scrollY - state.target) <= NEAR_PX) releaseSoon()
    }
    const onScrollEnd = () => state.on && releaseSoon()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scrollend', onScrollEnd, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scrollend', onScrollEnd)
      clearTimeout(state.timer)
    }
  }, [releaseSoon])

  // A hero tag asked for an arm: show it, and keep it while the page scrolls here.
  useEffect(
    () =>
      subscribeRequest((request) => {
        const section = ref.current
        const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0
        const target = section ? section.getBoundingClientRect().top + window.scrollY - header : null
        hold.current.on = true
        hold.current.target = target
        setArm(request.arm)
        // Already there: nothing will scroll, so do not hold for long.
        releaseSoon(target !== null && Math.abs(window.scrollY - target) <= NEAR_PX ? SETTLE_MS : GIVE_UP_MS)
      }),
    [ref, setArm, releaseSoon],
  )

  // A visitor's own choice beats the observer at once.
  const choose = useCallback(
    (i) => {
      hold.current.on = false
      clearTimeout(hold.current.timer)
      setArm(i)
    },
    [setArm],
  )

  // A panel that is clipped away must not keep focus after a mouse click (Space would tick a box
  // nobody can see). A keyboard focus never gets here: it holds the module (keyboardInPanel).
  useEffect(() => {
    const el = document.activeElement
    const panel = el?.closest?.('.svc-panel')
    if (wide && panel && panel.dataset.module !== modules[active]?.id) el.blur()
  }, [wide, active])

  const current = modules[active] ?? modules[0]

  return (
    <section id="deploy" ref={ref} data-track="deploy" aria-labelledby="deploy-title" className="track deploy">
      <div className="column pb-16 pt-16 md:pt-20">
        <Label>{STATIONS[2].label}</Label>
        <h2 id="deploy-title" className="mt-6 font-display text-h2 font-medium text-ink">
          <span className="block">{deploy.heading.text}</span>
          <span className="block text-ink2">{deploy.headingMuted.text}</span>
        </h2>
        <p className="mt-6 max-w-measure text-body text-ink2">{deploy.panelHint.text}</p>

        <div className="deploy__grid mt-8 lg:mt-10" role="group" aria-label={deploy.modulesLabel.text}>
          {/* The instrument: the X in four arms, the active module named beside it, the brief
              count (the one live region of the section). Decoration inside, facts outside. */}
          <div className="deploy-sticky" data-arm={active}>
            <div className="deploy-instrument">
              <Frame ticks className="deploy-frame">
                <CoreAnchor name="deploy" className="deploy-anchor">
                  <CoreFigure layout="arms" active={active} />
                </CoreAnchor>
              </Frame>
              <div className="deploy-readout">
                <p className="font-mono text-label uppercase text-ink3">
                  {deploy.fullTag.mod.text} {current.index}
                </p>
                <p className="font-mono text-data uppercase text-ink">{current.label}</p>
                <p className="flex items-center gap-2 font-mono text-label uppercase text-ink2">
                  <EvidenceDot kind="confirmed" size={8} />
                  {current.state.text}
                </p>
                <p className="deploy-readout__count font-mono text-counter uppercase text-ink">
                  {deploy.countLabel.text} ( {brief.count} )
                </p>
              </div>
            </div>
          </div>

          {modules.map((m, i) => (
            <div
              key={m.id}
              ref={(el) => {
                itemEls.current[i] = el
              }}
              data-index={i}
              data-module={m.id}
              data-active={active === i ? '' : undefined}
              className="deploy__item"
            >
              <div
                ref={(el) => {
                  rowEls.current[i] = el
                }}
                data-index={i}
                data-active={active === i ? '' : undefined}
                className="deploy-row"
              >
                <button
                  type="button"
                  className="deploy-row__btn"
                  aria-current={active === i ? 'true' : undefined}
                  aria-controls={`${m.id}-services`}
                  onClick={() => choose(i)}
                  onFocus={() => choose(i)}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse' && performance.now() - lastScroll.current > HOVER_AFTER_SCROLL_MS && !(wide && keyboardInPanel())) choose(i)
                  }}
                >
                  <span className="deploy-row__meta">
                    <span>{m.index}</span>
                    <span className="flex items-center gap-2">
                      <EvidenceDot kind="confirmed" size={8} />
                      {m.state.text}
                    </span>
                  </span>
                  <span className="deploy-row__title">{m.title.text}</span>
                  <span className="deploy-row__def">{m.definition.text}</span>
                </button>
              </div>
              <ServicesPanel module={m} collapsed={wide && !raw && active !== i} onFocus={() => choose(i)} brief={brief} />
            </div>
          ))}
        </div>

        {showDraftMarks() && (
          <p className="mt-10 flex flex-wrap items-center gap-3 font-mono text-label uppercase text-ink3">
            <Chip kind="draft" />
            {deploy.definitionsNote.text}
          </p>
        )}
      </div>
    </section>
  )
}
