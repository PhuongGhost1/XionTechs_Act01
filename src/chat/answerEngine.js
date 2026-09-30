// The single seam between the chat UI and wherever answers come from. Today: keyword rules
// over site.js content. Later: replace the body of getAnswer with a call to a serverless AI
// backend — the UI (ChatGuide.jsx) only ever calls this function.
import { intents, fallback } from './intents'

const MAX_LEN = 500

function matches(keyword, text) {
  // Word boundaries at both start and end to prevent false positives (e.g. "ai" inside "email" or "air").
  // Allows simple inflections: plural (s), plural of sibilants (es), past tense (ed), gerund (ing).
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escaped}(s|es|ed|ing)?($|[^a-z0-9])`, 'i').test(text)
}

export async function getAnswer(question, ctx = {}) {
  if (ctx.intentId) {
    const direct = intents.find((i) => i.id === ctx.intentId)
    if (direct) return { id: direct.id, ...direct.answer() }
  }
  const text = String(question ?? '').trim().slice(0, MAX_LEN).toLowerCase()
  if (!text) return fallback()
  for (const intent of intents) {
    if (intent.keywords.some((k) => matches(k, text))) {
      return { id: intent.id, ...intent.answer() }
    }
  }
  return fallback()
}
