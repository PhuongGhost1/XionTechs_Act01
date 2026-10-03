// Joins class names, skipping falsy values. Not a dependency on purpose.
export const cx = (...parts) => parts.filter(Boolean).join(' ')
