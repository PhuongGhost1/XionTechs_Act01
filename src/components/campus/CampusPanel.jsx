import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { alarmRules, deviceKinds, services } from '../campusData'
import { campus } from '../content'
import CampusFeed from './CampusFeed'
import { originatorOf } from './alarms'
import { buildingAttention, cameraList } from './live'
import { buildingServices, roomServices, roomsByFloor } from './model'
import { up } from './navigation'
import { stepIndex } from './keys'
import { clock, engagement, readings, ruleApplies, toPercents } from './simulate'

// The side panel. It doubles as the accessible room list: every building and room the model shows can be
// reached here with the keyboard, and hovering an entry marks it in the model. Readings are simulated and
// tagged so (CLAUDE.md "Content rules"); engagement is anonymous and class-level only.

const serviceById = Object.fromEntries(services.map((s) => [s.id, s]))
const { panel } = campus
const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function SimTag({ children = campus.simulated }) {
  return <span className="cmd-label border border-dashed border-cmd-faint px-1.5 py-0.5 text-cmd-faint">{children}</span>
}

function StatusDot({ status, severity }) {
  return <span aria-hidden="true" data-status={status} data-severity={severity ?? undefined} className="cp-dot" />
}

function SeverityChip({ severity }) {
  return (
    <span data-severity={severity} className="cp-sev cmd-label">
      {panel.severity[severity]}
    </span>
  )
}

// One alarm row. `showRoom` on the campus list, where the room is the link.
function AlarmRow({ model, alarm, acked, onAck, onOpen }) {
  const r = model.byId[alarm.roomId]
  const isAcked = acked.has(alarm.id)
  const state = `${alarm.status === 'ACTIVE' ? panel.alarm.active : panel.alarm.cleared}${isAcked ? ` · ${panel.alarm.acked}` : ''}`
  return (
    <li data-status={alarm.status} className="cp-alarm border-b border-cmd-line px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <SeverityChip severity={alarm.severity} />
            <span className="text-sm text-cmd-text">{alarm.type}</span>
          </p>
          <p className="cmd-label mt-1.5 text-cmd-faint">
            {onOpen ? (
              <button type="button" onClick={onOpen} className="text-cmd-muted underline decoration-cmd-line underline-offset-2 hover:text-cmd-text">
                {r.name}
              </button>
            ) : null}
            {onOpen ? ' · ' : ''}
            <span className="font-cmd-mono">{alarm.originator}</span> · {clock(alarm.start)}
            {alarm.end != null ? `–${clock(alarm.end)}` : ''}
          </p>
          <p className="cmd-label mt-1 text-cmd-faint">{state}</p>
        </div>
        {alarm.status === 'ACTIVE' && !isAcked && (
          <button type="button" onClick={() => onAck(alarm.id)} className="cmd-label min-h-[32px] shrink-0 border border-cmd-line px-2 text-cmd-muted hover:border-cmd-faint hover:text-cmd-text">
            {panel.alarm.ack}
          </button>
        )}
      </div>
    </li>
  )
}

