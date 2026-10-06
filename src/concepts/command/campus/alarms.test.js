import { describe, expect, it } from 'vitest'
import { DAY, SEVERITIES, alarmRules, buildings, deviceKinds } from '../campusData'
import { alarmsAt } from './alarms'
import { buildCampusModel } from './model'
import { evaluateRules, roomStatus, ruleApplies, telemetry, topSeverity } from './simulate'

const model = buildCampusModel()
const room = (id) => model.byId[id]
const h = (hours, minutes = 0) => hours * 60 + minutes

describe('entity model', () => {
  it('names every device after its room and profile, uniquely, in capitals only', () => {
    const names = model.devices.map((d) => d.name)
    expect(new Set(names).size).toBe(names.length)
    for (const n of names) expect(n).toMatch(/^[A-Z]+-[A-Z]+$/)
    expect(room('classroom-a').devices.find((d) => d.kind === 'co2-sensor').name).toBe('CLA-AQ')
  })
  it('gives every room a unique asset code', () => {
    const codes = buildings.flatMap((b) => b.rooms.map((r) => r.code))
    expect(new Set(codes).size).toBe(codes.length)
  })
  it('reports only the telemetry keys of the devices a room has', () => {
    const lib = telemetry(room('reading-hall'), h(10))
    expect(Object.keys(lib)).toContain('co2')
    expect(Object.keys(lib)).not.toContain('focused')
    expect(telemetry(room('classroom-a'), h(10)).focused).toBeGreaterThan(0)
    for (const k of Object.values(deviceKinds)) expect(k.telemetry.length, k.label).toBeGreaterThan(0)
  })
})

describe('alarm rules', () => {
  it('use known severities, device kinds and telemetry keys, most severe level first', () => {
    for (const r of alarmRules) {
      expect(deviceKinds[r.device], r.id).toBeDefined()
      expect(deviceKinds[r.device].telemetry, r.id).toContain(r.key)
      const ranks = r.levels.map((l) => SEVERITIES.indexOf(l.severity))
      for (const x of ranks) expect(x).toBeGreaterThanOrEqual(0)
      expect([...ranks].sort((a, b) => a - b)).toEqual(ranks)
    }
  })
  it('apply to every room that has a rule’s device, at least once each', () => {
    for (const r of alarmRules) expect(model.rooms.some((x) => ruleApplies(r, x)), r.id).toBe(true)
  })
  it('raise high CO₂ late in a lesson block and never in an empty classroom', () => {
    expect(evaluateRules(room('classroom-c'), h(11, 15)).map((f) => f.rule.id)).toContain('high-co2')
    expect(evaluateRules(room('classroom-c'), h(12, 30))).toEqual([])
  })
  it('only flag equipment left on after hours', () => {
    expect(evaluateRules(room('computer-lab'), h(19)).map((f) => f.rule.id)).toContain('equipment-on')
    expect(evaluateRules(room('computer-lab'), h(12)).map((f) => f.rule.id)).not.toContain('equipment-on')
  })
  it('give a room the most severe level that fires', () => {
    expect(topSeverity(['WARNING', 'MAJOR', 'MINOR'])).toBe('MAJOR')
    expect(topSeverity([])).toBeNull()
    expect(roomStatus(room('classroom-c'), h(11, 15)).severity).toBeTruthy()
    expect(roomStatus(room('classroom-c'), h(12, 30))).toEqual({ status: 'ok', severity: null, reasons: [] })
  })
})

describe('alarmsAt', () => {
  it('has no alarms at the start of the day', () => {
    expect(alarmsAt(model, DAY.start)).toEqual([])
  })
  it('is deterministic', () => {
    expect(alarmsAt(model, h(15))).toEqual(alarmsAt(model, h(15)))
  })
  it('keeps a morning CO₂ alarm active during the lesson and cleared, with an end time, by lunch', () => {
    const active = alarmsAt(model, h(11, 20)).find((a) => a.ruleId === 'high-co2' && a.roomId === 'classroom-c')
    expect(active.status).toBe('ACTIVE')
    expect(active.end).toBeNull()
    expect(active.originator).toBe('CLC-AQ')
    const cleared = alarmsAt(model, h(12, 30)).find((a) => a.id === active.id)
    expect(cleared.status).toBe('CLEARED')
    expect(cleared.end).toBeGreaterThan(cleared.start)
    expect(cleared.end).toBeLessThanOrEqual(h(12, 30))
  })
  it('lists active alarms first, most severe first', () => {
    const list = alarmsAt(model, h(19))
    const firstCleared = list.findIndex((a) => a.status === 'CLEARED')
    if (firstCleared >= 0) for (const a of list.slice(firstCleared)) expect(a.status).toBe('CLEARED')
    const active = list.filter((a) => a.status === 'ACTIVE').map((a) => SEVERITIES.indexOf(a.severity))
    expect([...active].sort((a, b) => a - b)).toEqual(active)
    expect(list.some((a) => a.ruleId === 'equipment-on' && a.status === 'ACTIVE')).toBe(true)
  })
  it('gives every alarm a unique id and a start inside the day', () => {
    const list = alarmsAt(model, DAY.end)
    expect(new Set(list.map((a) => a.id)).size).toBe(list.length)
    for (const a of list) expect(a.start >= DAY.start && a.start <= DAY.end).toBe(true)
  })
})
