import { describe, expect, it } from 'vitest'
import { DAY } from '../campusData'
import { buildCampusModel } from './model'
import {
  CO2_LIMIT, clampDay, clock, engagement, inLessons, layerValue, occupancy, phaseAt, readings, roomState, roomStatus, sunAt, toPercents,
} from './simulate'

const model = buildCampusModel()
const room = (id) => model.byId[id]
const h = (hours, minutes = 0) => hours * 60 + minutes
const everyQuarter = Array.from({ length: (DAY.end - DAY.start) / 15 + 1 }, (_, i) => DAY.start + i * 15)

describe('the clock and the day', () => {
  it('formats minutes as a clock', () => {
    expect(clock(h(6))).toBe('06:00')
    expect(clock(h(13, 5))).toBe('13:05')
  })
  it('names the phase of the day', () => {
    expect(phaseAt(h(6))).toBeNull()
    expect(phaseAt(h(9))).toBe('lessons')
    expect(phaseAt(h(12))).toBe('lunch')
    expect(phaseAt(h(18))).toBe('after')
  })
  it('clamps a time to the school day', () => {
    expect(clampDay(0)).toBe(DAY.start)
    expect(clampDay(h(23))).toBe(DAY.end)
  })
  it('puts the sun up at noon and down after dark', () => {
    expect(sunAt(h(12)).daylight).toBe(1)
    expect(sunAt(h(19, 30)).daylight).toBe(0)
    expect(sunAt(h(9)).elevation).toBeGreaterThan(0)
  })
})

describe('occupancy', () => {
  it('stays between empty and full for every room all day', () => {
    for (const r of model.rooms) for (const t of everyQuarter) {
      const o = occupancy(r.usage, t)
      expect(o, `${r.id} ${clock(t)}`).toBeGreaterThanOrEqual(0)
      expect(o).toBeLessThanOrEqual(1)
    }
  })
  it('fills classrooms in lessons and empties them at lunch and after hours', () => {
    expect(occupancy('classroom', h(9))).toBeGreaterThan(0.9)
    expect(occupancy('classroom', h(12, 30))).toBeLessThan(0.05)
    expect(occupancy('classroom', h(19))).toBeLessThan(0.05)
  })
  it('makes the library busiest at lunch and the car park fullest mid-morning', () => {
    expect(occupancy('library', h(12, 15))).toBeGreaterThan(occupancy('library', h(9)))
    expect(occupancy('carpark', h(10))).toBeGreaterThan(occupancy('carpark', h(6, 15)))
    expect(occupancy('carpark', h(19, 45))).toBeLessThan(0.05)
  })
})

describe('room state and status', () => {
  it('is deterministic', () => {
    expect(roomState(room('classroom-a'), h(10))).toEqual(roomState(room('classroom-a'), h(10)))
  })
  it('raises CO₂ in a full classroom toward the end of a lesson block', () => {
    for (const id of ['classroom-a', 'classroom-b', 'classroom-c']) {
      expect(roomState(room(id), h(11, 15)).co2, id).toBeGreaterThan(roomState(room(id), h(7, 45)).co2)
    }
  })
  it('flags some classrooms late in a block, not all of them, and none at its start', () => {
    const ids = ['classroom-a', 'classroom-b', 'classroom-c']
    const late = ids.filter((id) => roomStatus(room(id), h(11, 15)).reasons.includes('High CO₂'))
    expect(late.length).toBeGreaterThan(0)
    expect(late.length).toBeLessThan(ids.length)
    for (const id of ids) expect(roomState(room(id), h(7, 45)).co2).toBeLessThan(CO2_LIMIT)
  })
  it('never calls an empty room warm', () => {
    expect(roomStatus(room('science-lab'), h(11, 29)).reasons).not.toContain('Room running warm')
  })
  it('keeps an empty classroom at outdoor-level CO₂ and normal status after hours', () => {
    expect(roomState(room('classroom-a'), h(19)).co2).toBeLessThan(450)
    expect(roomStatus(room('classroom-a'), h(19)).status).toBe('ok')
  })
  it('switches classroom air conditioning off once the room empties', () => {
    expect(roomState(room('classroom-b'), h(10)).acOn).toBe(true)
    expect(roomState(room('classroom-b'), h(19)).acOn).toBe(false)
    expect(roomState(room('server-room'), h(19)).acOn).toBe(true)
  })
  it('makes the solar roof produce by day only', () => {
    expect(roomState(room('computer-lab'), h(12)).solar).toBeGreaterThan(25)
    expect(roomState(room('computer-lab'), h(19, 30)).solar).toBe(0)
  })
})