function CampusAlarms({ model, live, acked, onAck, onSelect }) {
  const active = live.alarms.filter((a) => a.status === 'ACTIVE')
  const shown = [...active, ...live.alarms.filter((a) => a.status === 'CLEARED').slice(0, Math.max(0, 6 - active.length))]
  return (
    <section aria-label={panel.alarm.title} className="border-t border-cmd-line">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4">
        <h4 className="cmd-label text-cmd-faint">
          {panel.alarm.title} · {active.length} {panel.alarm.active.toLowerCase()}
        </h4>
        <SimTag />
      </div>
      {shown.length ? (
        <ul className="border-t border-cmd-line">
          {shown.map((a) => (
            <AlarmRow
              key={a.id}
              model={model}
              alarm={a}
              acked={acked}
              onAck={onAck}
              onOpen={() => onSelect({ buildingId: model.byId[a.roomId].buildingId, roomId: a.roomId }, 'alarms')}
            />
          ))}
        </ul>
      ) : (
        <p className="px-4 pb-4 text-sm text-cmd-muted">{panel.alarm.none}</p>
      )}
    </section>
  )
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

function CampusList({ model, live, hover, acked, onAck, onSelect, onHover }) {
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
      <CampusAlarms model={model} live={live} acked={acked} onAck={onAck} onSelect={onSelect} />
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
                        <StatusDot status={st.status} severity={st.severity} />
                        {r.name}
                      </span>
                      <span className="cmd-label mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-cmd-faint">
                        <span className="font-cmd-mono">{r.code}</span>
                        <span>{count(r.kinds.length, 'device')}</span>
                        {st.severity ? (
                          <>
                            <SeverityChip severity={st.severity} />
                            <span className="normal-case tracking-normal">{st.reasons[0]}</span>
                          </>
                        ) : null}
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

function CameraWall({ model, live, time, feeds, onSelect }) {
  return (
    <section className="border-b border-cmd-line px-4 py-4" aria-label={panel.cameraWall}>
      <div className="flex items-center justify-between gap-3">
        <p className="cmd-label text-cmd-faint">{panel.cameraWall}</p>
        <SimTag>{panel.feedTag}</SimTag>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-1.5">
        {cameraList(model).map((cam) => {
          const r = model.byId[cam.roomId]
          return (
            <li key={cam.deviceId}>
              <CampusFeed
                cam={cam}
                room={r}
                state={live.states[r.id]}
                night={live.lamps}
                time={time}
                feeds={feeds}
                compact
                onOpen={() => onSelect({ buildingId: r.buildingId, roomId: r.id })}
              />
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-cmd-faint">{feeds.three ? panel.cameraWallNote : panel.feedFallback}</p>
    </section>
  )
}

function CameraView({ model, live, room, time, feeds }) {
  const cams = cameraList(model).filter((c) => c.roomId === room.id)
  if (!cams.length) return null
  return (
    <section className="border-b border-cmd-line px-4 py-4" aria-label={panel.cameraView}>
      <div className="flex items-center justify-between gap-3">
        <p className="cmd-label text-cmd-faint">{panel.cameraView}</p>
        <SimTag>{panel.feedTag}</SimTag>
      </div>
      <div className="mt-3 space-y-1.5">
        {cams.map((cam) => (
          <CampusFeed key={cam.deviceId} cam={cam} room={room} state={live.states[room.id]} night={live.lamps} time={time} feeds={feeds} />
        ))}
      </div>
      {!feeds.three && <p className="mt-2 text-xs text-cmd-faint">{panel.feedFallback}</p>}
    </section>
  )
}

const TABS = ['telemetry', 'attributes', 'devices', 'alarms', 'rules']

function Tabs({ tab, onTab }) {
  const refs = useRef([])
  const current = Math.max(0, TABS.indexOf(tab))
  const onKeyDown = (e) => {
    const next = stepIndex(e.key, current, TABS.length)
    if (next == null) return
    e.preventDefault()
    onTab(TABS[next])
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label={panel.readings} onKeyDown={onKeyDown} className="cp-scroll flex overflow-x-auto border-b border-cmd-line">
      {TABS.map((id, i) => (
        <button
          key={id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="tab"
          id={`cp-tab-${id}`}
          aria-selected={i === current}
          aria-controls="cp-tabpanel"
          tabIndex={i === current ? 0 : -1}
          data-on={i === current ? 'true' : 'false'}
          onClick={() => onTab(id)}
          className="cmd-label min-h-[44px] flex-1 shrink-0 whitespace-nowrap border-b-2 border-transparent px-2 !text-[10px] !tracking-[0.06em] text-cmd-muted transition-colors duration-micro ease-cmd hover:text-cmd-text focus-visible:[outline-offset:-3px] data-[on=true]:border-cmd-signal data-[on=true]:text-cmd-signal-fg"
        >
          {panel.tabs[id]}
        </button>
      ))}
    </div>
  )
}

function TelemetryTab({ model, live, r, time, feeds, onSelect }) {
  const rows = readings(r, time, { cameraCount: live.cameraCount })
  return (
    <>
      <CameraView model={model} live={live} room={r} time={time} feeds={feeds} />
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
      {r.cameraWall && <CameraWall model={model} live={live} time={time} feeds={feeds} onSelect={onSelect} />}
      <section className="px-4 py-4" aria-label={panel.services}>
        <p className="cmd-label mb-2 text-cmd-faint">{panel.services}</p>
        <ServiceChips ids={roomServices(r)} />
      </section>
    </>
  )
}

function AttributesTab({ model, r }) {
  const b = model.byId[r.buildingId]
  const rows = [
    [panel.attr.type, r.outdoor ? panel.attr.zone : panel.attr.room],
    [panel.attr.code, r.code, true],
    [panel.attr.parent, b.name],
    [panel.attr.relation, `${b.name} ${panel.attr.contains.toLowerCase()} ${r.name}`],
    [panel.attr.floor, r.outdoor ? panel.attr.open : campus.floorNames[r.floor]],
    [panel.attr.usage, r.usage, true],
    [panel.attr.capacity, r.capacity ? String(r.capacity) : '—', true],
    [panel.attr.devices, String(r.kinds.length), true],
  ]
  return (
    <section className="px-4 py-4" aria-label={panel.tabs.attributes}>
      <dl className="divide-y divide-cmd-line border-y border-cmd-line">
        {rows.map(([k, v, mono]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="cmd-label text-cmd-faint">{k}</dt>
            <dd className={`text-right text-sm text-cmd-text ${mono ? 'font-cmd-mono' : ''}`}>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function DevicesTab({ r }) {
  return (
    <ul aria-label={panel.tabs.devices}>
      {r.devices.map((d) => {
        const k = deviceKinds[d.kind]
        return (
          <li key={d.id} className="border-b border-cmd-line px-4 py-3">
            <p className="flex items-baseline justify-between gap-3">
              <span className="font-cmd-mono text-sm text-cmd-text">{d.name}</span>
              <span className="cmd-label text-cmd-faint">{k.transport}</span>
            </p>
            <p className="mt-0.5 text-sm text-cmd-muted">
              {k.label} · {k.measures}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1" aria-label={panel.device.keys}>
              {k.telemetry.map((key) => (
                <li key={key} className="border border-cmd-line px-1.5 py-0.5 font-cmd-mono text-[11px] text-cmd-muted">
                  {key}
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

function AlarmsTab({ model, live, r, acked, onAck }) {
  const list = live.alarms.filter((a) => a.roomId === r.id)
  return (
    <section aria-label={panel.tabs.alarms}>
      {list.length ? (
        <ul>
          {list.map((a) => (
            <AlarmRow key={a.id} model={model} alarm={a} acked={acked} onAck={onAck} />
          ))}
        </ul>
      ) : (
        <p className="border-b border-cmd-line px-4 py-4 text-sm text-cmd-muted">{panel.alarm.none}</p>
      )}
      <p className="px-4 py-3 text-xs text-cmd-faint">{panel.alarm.note}</p>
    </section>
  )
}

function ChainNode({ kind, children }) {
  return (
    <li className="cp-node" data-kind={kind}>
      <span className="cmd-label block text-cmd-faint">{panel.chain[kind]}</span>
      <span className="block text-sm text-cmd-text">{children}</span>
    </li>
  )
}

function RulesTab({ r }) {
  const rules = alarmRules.filter((rule) => ruleApplies(rule, r))
  return (
    <section aria-label={panel.tabs.rules} className="px-4 py-4">
      {rules.length ? (
        <div className="space-y-5">
          {rules.map((rule) => (
            <div key={rule.id}>
              <p className="text-sm text-cmd-text">{rule.type}</p>
              <ol className="cp-chain mt-2">
                <ChainNode kind="input">
                  <span className="font-cmd-mono">{originatorOf(r, rule)}</span> · <span className="font-cmd-mono">{rule.key}</span>
                </ChainNode>
                <ChainNode kind="save">{panel.chain.save}</ChainNode>
                <ChainNode kind="filter">
                  <span className="font-cmd-mono">
                    {rule.levels
                      .map((l) => `${rule.key} ${l.op} ${l.value}${rule.unit ? ` ${rule.unit}` : ''}`)
                      .join('  |  ')}
                  </span>
                  {rule.occupied ? ' · occupied' : ''}
                  {rule.after != null ? ` · after ${clock(rule.after)}` : ''}
                </ChainNode>
                <ChainNode kind="alarm">
                  {rule.levels.map((l) => (
                    <SeverityChip key={l.severity} severity={l.severity} />
                  ))}
                </ChainNode>
                <ChainNode kind="action">{rule.action}</ChainNode>
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-cmd-muted">{panel.chain.none}</p>
      )}
      <div className="mt-5 border-t border-cmd-line pt-4">
        <p className="cmd-label text-cmd-faint">{panel.chain.other}</p>
        <ul className="mt-2 space-y-1.5 text-sm text-cmd-muted">
          {r.automations.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function RoomView({ model, live, sel, time, feeds, tab, onTab, acked, onAck, onSelect }) {
  const r = model.byId[sel.roomId]
  const b = model.byId[r.buildingId]
  const st = live.states[r.id]
  const kicker = b.outdoor ? b.name : `${b.name} · ${campus.floorNames[r.floor] ?? ''}`
  const props = { model, live, r, time, feeds, acked, onAck, onSelect }
  return (
    <>
      <PanelHead title={r.name} kicker={kicker} onBack={() => onSelect(up(sel))} />
      <div className="flex flex-wrap items-center gap-2 border-b border-cmd-line px-4 py-3 text-sm">
        <StatusDot status={st.status} severity={st.severity} />
        {st.severity && <SeverityChip severity={st.severity} />}
        <span className={st.status === 'attention' ? 'text-cmd-signal-fg' : 'text-cmd-muted'}>
          {st.reasons.length ? st.reasons.join(', ') : panel.status.ok}
        </span>
      </div>
      <Tabs tab={tab} onTab={onTab} />
      <div role="tabpanel" id="cp-tabpanel" aria-labelledby={`cp-tab-${tab}`}>
        {tab === 'attributes' ? (
          <AttributesTab {...props} />
        ) : tab === 'devices' ? (
          <DevicesTab {...props} />
        ) : tab === 'alarms' ? (
          <AlarmsTab {...props} />
        ) : tab === 'rules' ? (
          <RulesTab {...props} />
        ) : (
          <TelemetryTab {...props} />
        )}
      </div>
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
