import { describe, expect, it } from 'vitest'
import { buildCampusModel } from './model'
import { ROOT, breadcrumb, focusBox, levelOf, pick, selectBuilding, selectRoom, up } from './navigation'
import {
  FOV, PITCH_MAX_DEG, PITCH_MIN_DEG, ZOOM_MAX, ZOOM_MIN, boxCorners, cameraEye, cameraGoal, keyCommand, ndcToPx, orbitBy, projectPoint,
  tweenCamera, zoomBy,
} from './camera'

const model = buildCampusModel()

describe('selection', () => {
  it('goes campus → building → room and back up one level at a time', () => {
    const b = selectBuilding(ROOT, 'teaching')
    expect(levelOf(ROOT)).toBe('campus')
    expect(levelOf(b)).toBe('building')
    const r = selectRoom(model, 'classroom-a')
    expect(r).toEqual({ buildingId: 'teaching', roomId: 'classroom-a' })
    expect(levelOf(r)).toBe('room')
    expect(up(r)).toEqual(b)
    expect(up(b)).toBe(ROOT)
    expect(up(ROOT)).toBe(ROOT)
  })
  it('opens a room only inside the open building; elsewhere a click opens its building', () => {
    expect(pick(model, ROOT, { roomId: 'classroom-a' })).toEqual({ buildingId: 'teaching', roomId: null })
    const open = { buildingId: 'teaching', roomId: null }
    expect(pick(model, open, { roomId: 'classroom-a' })).toEqual({ buildingId: 'teaching', roomId: 'classroom-a' })
    expect(pick(model, open, { roomId: 'reading-hall' })).toEqual({ buildingId: 'library', roomId: null })
    expect(pick(model, open, null)).toBe(ROOT)
  })
  it('reads the path as a breadcrumb', () => {
    const crumbs = breadcrumb(model, selectRoom(model, 'server-room'), 'Campus')
    expect(crumbs.map((c) => c.label)).toEqual(['Campus', 'Admin & security', 'Server room'])
  })
})

describe('focusBox', () => {
  it('frames the whole campus, an open building with its lifted floors, or one room', () => {
    expect(focusBox(model, ROOT).x).toEqual(model.frame.x)
    const b = focusBox(model, selectBuilding(ROOT, 'teaching'))
    expect(b.y[1]).toBeGreaterThan(model.byId.teaching.height)
    const r = focusBox(model, selectRoom(model, 'classroom-a'))
    expect(r.x).toEqual(model.byId['classroom-a'].x)
    expect(r.y[0]).toBeGreaterThan(model.byId['classroom-a'].y[0]) // the upper floor is lifted
  })
  it('frames the open-air zones together for the grounds', () => {
    const g = focusBox(model, selectBuilding(ROOT, 'grounds'))
    for (const id of model.byId.grounds.roomIds) {
      const r = model.byId[id]
      expect(r.x[0]).toBeGreaterThanOrEqual(g.x[0])
      expect(r.z[1]).toBeLessThanOrEqual(g.z[1])
    }
  })
})

describe('camera', () => {
  it('keeps every corner of the focus box inside the frame', () => {
    for (const sel of [ROOT, selectBuilding(ROOT, 'teaching'), selectRoom(model, 'office')]) {
      const box = focusBox(model, sel)
      const goal = cameraGoal({ box, level: levelOf(sel), aspect: 16 / 9 })
      const eye = cameraEye(goal)
      for (const c of boxCorners(box)) {
        const q = projectPoint(c, { eye, target: goal.target, fov: FOV, aspect: 16 / 9 })
        expect(Math.abs(q.x)).toBeLessThanOrEqual(1)
        expect(Math.abs(q.y)).toBeLessThanOrEqual(1)
      }
    }
  })
  it('starts phones from higher up on the campus view', () => {
    const box = focusBox(model, ROOT)
    expect(cameraGoal({ box, level: 'campus', aspect: 0.6, flat: true }).pitch).toBeGreaterThan(cameraGoal({ box, level: 'campus', aspect: 0.6 }).pitch)
  })
  it('turns all the way round but never under the ground or past the top', () => {
    expect(orbitBy({ yaw: 170, pitch: 0 }, 20, 0, 46).yaw).toBe(-170)
    expect(46 + orbitBy({ yaw: 0, pitch: 0 }, 0, -90, 46).pitch).toBe(PITCH_MIN_DEG)
    expect(46 + orbitBy({ yaw: 0, pitch: 0 }, 0, 90, 46).pitch).toBe(PITCH_MAX_DEG)
  })
  it('zooms within limits', () => {
    expect(zoomBy(1, 0.01)).toBe(ZOOM_MIN)
    expect(zoomBy(1, 100)).toBe(ZOOM_MAX)
  })
  it('dollies with an ease-out between 600 and 900 ms', () => {
    const a = { target: [0, 0, 0], distance: 10, pitch: 0 }
    const b = { target: [10, 0, 0], distance: 20, pitch: 1 }
    expect(tweenCamera(a, b, 400, 800).target[0]).toBeGreaterThan(5)
    expect(tweenCamera(a, b, 900, 2000).done).toBe(true)
    expect(tweenCamera(a, b, 500, 100).done).toBe(false)
  })
  it('maps keys to turns, zoom and going up', () => {
    expect(keyCommand('ArrowLeft').dyaw).toBeLessThan(0)
    expect(keyCommand('+').zoom).toBeLessThan(1)
    expect(keyCommand('-').zoom).toBeGreaterThan(1)
    expect(keyCommand('Escape')).toEqual({ up: true })
    expect(keyCommand('a')).toBeNull()
  })
  it('maps ndc to pixels with y down', () => {
    expect(ndcToPx({ x: -1, y: 1 }, 200, 100)).toEqual({ x: 0, y: 0 })
  })
})
