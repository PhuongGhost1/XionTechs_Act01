import { describe, it, expect } from 'vitest'
import * as site from './site'

// Collect every string value in the exported content, however deeply nested.
function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out))
  return out
}

describe('site content rules', () => {
  it('contains no lorem ipsum', () => {
    const offenders = collectStrings(site).filter((s) => /lorem/i.test(s))
    expect(offenders).toEqual([])
  })
})
