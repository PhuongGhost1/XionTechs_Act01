import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { frame } from '../content/index.js'
import Dock from './Dock.jsx'
import Header from './Header.jsx'
import Hairlines from './Hairlines.jsx'
import MobileBar from './MobileBar.jsx'
import MotionToggle from './MotionToggle.jsx'
import Readout from './Readout.jsx'
import SignalLine from './SignalLine.jsx'
import SkipLink from './SkipLink.jsx'
import ViewToggle from './ViewToggle.jsx'
import { Footer } from '../sections/Done/Footer.jsx'
import { CTA_FILLS_AT, MENU_BEHIND, SIGNAL_STATIONS, ctaVariant, navLit, shouldFire, splitCounter } from './logic.js'

// The frame renders to a string in Node (no document), which is the state before any effect ran:
// station 00, an empty brief, no tier yet. These tests hold what the design document fixes.

const html = (el) => renderToStaticMarkup(el)

describe('frame logic', () => {
  it('fills the header CTA from the WORK station (04) on, and outlines it before', () => {
    expect(CTA_FILLS_AT).toBe(4)
    for (let i = 0; i < 4; i += 1) expect(ctaVariant(i)).toBe('outline')
    for (let i = 4; i < 7; i += 1) expect(ctaVariant(i)).toBe('primary')
  })

  it('lights SERVICES in DEPLOY, WORK in ON FILE and CONTACT in DONE, and nothing in between', () => {
    const [services, work, contact] = frame.nav
    expect(navLit(services, 'deploy')).toBe(true)
    expect(navLit(work, 'work')).toBe(true)
    expect(navLit(contact, 'done')).toBe(true)
    for (const id of ['standby', 'premise', 'line', 'ledger']) {
      for (const item of frame.nav) expect(navLit(item, id)).toBe(false)
    }
    expect(navLit(services, 'work')).toBe(false)
  })

  it('draws the signal line for stations 01, 03, 04 and 06, once each', () => {
    expect([...SIGNAL_STATIONS]).toEqual([1, 3, 4, 6])
    for (const i of SIGNAL_STATIONS) {
      expect(shouldFire(i, [])).toBe(true)
      expect(shouldFire(i, [i])).toBe(false)
    }
    for (const i of [0, 2, 5]) expect(shouldFire(i, [])).toBe(false)
  })

  it('splits the BUILD counter so only the last digit flips', () => {
    expect(splitCounter('003')).toEqual({ head: '00', tail: '3' })
  })
})

describe('Header', () => {
  const out = html(createElement(Header))

  it('is fixed, 64 px (header token), with the logo at 125 px wide from the reversed PNG', () => {
    expect(out).toContain('h-header')
    expect(out).toContain('width="125"')
    expect(out).toContain('height="23"')
    expect(out).toContain('logo-reversed.png')
    expect(out).toContain('data-logo')
  })

  it('has the three words and their hashes, in order', () => {
    const labels = [...out.matchAll(/class="nav-link__text">([^<]+)</g)].map((m) => m[1])
    expect(labels).toEqual(['SERVICES', 'WORK', 'CONTACT'])
    for (const h of ['#deploy', '#work', '#contact']) expect(out).toContain(`href="${h}"`)
  })

  it('shows SYS / year . DOY nnn with real numbers', () => {
    expect(out).toMatch(/SYS \/ 20\d\d · DOY \d{3}/)
  })

  it('has READ | RAW, MOTION and the menu button, every one a 44 px target or more', () => {
    expect(out).toContain('>READ<')
    expect(out).toContain('>RAW<')
    expect(out).toContain('aria-pressed')
    expect(out).toContain('aria-expanded="false"')
    expect(out).toContain('>MENU<')
    expect(out).toContain('START A PROJECT')
    // Every control class that sets a height sets at least 44 px. Heights are px, not rem, so the
    // fixed bar keeps its 44 px targets when the reader enlarges text (rem ones would double in a 48 px bar).
    for (const m of out.matchAll(/<(?:button|a)[^>]*class="([^"]*)"/g)) {
      const h = m[1].match(/\bh-\[(\d+)px\]/)
      // The shared Button carries a rem h-11 of its own; a px override (!h-[44px]) must win over it.
      if (!h) expect(m[1]).not.toMatch(/\bh-\d+\b/)
      if (h) expect(Number(h[1])).toBeGreaterThanOrEqual(44)
    }
  })

  it('starts with an outlined CTA (station 00) and never prints a count for an empty brief', () => {
    expect(out).toContain('border-signal')
    expect(out).not.toContain('START A PROJECT (')
  })
})

