// The campus alarms of the day so far, in the shape of an IoT platform's alarms: a type, a severity, the device
// that raised it (the originator), when it started and, once its rule stopped firing, when it cleared. Pure and
// deterministic (alarms.test.js): the day is replayed from its start in five-minute steps, so scrubbing back in
// time shows exactly the alarms that time had. Acknowledging is a visitor action kept in React, not here.

import { DAY, alarmRules, deviceKinds as KINDS } from '../campusData'
import { evaluateRules, roomState, ruleApplies, severityRank } from './simulate'

export const STEP = 5

// Sample times from the start of the day up to `t`, `t` itself last.
function samples(t) {
  const out = []
  for (let s = DAY.start; s < t; s += STEP) out.push(s)
  out.push(Math.max(DAY.start, t))
  return out
}

const cache = new Map() // `${roomId}|${t}` -> fired rules; the replay asks for the same steps again and again
function firedAt(room, t) {
  const key = `${room.id}|${t}`
  let v = cache.get(key)
  if (!v) {
    v = evaluateRules(room, t, roomState(room, t))
    if (cache.size > 20000) cache.clear()
    cache.set(key, v)
  }
  return v
}

export function originatorOf(room, rule) {
  const d = room.devices.find((x) => x.kind === rule.device)
  return d?.name ?? `${room.code}-${KINDS[rule.device].code}`
}

export function alarmsAt(model, t) {
  const out = []
  const times = samples(t)
  for (const room of model.rooms) {
    const rules = alarmRules.filter((r) => ruleApplies(r, room))
    if (!rules.length) continue
    const open = new Map()
    for (const s of times) {
      const fired = new Map(firedAt(room, s).map((f) => [f.rule.id, f]))
      for (const rule of rules) {
        const f = fired.get(rule.id)
        const a = open.get(rule.id)
        if (f && !a) {
          open.set(rule.id, { id: `${rule.id}:${room.id}:${s}`, ruleId: rule.id, type: rule.type, severity: f.severity, roomId: room.id, originator: originatorOf(room, rule), start: s, end: null, status: 'ACTIVE' })
        } else if (f && a) {
          if (severityRank(f.severity) < severityRank(a.severity)) a.severity = f.severity // escalates, never drops while open
        } else if (!f && a) {
          out.push({ ...a, end: s, status: 'CLEARED' })
          open.delete(rule.id)
        }
      }
    }
    for (const a of open.values()) out.push(a)
  }
  // Active first, most severe first, newest first; then cleared, most recently cleared first.
  return out.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'ACTIVE' ? -1 : 1
    if (a.status === 'ACTIVE') return severityRank(a.severity) - severityRank(b.severity) || b.start - a.start
    return b.end - a.end
  })
}
