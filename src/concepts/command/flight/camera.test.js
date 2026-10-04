import { describe, expect, it } from 'vitest'
import {
  DOLLY_MAX_MS, DOLLY_MIN_MS, FOV, ORBIT_LIMIT_DEG, PARALLAX_DEG, PITCH_DEG, boxCenter, boxCorners, cameraEye, cameraGoal, clampOrbit,
  easeOutCubic, fitDistance, keyOrbit, ndcToPx, parallaxOffset, projectPoint, toRad, tweenCamera,
} from './camera'
import { workflows } from '../../../content/site'
import { buildRun } from '../../../workflow/run'
import { JOURNEY_FRAME, PLAN_FRAME, buildPlanModel } from './model'

describe('projectPoint', () => {
  const cam = { eye: [0, 10, 20], target: [0, 0, 0], fov: FOV, aspect: 2 }
  it('puts the look-at target in the middle of the frame', () => {
    const q = projectPoint([0, 0, 0], cam)
    expect(q.x).toBeCloseTo(0, 6)
    expect(q.y).toBeCloseTo(0, 6)
    expect(q.visible).toBe(true)
  })
  it('puts points to the right of the target on the right, and higher points higher', () => {
    expect(projectPoint([3, 0, 0], cam).x).toBeGreaterThan(0)
    expect(projectPoint([0, 3, 0], cam).y).toBeGreaterThan(0)
  })
  it('scales by the field of view: a point on the top edge of the view reads as ndc y of 1', () => {
    const dist = Math.hypot(10, 20)
    const half = dist * Math.tan(toRad(FOV) / 2)
    const fwd = [0, -10 / dist, -20 / dist]
    const up = [0, 20 / dist, -10 / dist]
    const p = [0, 0, 0].map((_, i) => fwd[i] * dist + up[i] * half + cam.eye[i])
    expect(projectPoint(p, cam).y).toBeCloseTo(1, 5)
  })
  it('flags points behind the camera', () => {
    expect(projectPoint([0, 10, 40], cam).visible).toBe(false)
  })
  it('maps ndc to pixels with y down', () => {
    expect(ndcToPx({ x: 0, y: 0 }, 800, 400)).toEqual({ x: 400, y: 200 })
    expect(ndcToPx({ x: -1, y: 1 }, 800, 400)).toEqual({ x: 0, y: 0 })
  })
})

describe('cameraEye', () => {
  it('sits the given pitch above the target, on the +z side when yaw is zero', () => {
    const eye = cameraEye({ target: [0, 0, 0], distance: 10, yaw: 0, pitch: toRad(55) })
    expect(eye[0]).toBeCloseTo(0)
    expect(eye[1]).toBeCloseTo(10 * Math.sin(toRad(55)))
    expect(eye[2]).toBeCloseTo(10 * Math.cos(toRad(55)))
  })
})

