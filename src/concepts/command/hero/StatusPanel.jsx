import { useEffect, useState } from 'react'
import { modules, statusPanel } from '../content.js'
import { useReducedMotion } from '../hooks/index.js'
import { live, store } from '../state/store.js'
import { Chip, Dot, Mono } from '../ui/index.jsx'

const buildNumber = typeof __BUILD_NUMBER__ !== 'undefined' ? __BUILD_NUMBER__ : 0

// The four status rows ARE the four modules: the X's arms end at these names, and the same
// four become the bays in the next section. Hovering a row pulses its arm in the data core.
// The panel is headed Illustrative; the activation bar counts modules coming online during boot
// (functional, not a claim) and the build number is the real git commit count.
export default function StatusPanel({ className = '' }) {
  const reduced = useReducedMotion()
  const [online, setOnline] = useState(0)

  useEffect(() => {
    if (reduced) {
      setOnline(modules.length)
      return undefined
    }
    const timers = modules.map((_, i) => setTimeout(() => setOnline(i + 1), 700 + i * 380))
    return () => timers.forEach(clearTimeout)
  }, [reduced])

  const pulse = (id) => {
    live.pulseModule = id
  }

  return (
    <div className={`x-ticks border border-x-line bg-x-bg p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <Mono as="h2" className="text-x-text">
          {statusPanel.title}
        </Mono>
        <Chip tone="illustrative">{statusPanel.badge}</Chip>
      </div>
      <div aria-hidden="true" className="mt-3 h-px w-full bg-x-line" />

      <ul className="mt-1">
        {modules.map((m, i) => {
          const on = i < online
          return (
            <li key={m.id} className="border-b border-x-line/60 last:border-b-0">
              <a
                href="#deploy"
                onPointerEnter={() => pulse(m.id)}
                onPointerLeave={() => pulse(null)}
                onFocus={() => pulse(m.id)}
                onBlur={() => pulse(null)}
                onClick={() => store.set({ activeModule: m.id })}
                className="group flex min-h-10 items-center justify-between gap-4 py-2 transition-colors duration-200 ease-x hover:text-x-text"
              >
                <Mono className="text-x-mute group-hover:text-x-text">{m.statusLabel}</Mono>
                <Mono className={`flex items-center gap-2 ${on ? 'text-x-text' : 'text-x-faint'}`}>
                  <Dot tone={on ? 'on' : 'pending'} />
                  {on ? statusPanel.state : 'Starting'}
                </Mono>
              </a>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 border-t border-x-line pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <Mono className="text-x-faint">{statusPanel.activation}</Mono>
          <Mono className="tabular text-x-text">
            {online}/{modules.length}
          </Mono>
          <Mono className="ml-auto text-x-faint">{statusPanel.build}</Mono>
          <Mono className="tabular text-x-text">#{String(buildNumber).padStart(4, '0')}</Mono>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1" aria-hidden="true">
          {modules.map((m, i) => (
            <span key={m.id} className={`h-1.5 transition-colors duration-300 ease-x ${i < online ? 'bg-x-signal' : 'bg-x-line'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
