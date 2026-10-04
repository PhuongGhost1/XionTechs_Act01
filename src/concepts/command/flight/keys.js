// Keyboard index for a horizontal tab list or radio group: the arrows (either axis) wrap around, Home
// and End jump. Returns the index to select, or null when the key is not one of these.
export function stepIndex(key, current, count) {
  if (count <= 0) return null
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % count
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

// One word for the context ring, no number (the demo shows none).
export function contextWord(fill, compacting) {
  if (compacting) return 'compacting'
  if (fill < 0.3) return 'fresh'
  if (fill >= 0.8) return 'full'
  return 'filling'
}