describe('Dock', () => {
  const out = html(createElement(Dock))

  it('is the docked rail with the BUILD counter, a scrubber and BRIEF ( n )', () => {
    expect(out).toContain('h-dock')
    expect(out).toContain('data-frame="dock"')
    expect(out).toContain('BUILD')
    expect(out).toContain('00<span')
    expect(out).toContain('role="slider"')
    expect(out).toMatch(/BRIEF \(/)
  })

  it('the scrubber is a slider over the seven stations with a station name as its value text', () => {
    expect(out).toContain('aria-valuemin="0"')
    expect(out).toContain('aria-valuemax="6"')
    expect(out).toContain('aria-valuenow="0"')
    expect(out).toContain('aria-valuetext="00 / STANDBY"')
  })

  it('shows N/A before the tier is known, and the honest words after', () => {
    expect(html(createElement(Readout))).toContain('N/A')
    expect(html(createElement(Readout))).toContain('RENDER')
    expect(html(createElement(Readout))).toContain('QUALITY')
    expect(html(createElement(Readout))).toContain('MOTION')
  })
})

describe('the open menu hides the whole page behind it', () => {
  it('lists main, the footer (outside main), the dock and the phone CTA bar', () => {
    expect(MENU_BEHIND).toEqual(['#main', '[data-site-footer]', '[data-frame="dock"]', '[data-fixed-cta]'])
  })

  it('every listed hook exists on the element it names', () => {
    expect(html(createElement(Footer))).toContain('data-site-footer')
    expect(html(createElement(Dock))).toContain('data-frame="dock"')
    expect(html(createElement(MobileBar))).toContain('data-fixed-cta')
  })
})

describe('MobileBar', () => {
  const out = html(createElement(MobileBar))

  it('is a 56 px bar above the dock, phones only, and starts hidden and inert', () => {
    expect(out).toContain('h-[56px]')
    expect(out).toContain('bottom-dock')
    expect(out).toContain('md:hidden')
    expect(out).toContain('data-fixed-cta')
    expect(out).toContain('data-hidden="true"')
    expect(out).toContain('inert=""')
  })
})

describe('toggles, skip link, decor', () => {
  it('READ | RAW is two pressed-state buttons in a labelled group', () => {
    const out = html(createElement(ViewToggle))
    expect(out).toContain('role="group"')
    expect(out.match(/aria-pressed/g)).toHaveLength(2)
    expect(out).toContain('Same page, no 3D.')
  })

  it('MOTION keeps a constant accessible name and says its state through aria-pressed', () => {
    const out = html(createElement(MotionToggle))
    expect(out).toContain('aria-label="MOTION"')
    expect(out).toContain('aria-pressed')
  })

  it('the skip link targets main and is hidden until focused', () => {
    const out = html(createElement(SkipLink))
    expect(out).toContain('href="#main"')
    expect(out).toContain('sr-only')
    expect(out).toContain('focus:not-sr-only')
  })

  it('the signal line and the hairlines are decoration: aria-hidden, data-decor, no events', () => {
    for (const el of [SignalLine, Hairlines]) {
      const out = html(createElement(el))
      expect(out).toContain('aria-hidden="true"')
      expect(out).toContain('data-decor')
      expect(out).toContain('pointer-events-none')
    }
  })

  it('the hairlines are the +/- 32 degree pair at 6 percent, drawn in viewport pixels', () => {
    const out = html(createElement(Hairlines))
    expect(out.match(/<line /g)).toHaveLength(2)
    expect(out).toContain('stroke-grid')
    const nums = [...out.matchAll(/x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/g)].map((m) => m.slice(1).map(Number))
    for (const [x1, y1, x2, y2] of nums) {
      const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
      expect(Math.abs(Math.abs(angle) - 32)).toBeLessThan(0.01)
    }
  })
})
