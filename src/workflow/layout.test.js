import { describe, it, expect } from 'vitest'
import { VIEW, NODE_SIZE, nodeBox, edgePath, pct, DECISION_SIZE, decisionBox } from './layout'

describe('layout', () => {
  it('defines a size for every node type', () => {
    expect(Object.keys(NODE_SIZE).sort()).toEqual(['agent', 'human', 'outcome', 'router', 'trigger'])
    expect(VIEW).toEqual({ w: 760, h: 520 })
  })

  it('centres the box on the node coordinates', () => {
    expect(nodeBox({ type: 'router', x: 380, y: 200 })).toEqual({ x: 320, y: 184, w: 120, h: 32 })
  })

  it('draws an elbow from the bottom of one node to the top of the next', () => {
    const from = { type: 'trigger', x: 380, y: 40 } // bottom edge at 62
    const to = { type: 'agent', x: 200, y: 120 } // top edge at 93
    expect(edgePath(from, to)).toBe('M 380 62 V 77.5 H 200 V 93')
  })

  it('formats percentages of the view', () => {
    expect(pct(380, 760)).toBe('50%')
  })

  it('routes an edge down a side channel when given a via x', () => {
    const from = { type: 'agent', x: 560, y: 270 } // bottom 297
    const to = { type: 'human', x: 560, y: 420 } // top 393
    expect(edgePath(from, to, 700)).toBe('M 560 297 V 309 H 700 V 381 H 560 V 393')
  })

  it('sizes the decision button box around its centre', () => {
    expect(DECISION_SIZE).toEqual([160, 30])
    expect(decisionBox({ buttons: { x: 380, y: 345 } })).toEqual({ x: 300, y: 330, w: 160, h: 30 })
  })
})
