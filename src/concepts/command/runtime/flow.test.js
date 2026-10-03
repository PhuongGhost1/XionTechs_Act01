import { afterEach, describe, expect, it, vi } from 'vitest'
import { FLOW_BOOST, FLOW_IDLE, applyFlow, getFlow, startFlowWatcher } from './flow.js'

// Node has no DOM: a stand-in with just what the watcher touches.
class FakeElement {
  constructor(flow = false) {
    this.flow = flow
    this.props = new Map()
    this.style = {
      setProperty: (k, v) => this.props.set(k, v),
      removeProperty: (k) => this.props.delete(k),
    }
  }
  closest(selector) {
    return selector === '[data-flow]' && this.flow ? this : null
  }
}

function setup(packetCount = 3) {
  const handlers = {}
  const packets = Array.from({ length: packetCount }, () => new FakeElement())
  const root = new FakeElement()
  vi.stubGlobal('Element', FakeElement)
  vi.stubGlobal('document', {
    documentElement: root,
    querySelectorAll: (sel) => (sel === '.anim-packet' ? packets : []),
    addEventListener: (type, fn) => {
      handlers[type] = fn
    },
    removeEventListener: (type) => {
      delete handlers[type]
    },
  })
  const stop = startFlowWatcher()
  return { handlers, packets, root, stop, cta: new FakeElement(true), other: new FakeElement(false) }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('core flow (CTA hover speeds the packets up)', () => {
  it('starts idle', () => {
    expect([FLOW_IDLE, FLOW_BOOST]).toEqual([1, 2.5])
    expect(getFlow(0)).toBe(FLOW_IDLE)
  })

  it('sets --flow on the packets only, never on <html> (a root custom property restyles the document)', () => {
    const { handlers, packets, root, cta, stop } = setup()
    handlers.pointerover({ target: cta })
    for (const p of packets) expect(p.props.get('--flow')).toBe('2.5')
    expect(root.props.has('--flow')).toBe(false)
    handlers.pointerout({ target: cta })
    for (const p of packets) expect(p.props.has('--flow')).toBe(false) // idle: falls back to var(--flow, 1)
    expect(root.props.has('--flow')).toBe(false)
    stop()
  })

  it('reacts to focus as well as pointer, and ignores elements that are not data-flow', () => {
    const { handlers, packets, other, cta, stop } = setup()
    handlers.pointerover({ target: other })
    handlers.focusin({ target: other })
    expect(packets[0].props.has('--flow')).toBe(false)
    handlers.focusin({ target: cta })
    expect(packets[0].props.get('--flow')).toBe('2.5')
    handlers.focusout({ target: cta })
    expect(packets[0].props.has('--flow')).toBe(false)
    stop()
  })

  it('does not touch the packets again for a repeated pointerover on the same CTA', () => {
    const { handlers, packets, cta, stop } = setup(1)
    const spy = vi.spyOn(packets[0].style, 'setProperty')
    handlers.pointerover({ target: cta })
    handlers.pointerover({ target: cta })
    expect(spy).toHaveBeenCalledTimes(1)
    handlers.pointerout({ target: cta })
    stop()
  })

  it('gives a packet that mounts during a boost the boosted value, and an idle one nothing', () => {
    const { handlers, cta, stop } = setup()
    const idle = new FakeElement()
    applyFlow(idle)
    expect(idle.props.has('--flow')).toBe(false)
    handlers.pointerover({ target: cta })
    const late = new FakeElement()
    applyFlow(late)
    expect(late.props.get('--flow')).toBe('2.5')
    expect(() => applyFlow(null)).not.toThrow() // a ref callback is called with null on unmount
    handlers.pointerout({ target: cta })
    stop()
  })

  it('ramps the scene value over 160 ms', () => {
    const { handlers, cta, stop } = setup()
    handlers.pointerover({ target: cta })
    const t0 = performance.now()
    expect(getFlow(t0)).toBeCloseTo(1, 1)
    expect(getFlow(t0 + 80)).toBeGreaterThan(1.5)
    expect(getFlow(t0 + 80)).toBeLessThan(2.5)
    expect(getFlow(t0 + 400)).toBe(2.5)
    handlers.pointerout({ target: cta })
    expect(getFlow(performance.now() + 400)).toBe(1)
    stop()
  })
})
