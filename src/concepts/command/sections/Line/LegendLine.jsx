import { Fragment } from 'react'
import { legendLineParts } from '../../content/index.js'

// The legend line under THE LINE (doc 4.5): says what kind of content each part is. The beat label
// shows to every visitor; the STEPS: DRAFT part only in dev or with ?review (content/select.js).
export function LegendLine({ className = '', review }) {
  return (
    <p className={`font-mono text-label uppercase text-ink3 ${className}`.trim()}>
      {legendLineParts(review).map((part, i) => (
        <Fragment key={part.id}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          {part.text}
        </Fragment>
      ))}
    </p>
  )
}
