import { useRef, useSyncExternalStore } from 'react'
import { SECTIONS, chrome, edition } from '../content.js'
import { isPaused, subscribe, togglePaused } from '../state/motion.js'

const NAV = SECTIONS.filter((s) => s.nav)

export default function Header() {
  const paused = useSyncExternalStore(subscribe, isPaused)
  const dialog = useRef(null)
  const close = () => dialog.current.close()

  return (
    <header className="sticky top-0 z-50 border-b border-pf-rule/60 bg-pf-bg">
      <a href="#main" className="pf-mono sr-only bg-pf-text px-3 py-2 text-pf-bg focus:not-sr-only focus:absolute focus:left-2 focus:top-2">
        {chrome.skip}
      </a>
      <div className="pf-wrap flex h-14 items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-3">
          <img src={edition.logo.src} alt="XionTechs" width={edition.logo.width} height={edition.logo.height} className="h-6 w-auto" />
          <span className="pf-mono text-pf-mute" aria-hidden="true">
            / 01
          </span>
        </a>
        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="pf-mono pf-link inline-flex min-h-[32px] items-center text-pf-text">
                  {s.nav}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={togglePaused} aria-pressed={paused} className="pf-mono min-h-[32px] px-2 text-pf-mute hover:text-pf-text">
            {paused ? chrome.play : chrome.pause}
          </button>
          <button
            type="button"
            onClick={() => dialog.current.showModal()}
            className="pf-mono min-h-[32px] border border-pf-text px-3 text-pf-text lg:hidden"
          >
            {chrome.contents}
          </button>
        </div>
      </div>

      {/* Contents: the mobile navigation, a numbered list. <dialog> gives the focus trap and Escape. */}
      <dialog ref={dialog} aria-label={chrome.contents} className="m-0 h-full max-h-none w-full max-w-none bg-pf-bg p-0 text-pf-text backdrop:bg-pf-text/40">
        <div className="pf-wrap flex h-14 items-center justify-between border-b border-pf-rule/60">
          <span className="pf-mono text-pf-mute">{edition.label}</span>
          <button type="button" onClick={close} className="pf-mono min-h-[32px] border border-pf-text px-3">
            {chrome.close}
          </button>
        </div>
        <ol className="pf-wrap py-6">
          {SECTIONS.map((s) => (
            <li key={s.id} className="border-b border-pf-rule/60">
              <a href={`#${s.id}`} onClick={close} className="flex items-baseline gap-4 py-3">
                <span className="pf-mono text-pf-mute">{s.no}</span>
                <span className="pf-display text-[2rem]">{s.nav ?? s.head}</span>
              </a>
            </li>
          ))}
        </ol>
      </dialog>
    </header>
  )
}
