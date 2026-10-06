import { deviceKinds } from '../campusData'
import { buildingAttention } from './live'

// HTML labels over the 3D model. The scene (campusScene.js anchorOf) writes each one's position as a transform
// every frame; React only decides which labels exist. They never take pointer events: the model and the side
// panel do the picking. Keys: `b:<building>`, `r:<room>`, `tip` (the hovered device pin).
export default function CampusLabels({ model, sel, hover, live, labelRef }) {
  const open = sel.buildingId ? model.byId[sel.buildingId] : null
  const device = hover?.deviceId ? model.devices.find((d) => d.id === hover.deviceId) : null
  return (
    <ul aria-hidden="true" className="cp-labels pointer-events-none absolute inset-0 m-0 overflow-hidden p-0">
      {!open &&
        model.buildings.map((b) => {
          const n = buildingAttention(model, live, b.id)
          const on = hover?.buildingId === b.id
          return (
            <li key={b.id} ref={labelRef(`b:${b.id}`)} className="cp-label" data-on={on ? 'true' : 'false'}>
              <span className="cp-label__box">
                <span className="cmd-label cp-label__title">{b.name}</span>
                {n > 0 && <span className="cp-label__flag" />}
              </span>
            </li>
          )
        })}
      {open &&
        open.roomIds.map((id) => {
          const r = model.byId[id]
          const st = live.states[id]
          const on = hover?.roomId === id || sel.roomId === id
          return (
            <li key={id} ref={labelRef(`r:${id}`)} className="cp-label" data-on={on ? 'true' : 'false'} data-status={st.status}>
              <span className="cp-label__box">
                <span className="cmd-label cp-label__title">{r.name}</span>
                {st.status === 'attention' && <span className="cp-label__flag" />}
              </span>
            </li>
          )
        })}
      <li ref={labelRef('tip')} className="cp-label cp-label--tip" data-on={device ? 'true' : 'false'}>
        {device && (
          <span className="cp-label__box">
            <span className="cmd-label cp-label__title">{deviceKinds[device.kind].label}</span>
            <span className="cp-label__sub">{deviceKinds[device.kind].measures}</span>
          </span>
        )}
      </li>
    </ul>
  )
}
