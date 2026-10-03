import { frame } from '../content/index.js'

// First stop of the tab order, visible only while focused (doc 10.2). It targets <main id="main">,
// which App.jsx makes focusable (tabIndex -1), so activating it moves focus as well as the view.
// Yellow with navy text like every primary control; the focus ring turns white on yellow (base.css).
export default function SkipLink() {
  return (
    <a
      href="#main"
      data-fill="signal"
      className="sr-only z-50 bg-signal px-4 font-mono text-label font-medium uppercase text-onSignal focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:inline-flex focus:h-11 focus:items-center"
    >
      {frame.skip.text}
    </a>
  )
}
