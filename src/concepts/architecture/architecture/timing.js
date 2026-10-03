// The plotting order of sheet 02, in milliseconds after the drawing enters the viewport: slabs first, then the
// names, then columns, and the braces last. `at` writes the delay a `.bp-draw`, `.bp-fade` or `.bp-rise` reads.
export const at = (ms) => ({ '--d': `${ms}ms` })

export const timing = {
  slab: (row) => 150 + row * 130,
  text: (row) => 300 + row * 130,
  column: (row, i) => 750 + row * 110 + i * 40,
  brace: (row, i) => 1350 + row * 110 + i * 60,
}
