// Shared class strings and ids for the flight plan controls.
const btn =
  'inline-flex min-h-[44px] items-center justify-center gap-2 px-5 font-cmd-mono text-[12px] font-medium uppercase tracking-[0.14em] transition-[color,background-color,border-color,opacity] duration-micro ease-cmd disabled:cursor-not-allowed disabled:opacity-40'
export const buttonPrimary = `${btn} bg-cmd-signal text-cmd-signal-ink enabled:hover:bg-white enabled:focus-visible:bg-white`
export const buttonGhost = `${btn} border border-cmd-faint text-cmd-text enabled:hover:border-cmd-signal enabled:hover:text-cmd-signal-fg`

export const tabId = (id) => `fp-tab-${id}`
export const PANEL_ID = 'fp-panel'

