import { fact } from './wrap.js'

// Hotspot boxes over the two real captures (doc 8.3, 8.4). Percent of the image: x, y, w, h,
// measured against the committed files; tolerance about 1%. WP5 verifies them with the
// ?debug=hotspots overlay; content.test.js checks the geometry.
//
// Natural sizes are constants so the QA of the images, the records and the test agree.

export const STAFFXP_IMAGE = Object.freeze({ width: 1869, height: 958 })
export const ESS_IMAGE = Object.freeze({ width: 1867, height: 956 })

const CAPTURE = 'real capture, sanitized'

const box = (id, code, label, x, y, w, h) => ({
  id,
  code, // limited tag, e.g. UI-03; the full tag adds the label and the evidence line
  label,
  x,
  y,
  w,
  h,
  src: 'FACT',
  source: CAPTURE,
})

/** Three lines of the full tag: id, label, evidence state (doc 8.5). */
export const hotspotEvidence = fact('hotspots.evidence', 'VISIBLE IN CAPTURE', CAPTURE)

/**
 * Pairs of ids where the second box lies inside the first. The overlap test allows these.
 * `mstodo` (the "Open in Microsoft To Do" link) sits inside the To do list panel.
 */
export const HOTSPOT_CONTAINMENT = Object.freeze({
  staffxp: [['todo', 'mstodo']],
  ess: [],
})

export const STAFFXP_HOTSPOTS = [
  box('nav', 'UI-01', 'Top navigation', 0.0, 0.0, 40.2, 4.9),
  box('counters', 'UI-02', 'To mark, Classes, Messages, Tasks', 53.5, 9.9, 27.1, 11.0),
  box('calendar', 'UI-03', 'Academic calendar', 0.7, 34.4, 19.1, 61.1),
  box('todo', 'UI-04', 'To do list', 21.5, 34.4, 38.2, 32.5),
  box('mstodo', 'UI-05', 'Open in Microsoft To Do link', 48.7, 62.2, 9.8, 2.6),
  box('notices', 'UI-06', 'Notices', 21.5, 69.4, 38.2, 30.6),
  box('quicklinks', 'UI-07', 'Quick links (includes Employee self-service)', 61.4, 34.4, 19.1, 22.4),
  box('marking', 'UI-08', 'Assignments to mark', 61.4, 59.3, 19.1, 34.2),
  // The panel is named in the capture. The name is not repeated in copy until the team confirms
  // it (open question 6).
  box('assistant', 'UI-09', 'AI assistant panel', 81.8, 5.7, 17.8, 93.0),
]

export const ESS_HOTSPOTS = [
  box('nav', 'UI-01', 'Top navigation', 0.0, 0.0, 100.0, 5.0),
  box('profile', 'UI-02', 'Profile summary', 2.5, 7.4, 95.2, 25.2),
  box('directory', 'UI-03', 'Company directory', 2.5, 35.1, 30.9, 10.9),
  box('menu', 'UI-04', 'Employment, Skills & performance, Attendance, Rewards & Benefits, Approval delegations, Org chart', 2.5, 47.3, 30.9, 47.0),
  box('request', 'UI-05', 'Submit request', 34.7, 35.1, 30.8, 27.3),
  box('timeoff', 'UI-06', 'Time off balances', 34.7, 63.7, 30.8, 20.7),
  box('payslips', 'UI-07', 'Payslips', 34.7, 85.7, 30.8, 8.6),
  box('tasks', 'UI-08', 'Tasks', 66.8, 35.1, 30.9, 15.5),
  box('courses', 'UI-09', 'Courses', 66.8, 51.9, 30.9, 15.6),
  box('academy', 'UI-10', 'Academy courses', 66.8, 68.7, 30.9, 25.5),
]
