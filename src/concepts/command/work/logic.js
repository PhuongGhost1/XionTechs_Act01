// Pure helpers for the Work section (tested in logic.test.js).

// Roving-tabindex keyboard model for a horizontal tablist. Returns the next index, or null when the key
// is not a tab-navigation key.
export function nextTabIndex(key, index, count) {
  if (count < 1) return null
  switch (key) {
    case 'ArrowRight':
      return (index + 1) % count
    case 'ArrowLeft':
      return (index - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

// Percent box (x, y, w, h measured on the screenshot) to inline style for an absolutely positioned overlay.
export function boxStyle(box) {
  return { left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }
}

// Status of one assembly step in the visible list. `step` is 0 (idle) .. total (finished); step i (0-based)
// is current while `step === i + 1`. Once the sequence is finished every step reads as done.
export function stepStatus(index, step, total) {
  if (step >= total) return 'done'
  if (step === index + 1) return 'current'
  return step > index + 1 ? 'done' : 'todo'
}

// Seconds-free timeline: how long each of steps 1..4 lasts before the next begins (ms). Step 5 is final.
export const STEP_DURATIONS = [1300, 1500, 1500, 1400]
export const START_DELAY = 150
export const REPLAY_DELAY = 450
