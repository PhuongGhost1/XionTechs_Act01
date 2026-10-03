// Build stamp (doc 4.7, 9). vite.config.js defines __BUILD_SHA__ and __BUILD_DATE__ at build
// time; this is the only file that reads them, so tests and tools without the define still work.
// Values are real or "N/A": nothing here is ever invented.

export const BUILD_SHA = typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : 'N/A'
export const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'N/A'

/** "a1b2c3d · 2026-10-03", or "N/A" when the build has no stamp. */
export const buildStamp = () => (BUILD_SHA === 'N/A' ? 'N/A' : `${BUILD_SHA} · ${BUILD_DATE}`)
