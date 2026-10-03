import { frame } from '../content/index.js'
import { ATTR, setView } from '../contract/attributes.js'
import { useHtmlAttribute } from '../runtime/hooks.js'

// STUB (WP1 replaces this file). A working READ | RAW segmented toggle (doc 10.3): two
// aria-pressed buttons, writes data-view through contract/attributes.js and remembers the choice.
export default function ViewToggle() {
  const view = useHtmlAttribute(ATTR.view) === 'raw' ? 'raw' : 'read'
  const options = [
    { id: 'read', word: frame.view.read.text },
    { id: 'raw', word: frame.view.raw.text },
  ]
  return (
    <div role="group" aria-label={frame.view.label.text} title={frame.view.title.text} className="inline-flex font-mono text-label uppercase">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={view === o.id}
          onClick={() => setView(o.id, { persist: true })}
          className={`inline-flex h-11 min-w-11 items-center justify-center px-3 ${
            view === o.id ? 'bg-panel text-ink' : 'text-ink3 hover:text-ink'
          }`}
        >
          {o.word}
        </button>
      ))}
    </div>
  )
}
