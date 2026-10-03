// The SYS / year / DOY indicator of the header (doc 4.9, 2: the NASA mission clock idea). Its
// numbers are the visitor's own date, read from their device, so they are real and need no
// source claim. Pure and testable: pass a Date.

/** Day of the year in the local calendar, 1 on 1 January. 366 on 31 December of a leap year. */
export function dayOfYear(date = new Date()) {
  // Compare calendar dates as UTC midnights so a daylight saving change cannot move the answer.
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const jan1 = Date.UTC(date.getFullYear(), 0, 1)
  return Math.round((today - jan1) / 86400000) + 1
}

/** Three digits, zero padded: 003, 276. */
export const padDoy = (n) => String(n).padStart(3, '0')

/** { year: 2026, doy: '276' } for the header. */
export function sysClock(date = new Date()) {
  return { year: date.getFullYear(), doy: padDoy(dayOfYear(date)) }
}
