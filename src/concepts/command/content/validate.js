import { SOURCES } from './wrap.js'

// Rule engine behind content.test.js and the dev-time check in index.js (doc 12.4).
// validateContent(content) returns a list of problems; empty means the content is honest.
// Pure and DOM free. It reads the content only, never the page.

/** The eight confirmed services, each exactly once (live site, captured 2026-09-22). */
export const CONFIRMED_SERVICES = Object.freeze([
  'Custom App Development',
  'Low-code Solutions',
  'AI-Powered Solutions',
  'AI-Driven Analytics',
  'Cloud Computing',
  'Product Engineering',
  'Product Co-Creation',
  'Staffing Services',
])

export const STATUS_WORDS = Object.freeze(['OFFERED', 'ACTIVE', 'PENDING'])
export const EVIDENCE = Object.freeze(['fact', 'pending', 'illustrative', 'method'])

// Keys whose string value is structure, not copy. Every other string must belong to a "carrier".
const STRUCT_KEYS = new Set([
  'id', 'src', 'source', 'kind', 'parent', 'module', 'section', 'placement', 'href', 'url',
  'evidence', 'group', 'hotspots', 'arrow', 'step', 'anchor', 'index', 'short',
])

// A carrier is an object that holds visible words: it has text (a wrapper) or label (a node, a
// hotspot, a row, a pending value). Carriers must name their source.
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
export const isCarrier = (o) => isObject(o) && (typeof o.text === 'string' || typeof o.label === 'string')

// Strings that look like digits but are allowed in digit-free groups: phone numbers, "25+",
// ISO dates, DEP ids (doc 12.4).
const DIGIT_ALLOW = [
  /\+\d[\d\s]{6,}\d/g, // phone numbers
  /\b\d+\+/g, // 25+
  /\b\d{4}-\d{2}-\d{2}\b/g, // dates
  /\bDEP-\d{3}\b/g, // deployment ids
]
const stripAllowed = (s) => DIGIT_ALLOW.reduce((acc, re) => acc.replace(re, ''), s)

// Strings that must not appear in production copy (doc 12.3). `99` means the stat shapes
// 99.8% and 99%, not the digits inside a phone number.
const FORBIDDEN = [
  [/\bONLINE\b/i, 'ONLINE'],
  [/\bAVAILABLE\b/i, 'AVAILABLE'],
  [/\bSUCCESS\b/i, 'SUCCESS'],
  [/\bUPTIME\b/i, 'UPTIME'],
  [/\b99(\.\d+)?\s*%/, '99%'],
  [/\b98\s*%/, '98%'],
  [/#4821/, '#4821'],
  [/projects delivered/i, 'projects delivered'],
  [/lorem/i, 'Lorem'],
  [/testimonial/i, 'testimonial'],
  [/\.NET/, '.NET'],
  [/\bReact\b/, 'React'],
  [/enterprise/i, 'enterprise'],
]

/**
 * Calls fn(value, path, owner, ownerKey) for every object and string in the tree. For an array
 * element, owner and ownerKey are those of the array itself (the object that holds it).
 */
export function walk(value, fn, path = '', owner = null, ownerKey = null) {
  fn(value, path, owner, ownerKey)
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, fn, `${path}[${i}]`, owner, ownerKey))
  } else if (isObject(value)) {
    for (const [k, v] of Object.entries(value)) walk(v, fn, path ? `${path}.${k}` : k, value, k)
  }
}

/** Every visible string of a carrier (text, label, and any extra string it owns). */
function ownStrings(o) {
  return Object.entries(o).filter(([k, v]) => typeof v === 'string' && !STRUCT_KEYS.has(k))
}

