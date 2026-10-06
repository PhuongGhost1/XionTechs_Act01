import { describe, expect, it } from 'vitest'
import { buildCampusModel } from './model'
import { buildingAttention, campusAt } from './live'

const model = buildCampusModel()
const h = (hours, minutes = 0) => hours * 60 + minutes

describe('campusAt', () => {
  it('has a state for every room', () => {
    const live = campusAt(model, h(10), 'none')
    expect(Object.keys(live.states).sort()).toEqual(model.rooms.map((r) => r.id).sort())
  })
  it('fills the car park by day and lights the lamps after dark', () => {
    expect(campusAt(model, h(10), 'none').parked).toBeGreaterThan(15)
    expect(campusAt(model, h(19, 45), 'none').parked).toBe(0)
    expect(campusAt(model, h(19), 'none').lamps).toBe(true)
    expect(campusAt(model, h(10), 'none').lamps).toBe(false)
  })
  it('carries the layer value per room, null when no layer is on', () => {
    expect(campusAt(model, h(10), 'none').states['classroom-a'].layer).toBeNull()
    expect(campusAt(model, h(10), 'occupancy').states['classroom-a'].layer).toBeGreaterThan(0.9)
  })
  it('counts the campus cameras for the security room wall', () => {
    const live = campusAt(model, h(10), 'none')
    expect(live.cameraCount).toBe(model.rooms.filter((r) => r.kinds.includes('camera')).length)
    expect(live.cameraRooms).toContain('classroom-a')
  })
  it('counts the rooms that need attention, per building', () => {
    const live = campusAt(model, h(11, 15), 'none')
    expect(buildingAttention(model, live, 'teaching')).toBeGreaterThan(0)
    expect(live.attention).toBeGreaterThanOrEqual(buildingAttention(model, live, 'teaching'))
  })
})
