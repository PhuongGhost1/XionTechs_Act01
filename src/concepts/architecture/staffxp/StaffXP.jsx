import { useRef, useState } from 'react'
import './staffxp.css'
import { staffxp } from '../content.js'
import { useInView, useMedia, useReducedMotion, useScrollProgress } from '../hooks/hooks.js'
import Legend from '../ui/Legend.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import { Sheet, SheetHeader } from '../ui/Sheet.jsx'
import Model from './Model.jsx'
import { DetailCard, LayerIndex, ModelNote, Readout } from './Panel.jsx'
import StaticView from './StaticView.jsx'
import { LAYERS, indexOfLayer } from './faces.js'
import { PHASES, staffPhase } from './phase.js'

// Sheet 05, "StaffXP, opened" (BRIEF 02 §14 and §16). On a wide, tall screen without a reduced-motion request, a
// sticky stage about 300vh long drives the model: it opens like an exploded technical drawing, holds so it can be
// explored, then reassembles into the real product screenshot. Everywhere else (narrow, short, reduced motion)
// there is no sticky stage and no scroll-linked 3D: the assembled, annotated screen and the layers as a list.

const WIDE = '(min-width: 1024px) and (min-height: 760px)'
const CLOSED = { '--open': 0, '--assemble': 0, '--explode': 0, '--labels': 0, '--pins': 0 }
const kicker = `${staffxp.kicker} · ${staffxp.name}`

function LiveView() {
  const [hover, setHover] = useState(null) // a layer being previewed (pointer or focus)
  const [selected, setSelected] = useState(LAYERS[0].id) // a layer that was chosen; fronts the model when assembled
  const [hot, setHot] = useState(null) // a numbered region being pointed at
  const [phase, setPhase] = useState(PHASES[0])
  const runRef = useRef(null)
  const stageRef = useRef(null)
  const lastPhase = useRef(PHASES[0])
  // will-change only while the stage is on screen (a little beyond it, so the layers are ready as it arrives).
  const active = useInView(runRef, { once: false, rootMargin: '300px 0px 300px 0px' })

  // Once per frame, outside React: write the timeline to CSS variables. Only a change of phase name is state.
  useScrollProgress(runRef, {
    mode: 'stage',
    onProgress: (p) => {
      const s = staffPhase(p)
      const el = stageRef.current
      if (el) {
        const st = el.style
        st.setProperty('--open', s.open.toFixed(4))
        st.setProperty('--assemble', s.assemble.toFixed(4))
        st.setProperty('--explode', s.explode.toFixed(4))
        st.setProperty('--labels', s.labels.toFixed(4))
        st.setProperty('--pins', s.pins.toFixed(4))
      }
      if (s.phase !== lastPhase.current) {
        lastPhase.current = s.phase
        setPhase(s.phase)
      }
    },
  })

  const shownId = hover || selected
  const shownIndex = Math.max(0, indexOfLayer(shownId))

  return (
    <>
      <div className="bp-wrap sx-top">
        <SheetHeader id="staffxp" />
        <SectionHead id="staffxp" kicker={kicker} title={staffxp.title} lede={staffxp.desc} className="sx-sechead" />
      </div>
      <div ref={runRef} className="sx-run" data-active={active ? 'true' : 'false'}>
        <div className="sx-sticky">
          <div className="bp-wrap sx-grid">
            <div className="sx-left">
              <Readout phase={phase} names={PHASES} />
              <LayerIndex hover={hover} selected={selected} onHover={setHover} onSelect={setSelected} />
              <p className="sx-hint bp-mono">{staffxp.hint}</p>
              <DetailCard layer={LAYERS[shownIndex]} index={shownIndex} />
              <ModelNote />
            </div>
            <Model
              stageRef={stageRef}
              live
              phase={phase}
              selected={selected}
              hover={hover}
              onHover={setHover}
              onSelect={setSelected}
              hot={hot}
              onHot={setHot}
              style={CLOSED}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default function StaffXP() {
  const reduced = useReducedMotion()
  const wide = useMedia(WIDE)
  const live = wide && !reduced
  return (
    <Sheet id="staffxp" band="alt" labelledBy="staffxp-title">
      {live ? <LiveView /> : <StaticView />}
      <div className="bp-wrap sx-legend">
        <Legend />
      </div>
    </Sheet>
  )
}
