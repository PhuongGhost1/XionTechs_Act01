import { ChevronLeft, ChevronRight } from 'lucide-react'
import { deviceKinds, services } from '../campusData'
import { campus } from '../content'
import { buildingAttention } from './live'
import { buildingServices, roomServices, roomsByFloor } from './model'
import { up } from './navigation'
import { engagement, readings, toPercents } from './simulate'

// The side panel. It doubles as the accessible room list: every building and room the model shows can be
// reached here with the keyboard, and hovering an entry marks it in the model. Readings are simulated and
// tagged so (CLAUDE.md "Content rules"); engagement is anonymous and class-level only.

const serviceById = Object.fromEntries(services.map((s) => [s.id, s]))
const { panel } = campus
const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function SimTag() {
  return <span className="cmd-label border border-dashed border-cmd-faint px-1.5 py-0.5 text-cmd-faint">{campus.simulated}</span>
}

function StatusDot({ status }) {
  return <span aria-hidden="true" data-status={status} className="cp-dot" />
}

function ServiceChips({ ids }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <li key={id} title={serviceById[id].desc} className="cmd-label border border-cmd-line px-2 py-1 text-cmd-muted">
          {serviceById[id].name}
        </li>
      ))}
    </ul>
  )
}

const rowButton =
  'group flex w-full min-h-[44px] items-center justify-between gap-3 border-b border-cmd-line px-4 py-3 text-left transition-colors duration-micro ease-cmd hover:bg-cmd-surface focus-visible:[outline-offset:-3px] data-[hover=true]:bg-cmd-surface'

