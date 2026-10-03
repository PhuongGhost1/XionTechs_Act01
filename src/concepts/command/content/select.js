import { NAME_PRODUCTS, showDraftMarks } from './flags.js'
import { ledger } from './ledger.js'
import { modules } from './modules.js'
import { processContent } from './process.js'
import { records } from './records.js'

// Read helpers over the content. Components use these instead of re-deriving shapes, so the
// flags (NAME_PRODUCTS, review mode) are honoured in one place.

/** The eight services, flat, in module order. */
export const services = () => modules.flatMap((m) => m.services)

/** The 15 leaves (platform names and capability names), flat. */
export const leaves = () => services().flatMap((s) => s.leaves)

export const moduleById = (id) => modules.find((m) => m.id === id) ?? null
export const serviceById = (id) => services().find((s) => s.id === id) ?? null
export const recordById = (id) => records.find((r) => r.id === id) ?? null

/** The module a service sits under. */
export const moduleOfService = (serviceId) => modules.find((m) => m.services.some((s) => s.id === serviceId)) ?? null

/**
 * The name to print for a record: StaffXP / ESS, or the generic name when NAME_PRODUCTS is false.
 * Pass `flag` only in tests.
 */
export function displayName(record, flag = NAME_PRODUCTS) {
  return (flag ? record.name : record.genericName).text
}

/**
 * The spec rows of a record in print order: PRODUCT, IS, then the record's own rows.
 * PRODUCT and IS are derived from name, genericName and descriptor so the product is named once.
 * DEP-003 has no spec rows.
 */
export function specRows(record, flag = NAME_PRODUCTS) {
  if (!record.descriptor) return []
  return [
    {
      id: `${record.id}.row.product`,
      label: 'PRODUCT',
      src: 'DRAFT',
      draft: true,
      value: flag ? record.name : record.genericName,
    },
    { id: `${record.id}.row.is`, label: 'IS', src: 'DRAFT', draft: true, value: record.descriptor },
    ...record.rows,
  ]
}

/**
 * The wrappers of the legend line under THE LINE, in reading order: the DRAFT part only in dev
 * or with ?review, the illustrative-beat label always (it is an honesty label).
 */
export const legendLineParts = (review = showDraftMarks()) =>
  review ? [processContent.legendSteps, processContent.legendBeat] : [processContent.legendBeat]

/** Ledger rows for this visitor: the DRAFT row only in dev or with ?review. */
export const visibleLedgerRows = (review = showDraftMarks()) => ledger.rows.filter((r) => review || !r.devOnly)
