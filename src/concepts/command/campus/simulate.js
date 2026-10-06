// The simulated readings of the smart campus (ILLUSTRATIVE, labelled "Simulated" on the page). Every number
// the section shows comes from here, as a function of the room and the time of day `t` (minutes after
// midnight). Deterministic: no randomness, so a moment of the day always reads the same, and node tests pin
// the behaviour (simulate.test.js). Nothing here claims a real measurement.

import { DAY, SEVERITIES, alarmRules, deviceKinds as KINDS, dayPhases } from '../campusData'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, t) => {
  const x = clamp01((t - a) / (b - a))
  return x * x * (3 - 2 * x)
}
// 1 between a and b, easing in and out over `e` minutes on each side.
const during = (t, a, b, e = 10) => smooth(a - e, a, t) * (1 - smooth(b, b + e, t))
const bump = (t, at, width) => Math.exp(-(((t - at) / width) ** 2))
const h = (hours, minutes = 0) => hours * 60 + minutes

export const LESSON_BLOCKS = [
  [h(7, 30), h(11, 30)],
  [h(13, 30), h(16, 30)],
]
export const CO2_LIMIT = 1000
export const TEMP_LIMIT = 28

// A small, stable per-room variation, so the classrooms do not read identically.
// FNV-1a with a final mix, so ids that differ by one letter still land far apart.
export function roomSeed(id) {
  let s = 2166136261
  for (let i = 0; i < id.length; i++) s = Math.imul(s ^ id.charCodeAt(i), 16777619)
  s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d)
  s ^= s >>> 12
  return (s >>> 0) / 4294967296
}

export const clampDay = (t) => Math.min(DAY.end, Math.max(DAY.start, t))

