import { frame } from '../content/index.js'
import { ATTR, setView } from '../contract/attributes.js'
import { useHtmlAttribute } from '../runtime/hooks.js'
import { cx } from '../ui/cx.js'
import './frame.css'

// READ | RAW (doc 10.3): a two-button segmented control, both native buttons with aria-pressed.
// The pressed one is brighter AND underlined (a second cue), and each target is 44 px. The choice
// goes to data-view through contract/attributes.js and is remembered (try/catch inside). RAW is
// the same page as a mono spec sheet with no canvas: the title says so in plain words.
export default function ViewToggle({ className }) {
  const view = useHtmlAttribute(ATTR.view) === 'raw' ? 'raw' : 'read'
  const options = [
    { id: 'read', word: frame.view.read.text },
    { id: 'raw', word: frame.view.raw.text },
  ]
  return (
    <div
      role="group"
      aria-label={frame.view.label.text}
      title={frame.view.title.text}
      className={cx('inline-flex border border-hair font-mono text-label uppercase', className)}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={view === o.id}
          onClick={() => setView(o.id, { persist: true })}
          className={cx(
            'seg inline-flex h-[44px] min-w-[44px] items-center justify-center px-2 transition-colors duration-ui ease-ui motion-off:transition-none sm:px-3',
            view === o.id ? 'bg-panel text-ink' : 'text-ink3 hover:text-ink',
          )}
        >
          {o.word}
        </button>
      ))}
    </div>
  )
}
