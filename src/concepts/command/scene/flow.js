// Pure animation logic for the X core: packets that walk the graph, cross-links that fade in and out,
// and the easing helpers. Typed arrays are mutated in place so the frame loop allocates nothing.
import { splitFactor } from './graph.js'

export const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)

// Packet speed multiplier for a flow boost of 0..1 (CTA hover): 1 idle, 3.5 at full boost.
export const flowSpeed = (boost) => 1 + clamp01(boost) * 2.5

// Frame-rate independent exponential easing of `cur` toward `target`; `rate` is 1 / time constant.
export const easeToward = (cur, target, dt, rate) => cur + (target - cur) * (1 - Math.exp(-rate * dt))

// ------------------------------------------------------------------ packets
export const PACKET_SPEED_MIN = 0.28 // world units per second
export const PACKET_SPEED_MAX = 0.52

export function createPacketPool(graph, count, rand = Math.random) {
  const pool = {
    count,
    edge: new Int32Array(count),
    dir: new Uint8Array(count), // 0 travels edgeA to edgeB, 1 the other way
    u: new Float32Array(count), // 0..1 along the edge in the direction of travel
    speed: new Float32Array(count),
  }
  for (let i = 0; i < count; i++) {
    pool.edge[i] = Math.floor(rand() * graph.armEdgeCount)
    pool.dir[i] = rand() < 0.5 ? 0 : 1
    pool.u[i] = rand()
    pool.speed[i] = PACKET_SPEED_MIN + rand() * (PACKET_SPEED_MAX - PACKET_SPEED_MIN)
  }
  return pool
}

// Node a packet is heading to.
export const packetTarget = (graph, pool, i) => (pool.dir[i] === 0 ? graph.edgeB[pool.edge[i]] : graph.edgeA[pool.edge[i]])

// Advances the first `active` packets by `dt` seconds. `mult` is flowSpeed(). On reaching a node a
// packet picks a random other edge there (a dead end turns it around), so packets wander the network.
export function stepPackets(pool, graph, dt, mult, rand = Math.random, active = pool.count) {
  const n = Math.min(active, pool.count)
  for (let i = 0; i < n; i++) {
    let e = pool.edge[i]
    let u = pool.u[i] + (pool.speed[i] * mult * dt) / graph.edgeLen[e]
    let guard = 0
    while (u >= 1 && guard++ < 4) {
      const node = pool.dir[i] === 0 ? graph.edgeB[e] : graph.edgeA[e]
      const from = graph.adjStart[node]
      const to = graph.adjStart[node + 1]
      const options = to - from
      let next = e
      if (options > 1) {
        // choose among the edges at this node other than the one just travelled
        let k = from + Math.floor(rand() * (options - 1))
        if (graph.adjEdge[k] === e) k = to - 1
        next = graph.adjEdge[k]
      }
      u = (u - 1) * (graph.edgeLen[e] / graph.edgeLen[next])
      e = next
      pool.dir[i] = graph.edgeA[e] === node ? 0 : 1
    }
    pool.edge[i] = e
    pool.u[i] = u >= 1 ? 0.999 : u
  }
}

// Writes the world position of packet `i` into out[o..o+2], with the arm split applied.
export function packetPosition(out, o, graph, pool, i, split) {
  const e = pool.edge[i]
  const a = pool.dir[i] === 0 ? graph.edgeA[e] : graph.edgeB[e]
  const b = pool.dir[i] === 0 ? graph.edgeB[e] : graph.edgeA[e]
  const fa = splitFactor(graph.nodeT[a], split)
  const fb = splitFactor(graph.nodeT[b], split)
  const p = graph.positions
  const u = pool.u[i]
  const ax = p[a * 3] * fa
  const ay = p[a * 3 + 1] * fa
  const bx = p[b * 3] * fb
  const by = p[b * 3 + 1] * fb
  out[o] = ax + (bx - ax) * u
  out[o + 1] = ay + (by - ay) * u
  out[o + 2] = p[a * 3 + 2] + (p[b * 3 + 2] - p[a * 3 + 2]) * u
}

// ------------------------------------------------------------------ cross-links
export const LINK_FADE = 0.9 // seconds to fade in and again to fade out
export const LINK_LIFE_MIN = 3.2
export const LINK_LIFE_MAX = 6.4

// 0..1 envelope of a link `age` seconds into a life of `life` seconds.
export function linkAlpha(age, life, fade = LINK_FADE) {
  if (age <= 0 || age >= life) return 0
  const x = clamp01(Math.min(age / fade, (life - age) / fade))
  return x * x * (3 - 2 * x)
}

const isActive = (s, c) => {
  for (let i = 0; i < s.slots; i++) if (s.cand[i] === c) return true
  return false
}

// A candidate not currently in a slot (or -1 when every candidate is in use).
function pickCandidate(s, rand) {
  let c = Math.floor(rand() * s.candidateCount)
  for (let tries = 0; tries < s.candidateCount; tries++) {
    if (!isActive(s, c)) return c
    c = (c + 1) % s.candidateCount
  }
  return -1
}

const randomLife = (rand) => LINK_LIFE_MIN + rand() * (LINK_LIFE_MAX - LINK_LIFE_MIN)

export function createLinkScheduler(candidateCount, slots, rand = Math.random) {
  const s = {
    candidateCount,
    slots: Math.min(slots, candidateCount),
    cand: new Int32Array(slots).fill(-1),
    start: new Float32Array(slots),
    life: new Float32Array(slots),
  }
  for (let i = 0; i < s.slots; i++) {
    s.cand[i] = pickCandidate(s, rand)
    s.life[i] = randomLife(rand)
    s.start[i] = -rand() * s.life[i] * 0.7 // stagger so the slots do not all turn over together
  }
  return s
}

// Retires finished links, starts new ones and writes the 0..1 alpha of every candidate into
// `alphas` (length candidateCount). `now` is simulation time in seconds.
export function stepLinks(s, now, alphas, rand = Math.random) {
  for (let i = 0; i < s.slots; i++) {
    if (now - s.start[i] >= s.life[i]) {
      s.cand[i] = -1 // free the slot first so it can be re-picked only if nothing else is free
      s.cand[i] = pickCandidate(s, rand)
      s.start[i] = now
      s.life[i] = randomLife(rand)
    }
  }
  alphas.fill(0)
  for (let i = 0; i < s.slots; i++) {
    const c = s.cand[i]
    if (c >= 0) alphas[c] = Math.max(alphas[c], linkAlpha(now - s.start[i], s.life[i]))
  }
}