export function clock(t) {
  const m = Math.round(t)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function phaseAt(t) {
  let current = null
  for (const p of dayPhases) if (t >= p.at) current = p.id
  return current
}

export function inLessons(t) {
  return LESSON_BLOCKS.some(([a, b]) => t >= a && t < b)
}

// Share of a room's capacity that is present, 0..1.
export function occupancy(usage, t) {
  switch (usage) {
    case 'classroom':
      return 0.95 * Math.max(during(t, h(7, 30), h(11, 30)), during(t, h(13, 30), h(16, 30)))
    case 'lab':
      return 0.85 * Math.max(during(t, h(8), h(10, 30)), during(t, h(14), h(15, 30)))
    case 'computer':
      return Math.max(0.9 * during(t, h(9), h(11, 30)), 0.8 * during(t, h(13, 30), h(15)), 0.35 * during(t, h(16, 45), h(17, 45)))
    case 'library':
      return Math.max(0.15 * during(t, h(7, 30), h(17)), 0.85 * during(t, h(11, 30), h(13)), 0.4 * during(t, h(16, 30), h(17, 30)))
    case 'office':
      return 0.75 * during(t, h(7), h(17, 30))
    case 'security':
      return 0.67
    case 'gate':
      return clamp01(bump(t, h(7, 5), 25) + 0.9 * bump(t, h(16, 50), 30) + 0.2 * bump(t, h(11, 40), 20))
    case 'carpark':
      return 0.92 * smooth(h(6, 30), h(7, 35), t) * (1 - 0.85 * smooth(h(16, 30), h(18), t)) * (1 - smooth(h(18, 30), h(19, 30), t))
    case 'park':
      return Math.max(0.2 * during(t, h(6, 45), h(7, 25)), 0.6 * during(t, h(11, 35), h(13, 15)), 0.4 * during(t, h(16, 35), h(17, 30)))
    case 'field':
      return Math.max(0.5 * during(t, h(9), h(10, 30)), 0.6 * during(t, h(14), h(16)), 0.5 * during(t, h(17), h(18, 30)))
    default:
      return 0
  }
}

// Outside air, a warm city: coolest at dawn, warmest early afternoon.
export const outdoorTemp = (t) => 27 + 5 * Math.cos((2 * Math.PI * (t - h(14))) / 1440)

// Sun: 0 at six and eighteen, 1 at noon, negative at night. `dir` points from the scene toward the sun.
export function sunAt(t) {
  const a = (Math.PI * (t - h(6))) / h(12)
  const elevation = Math.sin(a)
  const daylight = clamp01(elevation * 1.6)
  const dir = [Math.cos(a), Math.max(0.15, elevation), -0.45]
  return { elevation, daylight, dir }
}

export const lampsOn = (t) => t >= h(17, 50) || t < h(6, 10)

const INDOOR = new Set(['classroom', 'lab', 'computer', 'library', 'office', 'security', 'server'])
const CO2_GAIN = { classroom: 700, lab: 620, computer: 600, library: 520, office: 260, security: 300, server: 0 }
const BASE_KW = { classroom: 0.4, lab: 0.6, computer: 2.5, library: 0.6, office: 0.3, security: 2.2, server: 6 }
const PEOPLE_KW = { classroom: 1.5, lab: 2.2, computer: 9, library: 2, office: 0.5, security: 0.4, server: 0 }
const AC_KW = { classroom: 3.5, lab: 3, computer: 4, library: 6, office: 1.5, security: 1.2, server: 3 }

// Minutes since the current lesson block began (0 outside lessons), for the CO₂ build-up.
function intoBlock(t) {
  for (const [a, b] of LESSON_BLOCKS) if (t >= a && t < b) return t - a
  return 0
}

// The full state of a room at `t`: the numbers every reading, layer and status is built from.
export function roomState(room, t) {
  const usage = room.usage
  const occ = occupancy(usage, t)
  const seed = roomSeed(room.id)
  const out = outdoorTemp(t)
  const indoor = INDOOR.has(usage)
  const sun = sunAt(t)
  const acOn = indoor && (usage === 'server' || usage === 'security' || occ > 0.05)
  let temp = out
  if (indoor) {
    const heat = usage === 'computer' ? occ * 2.2 : usage === 'server' ? 0 : occ * 1.2
    temp = acOn ? (usage === 'server' ? 21.5 + (out - 27) * 0.06 : 24 + heat + (out - 27) * 0.12) : out - 0.8 + heat
  }
  const humidity = indoor && acOn ? 54 + seed * 6 : 74 - (out - 27) * 2.4
  // CO₂ builds up through a lesson block; how far depends on the room, so only some cross the limit.
  const buildUp = 0.5 + 0.22 * Math.min(1, intoBlock(t) / 200) + seed * 0.38
  const raw = 420 + occ * (CO2_GAIN[usage] ?? 0) * (usage === 'classroom' ? buildUp : 1)
  const vent = raw > 900 ? 'boosted' : 'normal'
  const co2 = indoor ? raw : 420
  const pm = indoor ? 8 + occ * 9 + seed * 4 : 18 + seed * 6
  const lights = indoor ? occ > 0.05 || usage === 'security' : lampsOn(t)
  const dim = indoor && lights ? Math.round(100 - 60 * sun.daylight) : lights ? 100 : 0
  const power = indoor ? (BASE_KW[usage] ?? 0) + occ * (PEOPLE_KW[usage] ?? 0) + (acOn ? AC_KW[usage] ?? 0 : 0) * (0.7 + 0.3 * clamp01((temp - 22) / 8)) : lights ? 1.2 : 0.1
  const solar = 30 * Math.max(0, sun.elevation) ** 1.2
  return { usage, occ, people: Math.round(occ * (room.capacity ?? 0)), temp, humidity, co2, vent, pm, acOn, lights, dim, power, solar, indoor, seed }
}

// Anonymous, class-level engagement shares while a class is in session; null otherwise (no class, or no
// edge AI box in the room). Shares sum to 1. Never per student.
export function engagement(room, t) {
  if (!room.kinds?.includes('edge-ai') || !inLessons(t) || occupancy(room.usage, t) < 0.5) return null
  const seed = roomSeed(room.id)
  const lunchDip = bump(t, h(14), 35) * 0.14
  const block = LESSON_BLOCKS.find(([a, b]) => t >= a && t < b)
  const fatigue = clamp01((t - (block[1] - 40)) / 40) * 0.1
  const wobble = 0.03 * Math.sin(t / 7 + seed * 6)
  const phone = 0.05 + fatigue * 0.6 + seed * 0.03
  const headsDown = 0.03 + lunchDip * 0.7 + fatigue * 0.2
  const talking = 0.06 + lunchDip * 0.3 + Math.max(0, -wobble)
  const focused = Math.max(0.4, 1 - phone - headsDown - talking + Math.min(0, wobble))
  const sum = focused + phone + headsDown + talking
  return { focused: focused / sum, phone: phone / sum, headsDown: headsDown / sum, talking: talking / sum }
}

// Whole percentages that add up to exactly 100 (largest remainder).
export function toPercents(shares) {
  const keys = Object.keys(shares)
  const raw = keys.map((k) => shares[k] * 100)
  const floor = raw.map(Math.floor)
  let left = 100 - floor.reduce((a, b) => a + b, 0)
  const order = raw.map((v, i) => [v - floor[i], i]).sort((a, b) => b[0] - a[0])
  for (const [, i] of order) {
    if (left <= 0) break
    floor[i]++
    left--
  }
  return Object.fromEntries(keys.map((k, i) => [k, floor[i]]))
}

// The time-series a room's devices would report at `t`, by telemetry key (campusData.js deviceKinds). Keys
// whose device the room does not have are left out.
export function telemetry(room, t, state = roomState(room, t)) {
  const kinds = new Set(room.kinds ?? [])
  const e = kinds.has('edge-ai') ? engagement(room, t) : null
  const all = {
    temperature: state.temp,
    humidity: state.humidity,
    acMode: state.acOn ? 'cooling' : 'off',
    setPoint: room.usage === 'server' ? 21 : 24,
    co2: state.co2,
    pm25: state.pm,
    people: state.people,
    lights: state.lights,
    dimLevel: state.dim,
    power: state.power,
    solarPower: state.solar,
    online: true,
    vehiclesPerHour: occupancy('gate', t) * 60,
    freeSpaces: (room.capacity ?? 0) - state.people,
    lamps: lampsOn(t),
    focused: e ? e.focused * 100 : null,
    onPhone: e ? e.phone * 100 : null,
    headsDown: e ? e.headsDown * 100 : null,
    talking: e ? e.talking * 100 : null,
  }
  const out = {}
  for (const k of kinds) for (const key of KINDS[k].telemetry) out[key] = all[key]
  return out
}

export const ruleApplies = (rule, room) => (room.kinds ?? []).includes(rule.device) && (!rule.usage || rule.usage === room.usage)

const holds = (op, v, limit) => (op === '>' ? v > limit : v < limit)

// The alarm rules that fire for a room at `t`, each with the severity of its first level that holds.
export function evaluateRules(room, t, state = roomState(room, t)) {
  const tele = telemetry(room, t, state)
  const out = []
  for (const rule of alarmRules) {
    if (!ruleApplies(rule, room)) continue
    if (rule.occupied && state.occ <= 0.05) continue // an empty room has its air conditioning off on purpose
    if (rule.after != null && t < rule.after) continue
    const v = tele[rule.key]
    if (v == null) continue
    const level = rule.levels.find((l) => holds(l.op, v, l.value))
    if (level) out.push({ rule, severity: level.severity, value: v })
  }
  return out
}

export const severityRank = (s) => (s ? SEVERITIES.indexOf(s) : SEVERITIES.length)
export const topSeverity = (list) => list.reduce((best, s) => (severityRank(s) < severityRank(best) ? s : best), null)

// Status of a room and why: `attention` while any alarm rule fires, with the most severe level.
export function roomStatus(room, t, state = roomState(room, t)) {
  const fired = evaluateRules(room, t, state)
  return {
    status: fired.length ? 'attention' : 'ok',
    severity: topSeverity(fired.map((f) => f.severity)),
    reasons: fired.map((f) => f.rule.type),
  }
}

const fmt = (v, digits = 0) => v.toFixed(digits)

// The readings a room's panel lists, from the services its devices serve. Values are display strings.
export function readings(room, t, ctx = {}) {
  const s = roomState(room, t)
  const services = new Set((room.kinds ?? []).map((k) => KINDS[k].service))
  const out = []
  if (services.has('temp-humidity')) {
    out.push({ id: 'temp', label: 'Temperature', value: `${fmt(s.temp, 1)} °C`, warn: s.indoor && s.temp > TEMP_LIMIT })
    out.push({ id: 'humidity', label: 'Humidity', value: `${fmt(s.humidity)} %` })
  }
  if (services.has('smart-ac')) {
    const set = room.usage === 'server' ? 21 : 24
    out.push({ id: 'ac', label: 'Air conditioning', value: s.acOn ? `Cooling to ${set} °C` : 'Off' })
  }
  if (services.has('air-quality')) {
    out.push({ id: 'co2', label: 'CO₂', value: `${fmt(s.co2)} ppm`, warn: s.co2 > CO2_LIMIT })
    out.push({ id: 'pm', label: 'Fine dust', value: `${fmt(s.pm)} µg/m³` })
    out.push({ id: 'vent', label: 'Ventilation', value: s.vent === 'boosted' ? 'Boosted' : 'Normal' })
  }
  if (services.has('occupancy') && room.capacity) out.push({ id: 'people', label: 'People', value: `${s.people} of ${room.capacity}` })
  if (services.has('lighting')) {
    const label = room.outdoor ? 'Lamps' : 'Lights'
    out.push({ id: 'lights', label, value: !s.lights ? 'Off' : s.indoor && s.dim < 100 ? `On, dimmed to ${s.dim} %` : 'On' })
  }
  if (services.has('energy-meter')) out.push({ id: 'power', label: 'Power draw', value: `${fmt(s.power, 1)} kW` })
  if (services.has('solar')) out.push({ id: 'solar', label: 'Solar output', value: `${fmt(s.solar, 1)} kW` })
  if (services.has('gate-parking')) {
    if (room.usage === 'carpark') out.push({ id: 'free', label: 'Free spaces', value: `${room.capacity - s.people} of ${room.capacity}`, warn: s.people >= room.capacity })
    if (room.usage === 'gate') out.push({ id: 'vehicles', label: 'Vehicles this hour', value: fmt(occupancy('gate', t) * 60) })
  }
  if (services.has('cctv')) out.push({ id: 'camera', label: 'Camera', value: lampsOn(t) ? 'Online, night mode' : 'Online' })
  if (room.cameraWall && ctx.cameraCount) {
    out.push({ id: 'wall', label: 'Camera wall', value: `${ctx.cameraCount} feeds online` })
  }
  return out
}

// 0..1 for the active layer's tint, or null when the layer does not cover the room (it is dimmed).
export function layerValue(layer, room, t, state = roomState(room, t)) {
  const kinds = room.kinds ?? []
  const has = (service) => kinds.some((k) => KINDS[k].service === service)
  switch (layer) {
    case 'climate':
      return has('temp-humidity') ? clamp01((state.temp - 21) / 10) : null
    case 'air':
      return has('air-quality') ? clamp01((state.co2 - 400) / 800) : null
    case 'occupancy':
      return room.capacity ? state.occ : null
    case 'energy':
      return has('energy-meter') || has('solar') || has('lighting') ? clamp01(state.power / 12) : null
    case 'security':
      return has('cctv') || room.cameraWall || has('gate-parking') ? 1 : null
    case 'analytics': {
      if (!has('engagement')) return null
      const e = engagement(room, t)
      return e ? e.focused : 0
    }
    default:
      return null
  }
}
