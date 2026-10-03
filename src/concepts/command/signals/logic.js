// Pure helpers for the Signals section (tested in logic.test.js).

// Products documented = records that are not illustrative; the illustrative ones are counted apart.
export function documentedCounts(records) {
  const illustrative = records.filter((r) => r.status.tone === 'illustrative').length
  return { documented: records.length - illustrative, illustrative }
}

export const easeOutCubic = (t) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3

// Value shown `t` (0..1) of the way through a count-up. Integer, never above the target.
export const countUpValue = (target, t) => Math.round(target * easeOutCubic(t))

export const formatBuild = (n) => String(Math.max(0, Math.round(n))).padStart(3, '0')
