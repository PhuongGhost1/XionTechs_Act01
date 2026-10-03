import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { process as line, stationLabels, validateContent } from '../content/index.js'
import content from '../content/index.js'
import {
  FRAME,
  HASH_IDS,
  HASH_TO_STATION,
  STATIONS,
  STATION_IDS,
  buildCounter,
  stationForHash,
  trackLvh,
} from './stations.js'

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')

describe('stations', () => {
  it('are the seven of the design document, in order', () => {
    expect(STATION_IDS).toEqual(['standby', 'premise', 'deploy', 'line', 'work', 'ledger', 'done'])
    expect(STATIONS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(STATIONS[0].label).toBe('00 / STANDBY')
    expect(STATIONS[2].label).toBe('02 / WHAT WE CAN DEPLOY')
    expect(STATIONS[6].label).toBe('06 / DONE')
  })

  it('take their visible labels from content/ (one source, every one with a src tag)', () => {
    expect(stationLabels.map((l) => l.station)).toEqual(STATION_IDS)
    expect(STATIONS.map((s) => s.label)).toEqual(stationLabels.map((l) => l.text))
    expect(stationLabels.every((l) => ['BRIEF', 'DRAFT'].includes(l.src))).toBe(true)
    // the third label is the process heading, not a second copy of it
    expect(STATIONS[3].label).toBe(`03 / ${line.heading.text}`)
    // and they take part in the honesty check like all other copy
    expect(content.stations).toBe(stationLabels)
    expect(validateContent(content)).toEqual([])
    const bad = structuredClone(content)
    delete bad.stations[2].src
    expect(validateContent(bad).join('\n')).toMatch(/stations\[2\].*src/)
  })

  it('has no visible label typed into stations.js itself', () => {
    const source = readFileSync(new URL('./stations.js', import.meta.url), 'utf8')
    expect(source).not.toMatch(/label: '/)
    expect(source).not.toContain('FROM REQUEST TO PRODUCTION')
    expect(source).not.toContain('WHAT WE CAN DEPLOY')
  })

  it('answer to the eight hashes', () => {
    expect(HASH_IDS).toEqual(['#standby', '#premise', '#deploy', '#line', '#work', '#ledger', '#done', '#contact'])
    for (const h of HASH_IDS) expect(stationForHash(h)).toBe(HASH_TO_STATION[h])
    expect(stationForHash('#contact')).toBe(6)
    expect(stationForHash('#nope')).toBe(-1)
    for (const s of STATIONS) expect(s.hash).toBe(`#${s.id}`)
  })

  it('keep the track heights of doc 5.3 (page length about 11.5 viewports)', () => {
    expect(STATIONS.map((s) => s.lvh)).toEqual([100, 110, 150, 220, 220, 90, 160])
    expect(STATIONS.reduce((sum, s) => sum + s.lvh, 0)).toBeLessThanOrEqual(1050)
    expect(trackLvh('line', true)).toBe(200)
    expect(trackLvh('line')).toBe(220)
    expect(trackLvh('nope')).toBe(0)
  })

  it('pin only THE LINE and DONE as full stages', () => {
    expect(STATIONS.filter((s) => s.pinned).map((s) => s.id)).toEqual(['line', 'done'])
  })

  it('count BUILD 000 to 006', () => {
    expect(STATIONS.map((s) => buildCounter(s.index))).toEqual(['000', '001', '002', '003', '004', '005', '006'])
  })

  it('match the --track-* tokens in tokens.css, desktop and phone', () => {
    // The phone values are the :root defaults, the desktop values sit in the 768 px block.
    const desktopBlock = css.slice(css.indexOf('@media (min-width: 768px)'))
    for (const s of STATIONS) {
      const phone = css.match(new RegExp(`--track-${s.id}: (\\d+)lvh`))
      const desktop = desktopBlock.match(new RegExp(`--track-${s.id}: (\\d+)lvh`))
      expect(Number(phone?.[1]), `${s.id} phone`).toBe(s.lvhPhone)
      expect(Number(desktop?.[1]), `${s.id} desktop`).toBe(s.lvh)
    }
  })

  it('match the frame heights in tokens.css', () => {
    expect(css).toContain(`--header-h: ${FRAME.headerPhone}px`)
    expect(css).toContain(`--header-h: ${FRAME.headerDesktop}px`)
    expect(css).toContain(`--dock-h: ${FRAME.dockDesktop}px`)
    expect(css).toContain(`calc(${FRAME.dockPhone}px + env(safe-area-inset-bottom`)
  })
})
