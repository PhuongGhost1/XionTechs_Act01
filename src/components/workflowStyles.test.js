import { describe, it, expect } from 'vitest'
import { nodeClasses, typeIcon } from './workflowStyles'

const COLOURS = 'paper|surface|ink|muted|line|primary|primaryHover|primarySoft|primaryInk|accent|navy|navyInk|navyAccent'
const count = (classes, prefix) =>
  classes.split(/\s+/).filter((c) => new RegExp(`^${prefix}-(${COLOURS})(/[0-9]+)?$`).test(c)).length

describe('nodeClasses', () => {
  for (const type of Object.keys(typeIcon)) {
    for (const status of ['working', 'active', 'idle', 'off']) {
      for (const selected of [false, true]) {
        it(`${type}/${status}/selected=${selected} has one bg, text and border colour`, () => {
          const c = nodeClasses({ type }, status, selected)
          expect(count(c, 'bg')).toBe(1)
          expect(count(c, 'text')).toBe(1)
          expect(count(c, 'border')).toBe(1)
        })
      }
    }
  }
})
