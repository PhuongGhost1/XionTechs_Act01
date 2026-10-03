import { useEffect, useRef, useState } from 'react'
import { deploy } from '../../content/index.js'
import { Chip } from '../../ui/Chip.jsx'

// The services of one module as real checkboxes (doc 4.4): ADD TO BRIEF. The eight confirmed
// services each appear exactly once across the four panels. Ticking one adds it to the brief
// store (contract/brief.js), which the header, the dock and the closing composer read.
//
// Markup: input, then label, then the extras, siblings, so CSS can style the box from the input's
// state (deploy.css) and the label stays one 44 px target. The checkbox is named by the service
// and described by its platforms and what it covers (aria-describedby), so a screen reader does
// not read the whole block as one long label.

const FLASH_MS = 400 // M16: the 2 px ring on the toggled control (160 ms in, then out)

function Tick() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false" className="svc__tick">
      <path d="M2 6.5L5 9.5L10.5 3" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  )
}

function LeafList({ label, leaves }) {
  if (!leaves.length) return null
  return (
    <span className="svc__group">
      <span className="svc__lbl">{label}</span>
      <span className="svc__items">
        {leaves.map((leaf) => (
          <span key={leaf.id} className="svc__leaf">
            <i aria-hidden="true" className="svc__dot" />
            {leaf.label}
          </span>
        ))}
      </span>
    </span>
  )
}

function Service({ service, checked, onToggle, flash }) {
  const platforms = service.leaves.filter((l) => l.group === 'platform')
  const covers = service.leaves.filter((l) => l.group !== 'platform')
  const subId = `${service.id}-sub`
  const inputId = `${service.id}-box`
  return (
    <li className="svc">
      <input
        id={inputId}
        type="checkbox"
        className="svc__input sr-only"
        checked={checked}
        onChange={() => onToggle(service.id)}
        aria-describedby={service.leaves.length ? subId : undefined}
      />
      <label htmlFor={inputId} className="svc__label" data-flash={flash ? '' : undefined}>
        <span className="svc__box" aria-hidden="true">
          <Tick />
        </span>
        <span className="svc__name">{service.label}</span>
      </label>
      <Chip kind="live" className="svc__chip" />
      {service.leaves.length > 0 && (
        <span id={subId} className="svc__sub">
          <LeafList label={deploy.platformsLabel.text} leaves={platforms} />
          <LeafList label={deploy.coversLabel.text} leaves={covers} />
        </span>
      )}
    </li>
  )
}

/**
 * @param {{ module: object, collapsed?: boolean, onFocus?: () => void, brief: { has: (id: string) => boolean, toggleService: (id: string) => boolean } }} props
 * `collapsed` (data-collapsed) draws the panel as nothing (the other three modules in the sticky
 * column) but keeps it in the DOM, the accessibility tree and the tab order: a screen reader still
 * reads all eight services, and `onFocus` lets the owner make a focused panel's module the active
 * one, which shows it. RAW shows every panel (deploy.css), so no service is ever missing.
 */
export function ServicesPanel({ module: mod, collapsed = false, onFocus, brief }) {
  const [flashId, setFlashId] = useState(null)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const toggle = (id) => {
    brief.toggleService(id)
    setFlashId(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setFlashId(null), FLASH_MS)
  }

  return (
    <div
      id={`${mod.id}-services`}
      className="svc-panel"
      data-module={mod.id}
      data-collapsed={collapsed ? '' : undefined}
      onFocus={onFocus}
    >
      <fieldset className="svc-fieldset">
        <legend className="svc-panel__legend">
          <span className="sr-only">{mod.label}: </span>
          {deploy.add.text}
        </legend>
        <ul className="svc-list">
          {mod.services.map((s) => (
            <Service key={s.id} service={s} checked={brief.has(s.id)} onToggle={toggle} flash={flashId === s.id} />
          ))}
        </ul>
      </fieldset>
    </div>
  )
}
