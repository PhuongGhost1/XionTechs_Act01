import { describe, it, expect } from 'vitest'
import { getAnswer } from './answerEngine'
import { chips } from './intents'
import { contact } from '../content/site'

describe('getAnswer', () => {
  it('exposes six suggestion chips', () => {
    expect(chips.map((c) => c.id)).toEqual(['agent', 'platform', 'start', 'offices', 'demo', 'human'])
  })

  it('answers each chip by id', async () => {
    for (const c of chips) {
      const a = await getAnswer(c.label, { intentId: c.id })
      expect(a.id).toBe(c.id)
      expect(a.text.length).toBeGreaterThan(20)
    }
  })

  it('matches typed questions by keyword', async () => {
    expect((await getAnswer('where are you located?')).id).toBe('offices')
    expect((await getAnswer('how do we get started')).id).toBe('start')
    expect((await getAnswer('can I see a demo')).id).toBe('demo')
    expect((await getAnswer('what about iot devices')).id).toBe('platform')
  })

  it('does not match "ai" inside "email"', async () => {
    expect((await getAnswer('what is your email')).id).toBe('human')
  })

  it('returns the fallback with contact actions for unknown input', async () => {
    const a = await getAnswer('do you sell coffee beans')
    expect(a.id).toBe('fallback')
    expect(a.actions.some((x) => x.type === 'copy' && x.value === contact.email)).toBe(true)
  })

  it('treats blank input as unknown', async () => {
    expect((await getAnswer('   ')).id).toBe('fallback')
  })

  it('builds the offices answer from live site data', async () => {
    const a = await getAnswer('offices')
    expect(a.text).toContain('Dallas')
    expect(a.text).toContain(contact.addresses[0])
  })

  it('demo and human answers point at the right sections', async () => {
    const demo = await getAnswer('', { intentId: 'demo' })
    expect(demo.actions).toContainEqual({ type: 'scroll', label: 'Watch the agent demo', target: 'demo' })
    const human = await getAnswer('', { intentId: 'human' })
    expect(human.actions.some((x) => x.type === 'link' && x.href.startsWith('tel:'))).toBe(true)
  })
})
