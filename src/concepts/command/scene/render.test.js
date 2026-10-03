import { describe, expect, it } from 'vitest'
import { parseChannels } from './render.js'

describe('parseChannels', () => {
  it('reads the space separated CSS token format', () => {
    expect(parseChannels(' 255 0 51 ')).toEqual([1, 0, 0.2])
  })
  it('rejects anything else', () => {
    expect(parseChannels('')).toBeNull()
    expect(parseChannels('#fff')).toBeNull()
    expect(parseChannels('1 2')).toBeNull()
  })
})
