// Pure logic for sheet 02, "The architecture": which structural bay each level draws, how many cells fit the
// viewport, and how the load path lights the rows. No React, no DOM, so it is tested in levels.test.js.

// The structural bay of each level (drawn to the right of its name). One letter per cell:
//   o  open bay, a column
//   t  tie bay, a column and a tie beam (Business: few members, long span)
//   x  braced bay, a column and the X (the brand X as a structural member)
//   j  joint bay, a beam with a connector plug at the column (API: the contracts between parts)
//   s  strata bay, a column and storage tiers (Data)
// The rules take the cell index and the cell count so the same level reads at 3 cells on a phone and 7 on a
// wide desktop.
export const BAY_RULES = {
  business: (i, n) => (i === n - 1 ? 'x' : 't'),
  product: (i) => (i % 2 === 1 ? 'x' : 'o'),
  application: (i) => (i % 3 === 2 ? 'o' : 'x'),
  api: () => 'j',
  data: () => 's',
  infrastructure: (i, n) => (i === 0 || i === n - 1 ? 'x' : 'o'),
}

/** The cell types for one level at `n` cells. Unknown levels draw open bays. */
export function cellTypes(levelId, n) {
  const rule = BAY_RULES[levelId] || (() => 'o')
  return Array.from({ length: n }, (_, i) => rule(i, n))
}

/** Column positions of a bay as percentages of its width: n cells have n + 1 columns, the last is the wall. */
export function columnStops(n) {
  return Array.from({ length: n + 1 }, (_, i) => (i / n) * 100)
}

/** Grid labels over the columns, as on a drawing: A, B, C... */
export const columnLabel = (i) => String.fromCharCode(65 + i)

// [min viewport width, cells]: the bay is about 100 px tall, so cells stay close to square.
export const CELL_STEPS = [
  [1280, 7],
  [1024, 6],
  [768, 5],
  [640, 4],
  [480, 3],
]

/** How many cells a bay holds at a viewport width (px). Two on a phone. */
export function cellCount(width) {
  for (const [min, n] of CELL_STEPS) if (width >= min) return n
  return 2
}

/**
 * Which rows the yellow load path covers when `active` is the index of the chosen level. The path always starts
 * at the first row (Business) and ends at the active row. Lit rows are staggered top to bottom so the line
 * visibly runs down; rows that drop out retract bottom to top.
 */
export function tracePlan(active, count, step = 70) {
  return Array.from({ length: count }, (_, i) => {
    const lit = active != null && i <= active
    return { lit, delay: lit ? i * step : (count - 1 - i) * 24 }
  })
}

/** "L06 to L04" and "Business to Application" for the caption, or null when nothing is chosen. */
export function pathSummary(levels, active, joiner = 'to') {
  if (active == null || !levels[active]) return null
  const first = levels[0]
  const last = levels[active]
  return {
    codes: `${first.code} ${joiner} ${last.code}`,
    names: `${first.label} ${joiner} ${last.label}`,
    levels: active + 1,
  }
}