describe('engagement (anonymous, class-level)', () => {
  it('exists only for a class in session in a room with an edge AI box', () => {
    expect(engagement(room('classroom-a'), h(9))).not.toBeNull()
    expect(engagement(room('classroom-a'), h(12, 30))).toBeNull()
    expect(engagement(room('science-lab'), h(9))).toBeNull()
    expect(engagement(room('reading-hall'), h(12))).toBeNull()
    expect(inLessons(h(12, 30))).toBe(false)
  })
  it('gives shares that sum to one, with only the four class-level keys', () => {
    for (const t of everyQuarter) {
      const e = engagement(room('classroom-c'), t)
      if (!e) continue
      expect(Object.keys(e).sort()).toEqual(['focused', 'headsDown', 'phone', 'talking'])
      expect(e.focused + e.phone + e.headsDown + e.talking).toBeCloseTo(1, 9)
      for (const v of Object.values(e)) expect(v).toBeGreaterThan(0)
    }
  })
  it('dips after lunch', () => {
    expect(engagement(room('classroom-b'), h(14)).focused).toBeLessThan(engagement(room('classroom-b'), h(9)).focused)
  })
  it('rounds to whole percentages that add up to a hundred', () => {
    const p = toPercents({ a: 1 / 3, b: 1 / 3, c: 1 / 3 })
    expect(p.a + p.b + p.c).toBe(100)
    const q = toPercents(engagement(room('classroom-a'), h(10)))
    expect(Object.values(q).reduce((x, y) => x + y, 0)).toBe(100)
  })
})

describe('readings', () => {
  it('lists a classroom’s readings from its services', () => {
    const ids = readings(room('classroom-a'), h(10)).map((r) => r.id)
    expect(ids).toEqual(expect.arrayContaining(['temp', 'humidity', 'ac', 'co2', 'people', 'lights', 'camera']))
    expect(ids).not.toContain('solar')
  })
  it('shows solar in the room with the inverter, and free spaces in the car park', () => {
    expect(readings(room('computer-lab'), h(12)).map((r) => r.id)).toContain('solar')
    const free = readings(room('car-park'), h(10)).find((r) => r.id === 'free')
    expect(free.value).toMatch(/ of /)
  })
  it('counts the campus cameras on the security room wall', () => {
    const wall = readings(room('security-room'), h(10), { cameraCount: 9 }).find((r) => r.id === 'wall')
    expect(wall.value).toBe('9 feeds online')
  })
})

describe('layers', () => {
  it('returns 0..1 or null for every room, layer and time', () => {
    for (const layer of ['climate', 'air', 'occupancy', 'energy', 'security', 'analytics']) {
      for (const r of model.rooms) for (const t of [h(6), h(10), h(12), h(15), h(19)]) {
        const v = layerValue(layer, r, t)
        if (v !== null) {
          expect(v, `${layer} ${r.id}`).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(1)
        }
      }
    }
  })
  it('dims rooms a layer does not cover', () => {
    expect(layerValue('analytics', room('reading-hall'), h(10))).toBeNull()
    expect(layerValue('air', room('car-park'), h(10))).toBeNull()
    expect(layerValue('none', room('classroom-a'), h(10))).toBeNull()
  })
})