function CampusList({ model, live, hover, onSelect, onHover }) {
  return (
    <>
      <PanelHead title={panel.campusTitle} intro={panel.campusIntro} />
      <ul>
        {model.buildings.map((b) => {
          const n = buildingAttention(model, live, b.id)
          return (
            <li key={b.id}>
              <button
                type="button"
                data-hover={hover?.buildingId === b.id ? 'true' : 'false'}
                onClick={() => onSelect({ buildingId: b.id, roomId: null })}
                onPointerEnter={() => onHover({ buildingId: b.id })}
                onPointerLeave={() => onHover(null)}
                onFocus={() => onHover({ buildingId: b.id })}
                onBlur={() => onHover(null)}
                className={rowButton}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-cmd-text">
                    <StatusDot status={n ? 'attention' : 'ok'} />
                    {b.name}
                  </span>
                  <span className="mt-1 block text-sm text-cmd-muted">{b.summary}</span>
                  <span className="cmd-label mt-1.5 block text-cmd-faint">
                    {count(b.roomIds.length, b.outdoor ? 'zone' : 'room')} · {count(buildingServices(model, b.id).length, 'service')}
                    {n ? <span className="text-cmd-signal-fg"> · {n} {panel.status.attention.toLowerCase()}</span> : null}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-cmd-faint group-hover:text-cmd-signal-fg" />
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function PanelHead({ title, intro, kicker, onBack }) {
  return (
    <div className="border-b border-cmd-line px-4 py-4">
      {onBack && (
        <button type="button" onClick={onBack} className="cmd-label -ml-1 mb-2 inline-flex min-h-[32px] items-center gap-1 text-cmd-muted hover:text-cmd-text">
          <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          {panel.back}
        </button>
      )}
      {kicker && <p className="cmd-label text-cmd-faint">{kicker}</p>}
      <h3 className="mt-1 font-cmd-display text-xl font-bold uppercase tracking-tight text-cmd-text">{title}</h3>
      {intro && <p className="mt-1.5 text-sm text-cmd-muted">{intro}</p>}
    </div>
  )
}

function BuildingView({ model, live, sel, hover, onSelect, onHover }) {
  const b = model.byId[sel.buildingId]
  const floors = roomsByFloor(model, b.id)
  return (
    <>
      <PanelHead title={b.name} intro={b.summary} kicker={campus.campusCrumb} onBack={() => onSelect(up(sel))} />
      <div className="px-4 py-3">
        <p className="cmd-label mb-2 text-cmd-faint">{panel.services}</p>
        <ServiceChips ids={buildingServices(model, b.id)} />
      </div>
      {floors.map((rooms, f) => (
        <div key={f}>
          {!b.outdoor && (
            <p className="cmd-label border-y border-cmd-line bg-cmd-surface/60 px-4 py-2 text-cmd-faint">{campus.floorNames[f] ?? campus.floorNames.at(-1)}</p>
          )}
          <ul>
            {rooms.map((r) => {
              const st = live.states[r.id]
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    data-hover={hover?.roomId === r.id ? 'true' : 'false'}
                    onClick={() => onSelect({ buildingId: b.id, roomId: r.id })}
                    onPointerEnter={() => onHover({ buildingId: b.id, roomId: r.id })}
                    onPointerLeave={() => onHover(null)}
                    onFocus={() => onHover({ buildingId: b.id, roomId: r.id })}
                    onBlur={() => onHover(null)}
                    className={rowButton}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-cmd-text">
                        <StatusDot status={st.status} />
                        {r.name}
                      </span>
                      <span className="cmd-label mt-1 block text-cmd-faint">
                        {count(r.kinds.length, 'device')}
                        {st.status === 'attention' ? <span className="text-cmd-signal-fg"> · {st.reasons[0]}</span> : null}
                      </span>
                    </span>
                    <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-cmd-faint group-hover:text-cmd-signal-fg" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </>
  )
}

const ENGAGEMENT = [
  { key: 'focused', label: 'Focused', tone: 'ok' },
  { key: 'talking', label: 'Talking', tone: 'muted' },
  { key: 'phone', label: 'On a phone', tone: 'signal' },
  { key: 'headsDown', label: 'Heads down', tone: 'danger' },
]

function Engagement({ room, time }) {
  const e = engagement(room, time)
  const pct = e ? toPercents(e) : null
  return (
    <section className="border-b border-cmd-line px-4 py-4" aria-label={panel.engagement}>
      <div className="flex items-center justify-between gap-3">
        <p className="cmd-label text-cmd-faint">{panel.engagement}</p>
        <SimTag />
      </div>
      {pct ? (
        <>
          <div className="mt-3 flex h-3 w-full overflow-hidden" aria-hidden="true">
            {ENGAGEMENT.map((s) => (
              <span key={s.key} data-tone={s.tone} className="cp-share h-full" style={{ width: `${pct[s.key]}%` }} />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {ENGAGEMENT.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-2 text-cmd-muted">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" data-tone={s.tone} className="cp-share inline-block h-2 w-2" />
                  {s.label}
                </span>
                <span className="font-cmd-mono tabular-nums text-cmd-text">{pct[s.key]} %</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-sm text-cmd-muted">{panel.noClass}</p>
      )}
      <p className="mt-3 text-xs text-cmd-faint">{panel.engagementNote}</p>
    </section>
  )
}

function CameraWall({ model, live, onSelect }) {
  return (
    <section className="border-b border-cmd-line px-4 py-4" aria-label={panel.cameraWall}>
      <div className="flex items-center justify-between gap-3">
        <p className="cmd-label text-cmd-faint">{panel.cameraWall}</p>
        <SimTag />
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-1.5">
        {live.cameraRooms.map((id) => {
          const r = model.byId[id]
          const st = live.states[id]
          return (
            <li key={id}>
              <button
                type="button"
                data-status={st.status}
                data-night={live.lamps ? 'true' : 'false'}
                onClick={() => onSelect({ buildingId: r.buildingId, roomId: id })}
                className="cp-feed flex aspect-video w-full flex-col justify-end p-1.5 text-left"
              >
                <span aria-hidden="true" className="cp-feed__fill" style={{ '--occ': st.occ }} />
                <span className="cmd-label relative truncate text-[9px] text-cmd-muted">{r.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-cmd-faint">{panel.cameraWallNote}</p>
    </section>
  )
}

function RoomView({ model, live, sel, time, onSelect }) {
  const r = model.byId[sel.roomId]
  const b = model.byId[r.buildingId]
  const st = live.states[r.id]
  const rows = readings(r, time, { cameraCount: live.cameraCount })
  const kinds = [...new Set(r.kinds)]
  const kicker = b.outdoor ? b.name : `${b.name} · ${campus.floorNames[r.floor] ?? ''}`
  return (
    <>
      <PanelHead title={r.name} kicker={kicker} onBack={() => onSelect(up(sel))} />
      <div className="flex items-center gap-2 border-b border-cmd-line px-4 py-3 text-sm">
        <StatusDot status={st.status} />
        <span className={st.status === 'attention' ? 'text-cmd-signal-fg' : 'text-cmd-muted'}>
          {panel.status[st.status]}
          {st.reasons.length ? `: ${st.reasons.join(', ')}` : ''}
        </span>
      </div>
      <section className="border-b border-cmd-line px-4 py-4" aria-label={panel.readings}>
        <div className="flex items-center justify-between gap-3">
          <p className="cmd-label text-cmd-faint">{panel.readings}</p>
          <SimTag />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {rows.map((row) => (
            <div key={row.id} className="min-w-0">
              <dt className="cmd-label text-cmd-faint">{row.label}</dt>
              <dd data-warn={row.warn ? 'true' : 'false'} className="font-cmd-mono text-sm tabular-nums text-cmd-text data-[warn=true]:text-cmd-signal-fg">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      {r.kinds.includes('edge-ai') && <Engagement room={r} time={time} />}
      {r.cameraWall && <CameraWall model={model} live={live} onSelect={onSelect} />}
      <section className="border-b border-cmd-line px-4 py-4" aria-label={panel.devices}>
        <p className="cmd-label text-cmd-faint">{panel.devices}</p>
        <ul className="mt-2 space-y-2">
          {kinds.map((k) => (
            <li key={k} className="text-sm">
              <span className="text-cmd-text">{deviceKinds[k].label}</span>
              <span className="block text-cmd-muted">{deviceKinds[k].measures}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="border-b border-cmd-line px-4 py-4" aria-label={panel.automations}>
        <p className="cmd-label text-cmd-faint">{panel.automations}</p>
        <ul className="mt-2 space-y-1.5 text-sm text-cmd-muted">
          {r.automations.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>
      <section className="px-4 py-4" aria-label={panel.services}>
        <p className="cmd-label mb-2 text-cmd-faint">{panel.services}</p>
        <ServiceChips ids={roomServices(r)} />
      </section>
    </>
  )
}

export default function CampusPanel(props) {
  const { sel } = props
  return (
    <div className="cp-panel">
      {sel.roomId ? <RoomView {...props} /> : sel.buildingId ? <BuildingView {...props} /> : <CampusList {...props} />}
    </div>
  )
}