export function validateContent(content) {
  const problems = []
  const add = (path, msg) => problems.push(`${path || '(root)'}: ${msg}`)

  // 1. Sources, draft flags, naked strings.
  walk(content, (v, path, owner, ownerKey) => {
    if (isObject(v)) {
      const carrier = isCarrier(v)
      if (carrier || v.pending === true) {
        if (!SOURCES.includes(v.src)) add(path, `missing or unknown src (${String(v.src)})`)
        if (v.src === 'DRAFT' && v.draft !== true) add(path, 'src DRAFT must carry draft: true')
        if (v.draft === true && v.src !== 'DRAFT') add(path, 'draft: true only goes with src DRAFT')
      }
      if (v.pending === true) {
        if (typeof v.label !== 'string' || !v.label) add(path, 'pending value needs a label')
        if (v.src !== 'PLACEHOLDER') add(path, 'pending value must be src PLACEHOLDER')
      }
      if ('evidence' in v) {
        if (!EVIDENCE.includes(v.evidence)) add(path, `unknown evidence "${v.evidence}"`)
        if (v.evidence === 'fact' && (v.src === 'DRAFT' || v.src === 'PLACEHOLDER')) {
          add(path, `evidence "fact" can never come from ${v.src}`)
        }
      }
      for (const field of ['state', 'status']) {
        if (field in v) {
          const word = isObject(v[field]) ? v[field].text : v[field]
          if (!STATUS_WORDS.includes(word)) add(`${path}.${field}`, `status value "${word}" is not OFFERED, ACTIVE or PENDING`)
        }
      }
    } else if (typeof v === 'string') {
      // A string is fine if it is structure, or if the object that owns it is a carrier.
      if (!(STRUCT_KEYS.has(ownerKey) || isCarrier(owner))) add(path, `string "${v}" has no source (put it in a wrapper)`)
    }
  })

  // 2. Forbidden strings and em dashes, over every visible string.
  walk(content, (v, path) => {
    if (!isCarrier(v)) return
    for (const [k, s] of ownStrings(v)) {
      for (const [re, name] of FORBIDDEN) if (re.test(s)) add(`${path}.${k}`, `forbidden string ${name}`)
      if (s.includes('—') && v.src !== 'BRIEF') add(`${path}.${k}`, 'em dash in new copy')
    }
  })

  // 3. No digits in the process group or in illustrative text, except the allow-list.
  walk(content, (v, path) => {
    if (!isCarrier(v)) return
    const inProcess = path === 'process' || path.startsWith('process.')
    if (!inProcess && v.src !== 'ILLUSTRATIVE') return
    for (const [k, s] of ownStrings(v)) {
      if (/\d/.test(stripAllowed(s))) add(`${path}.${k}`, `digits in ${inProcess ? 'process' : 'illustrative'} text: "${s}"`)
    }
  })

  // 4. Services: the eight, each exactly once, under the right parents.
  const labels = []
  const nodeIds = new Map()
  walk(content, (v) => {
    if (!isObject(v) || typeof v.kind !== 'string' || typeof v.id !== 'string') return
    nodeIds.set(v.id, (nodeIds.get(v.id) ?? 0) + 1)
    if (v.kind === 'service') labels.push(v.label)
  })
  for (const name of CONFIRMED_SERVICES) {
    const n = labels.filter((l) => l === name).length
    if (n !== 1) add('modules', `service "${name}" appears ${n} times, expected exactly once`)
  }
  for (const l of labels) if (!CONFIRMED_SERVICES.includes(l)) add('modules', `unconfirmed service "${l}"`)
  for (const [id, n] of nodeIds) if (n > 1) add(id, `node id used ${n} times`)

  const mods = content.modules ?? []
  if (mods.length !== 4) add('modules', `expected 4 modules, found ${mods.length}`)
  for (const m of mods) {
    for (const s of m.services ?? []) {
      if (s.parent !== m.id) add(s.id, `parent ${s.parent} is not its module ${m.id}`)
      for (const l of s.leaves ?? []) if (l.parent !== s.id) add(l.id, `parent ${l.parent} is not its service ${s.id}`)
    }
  }

  // 5. Pending values are structured, never strings (the chip rule is tested in SpecRow.test.js).
  for (const r of content.records ?? []) {
    for (const rowItem of r.rows ?? []) {
      if (rowItem.label === 'DETAILS' && !(isObject(rowItem.value) && rowItem.value.pending === true)) {
        add(rowItem.id, 'the DETAILS row must hold a { pending: true, label } value')
      }
    }
  }

  // 6. Process: six steps in order; ledger: six rows, REAL first, draft row dev only.
  const steps = (content.process?.steps ?? []).map((s) => s.label)
  const expectSteps = ['REQUEST', 'DISCOVERY', 'ARCHITECTURE', 'BUILD', 'DEPLOY', 'SCALE']
  if (steps.join() !== expectSteps.join()) add('process.steps', `expected ${expectSteps.join(' ')}, found ${steps.join(' ')}`)
  const kinds = (content.ledger?.rows ?? []).map((r) => r.kind)
  const expectKinds = ['live', 'real', 'sample', 'illustrative', 'draft', 'pending']
  if (kinds.join() !== expectKinds.join()) add('ledger.rows', `expected ${expectKinds.join(' ')}, found ${kinds.join(' ')}`)
  const draftRow = (content.ledger?.rows ?? []).find((r) => r.kind === 'draft')
  if (draftRow && draftRow.devOnly !== true) add('ledger.rows', 'the DRAFT row must be devOnly')

  // 7. The headline and its three-line break agree.
  const h1 = content.hero?.h1
  if (h1 && `${h1.lines?.join(' ')}.` !== h1.text) add('hero.h1', 'lines do not add up to the text')

  return problems
}

