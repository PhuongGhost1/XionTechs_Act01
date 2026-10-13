// Small pure formatters for the page frame (BuildHud, FinalCta, Footer).

const pad = (n) => String(n).padStart(2, '0')

// "SYS 14:07:32": the local time, 24 hour, for the scan line's timestamp.
export const formatSysTime = (date) => `SYS ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

// "+1 469 322 9899" -> "tel:+14693229899"
export const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`

// "Done." -> ["Done", "."]: lets the finale colour the closing full stop on its own.
export function splitStop(word) {
  const [, text, stop] = /^(.*?)([.!?…]*)$/.exec(word)
  return [text, stop]
}
