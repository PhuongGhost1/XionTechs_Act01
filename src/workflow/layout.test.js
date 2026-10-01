import { describe, it, expect } from 'vitest'
import { VIEW, NODE_SIZE, nodeBox, edgePath, pct } from './layout'

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
})