describe('framing', () => {
  it('fits every corner of the plot inside the frame, tightly', () => {
    for (const frame of [PLAN_FRAME, JOURNEY_FRAME]) {
      for (const aspect of [0.9, 1.9]) {
        const center = boxCenter(frame)
        const yaw = toRad(-12)
        const pitch = toRad(55)
        const distance = fitDistance(frame, { target: center, yaw, pitch, aspect, margin: 1.1 })
        const eye = cameraEye({ target: center, distance, yaw, pitch })
        let worst = 0
        for (const c of boxCorners(frame)) {
          const q = projectPoint(c, { eye, target: center, aspect })
          worst = Math.max(worst, Math.abs(q.x), Math.abs(q.y))
        }
        expect(worst).toBeLessThanOrEqual(1 / 1.1 + 0.01)
        expect(worst).toBeGreaterThan(0.8)
      }
    }
  })
  it('fits the points it is given, tighter than the whole box', () => {
    const wf = workflows[0]
    const m = buildPlanModel(wf, buildRun(wf, 0))
    const tight = cameraGoal({ frame: m.frame, points: m.fit, aspect: 1.9 })
    const loose = cameraGoal({ frame: m.frame, aspect: 1.9 })
    expect(tight.distance).toBeLessThan(loose.distance)
    for (const p of m.fit) {
      const eye = cameraEye(tight)
      const q = projectPoint(p, { eye, target: tight.target, aspect: 1.9 })
      expect(Math.abs(q.x)).toBeLessThan(1)
      expect(Math.abs(q.y)).toBeLessThan(1)
    }
  })
  it('leans toward the active waypoint, but only part of the way', () => {
    const goal = cameraGoal({ frame: PLAN_FRAME, focus: [4, 2, 5], aspect: 1.9 })
    const flat = cameraGoal({ frame: PLAN_FRAME, focus: null, aspect: 1.9 })
    expect(goal.target[0]).toBeGreaterThan(flat.target[0])
    expect(goal.target[0]).toBeLessThan(4)
    expect(goal.distance).toBeCloseTo(flat.distance)
  })
  it('looks down about 55 to 60 degrees, and from nearly above on a phone', () => {
    expect(cameraGoal({ frame: PLAN_FRAME, aspect: 1.9 }).pitch).toBeCloseTo(toRad(PITCH_DEG))
    expect(PITCH_DEG).toBeGreaterThanOrEqual(55)
    expect(PITCH_DEG).toBeLessThanOrEqual(60)
    expect(cameraGoal({ frame: PLAN_FRAME, aspect: 0.8, flat: true }).pitch).toBeGreaterThan(toRad(75))
  })
})

describe('dolly', () => {
  const a = { target: [0, 0, 0], distance: 40 }
  const b = { target: [4, 2, 6], distance: 36 }
  it('eases out: past half way at half the time', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
    expect(tweenCamera(a, b, 400).distance).toBeLessThan(38)
  })
  it('starts at the old state and ends exactly on the new one', () => {
    expect(tweenCamera(a, b, 0).target).toEqual([0, 0, 0])
    const end = tweenCamera(a, b, 900)
    expect(end.target).toEqual([4, 2, 6])
    expect(end.distance).toBe(36)
    expect(end.done).toBe(true)
  })
  it('is never faster than 600 ms nor slower than 900 ms', () => {
    expect(tweenCamera(a, b, 300, 100).done).toBe(false) // asked for 100 ms, held to 600
    expect(tweenCamera(a, b, 600, 100).done).toBe(true)
    expect(tweenCamera(a, b, 899, 5000).done).toBe(false) // asked for 5 s, held to 900
    expect(tweenCamera(a, b, DOLLY_MAX_MS, 5000).done).toBe(true)
    expect(DOLLY_MIN_MS).toBe(600)
  })
})

describe('orbit and parallax', () => {
  it('clamps drag to +-25 degrees', () => {
    expect(clampOrbit(90, -90)).toEqual({ yaw: ORBIT_LIMIT_DEG, pitch: -ORBIT_LIMIT_DEG })
    expect(clampOrbit(3, -4)).toEqual({ yaw: 3, pitch: -4 })
  })
  it('limits pointer parallax to about 4 degrees', () => {
    expect(parallaxOffset(1, -1)).toEqual({ yaw: PARALLAX_DEG, pitch: PARALLAX_DEG })
    expect(parallaxOffset(9, 9).yaw).toBe(PARALLAX_DEG)
    expect(parallaxOffset(0, 0)).toEqual({ yaw: 0, pitch: -0 })
  })
  it('maps arrow keys to nudges and Escape to a reset', () => {
    expect(keyOrbit('ArrowLeft').dyaw).toBeLessThan(0)
    expect(keyOrbit('ArrowRight').dyaw).toBeGreaterThan(0)
    expect(keyOrbit('ArrowUp').dpitch).toBeGreaterThan(0)
    expect(keyOrbit('Escape')).toEqual({ reset: true })
    expect(keyOrbit('a')).toBeNull()
  })
})
