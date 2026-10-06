import { describe, expect, it } from 'vitest'
import { CAMPUS_FRAME, DAY, buildings, dayPhases, deviceKinds, layers, services } from '../campusData'
import { campus } from '../content'

const rooms = buildings.flatMap((b) => b.rooms.map((r) => ({ ...r, building: b })))
const serviceIds = new Set(services.map((s) => s.id))
const layerIds = new Set(layers.map((l) => l.id))

// Every visible string of the campus content, for the wording rules.
function texts() {
  const out = []
  for (const b of buildings) {
    out.push(b.name, b.summary)
    for (const r of b.rooms) out.push(r.name, ...(r.short ? [r.short] : []), ...r.automations)
  }
  for (const s of services) out.push(s.name, s.desc)
  for (const k of Object.values(deviceKinds)) out.push(k.label, k.measures)
  for (const l of layers) out.push(l.label)
  for (const p of dayPhases) out.push(p.label)
  return out
}

describe('campus content ids and references', () => {
  it('has unique building, room and service ids', () => {
    const ids = [...buildings.map((b) => b.id), ...rooms.map((r) => r.id)]
    expect(new Set(ids).size).toBe(ids.length)
    expect(serviceIds.size).toBe(services.length)
  })
  it('only lists known device kinds, each serving a known slice service', () => {
    for (const r of rooms) for (const d of r.devices) expect(deviceKinds[d], `${r.id}: ${d}`).toBeDefined()
    for (const [id, k] of Object.entries(deviceKinds)) {
      expect(serviceIds.has(k.service), id).toBe(true)
      expect(services.find((s) => s.id === k.service).slice, id).toBe(true)
    }
  })
  it('puts every service on a known layer and keeps the first slice at ten services', () => {
    for (const s of services) expect(layerIds.has(s.layer), s.id).toBe(true)
    expect(services.filter((s) => s.slice)).toHaveLength(10)
    expect(services).toHaveLength(19)
  })
  it('uses every slice service in at least one room', () => {
    const used = new Set(rooms.flatMap((r) => r.devices.map((d) => deviceKinds[d].service)))
    for (const s of services.filter((x) => x.slice)) expect(used.has(s.id), s.id).toBe(true)
  })
  it('gives a room a floor its building has', () => {
    for (const r of rooms) {
      if (r.building.floors === 0) expect(r.floor).toBe(0)
      else expect(r.floor).toBeLessThan(r.building.floors)
    }
  })
  it('keeps the day phases in order inside the day', () => {
    const at = dayPhases.map((p) => p.at)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    for (const t of at) expect(t >= DAY.start && t < DAY.end).toBe(true)
  })
  it('keeps the frame symmetric enough to centre the camera', () => {
    expect(CAMPUS_FRAME.x[0]).toBeLessThan(0)
    expect(CAMPUS_FRAME.z[1]).toBeGreaterThan(0)
  })
})

describe('campus wording rules', () => {
  it('has no digits in any content text (numbers only come from the simulation)', () => {
    for (const t of texts()) expect(t, t).not.toMatch(/\d/)
  })
  it('labels the section illustrative and the readings simulated for every visitor', () => {
    expect(campus.badge).toMatch(/illustrative/i)
    expect(campus.badge).toMatch(/simulated/i)
    expect(campus.servicesNote).toMatch(/pending/i)
  })
  it('describes engagement analytics as anonymous and class-level, never identifying anyone', () => {
    const e = services.find((s) => s.id === 'engagement')
    expect(e.desc).toMatch(/anonymous/i)
    expect(e.desc).toMatch(/class-level/i)
    expect(e.desc).toMatch(/no faces are recognised/i)
    expect(campus.panel.engagementNote).toMatch(/anonymous/i)
    // Recognition is only ever mentioned as something the system does not do.
    for (const t of texts()) if (/recogni[sz]/i.test(t)) expect(t).toMatch(/no faces are recognised/i)
  })
  it('keeps people out of the camera wall', () => {
    expect(campus.panel.cameraWallNote).toMatch(/never video of people/i)
  })
})
