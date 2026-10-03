import { brief, draft, fact, live } from './wrap.js'

// Brand foundation (doc 12.2 `brand`) plus the frame's own words: navigation, toggles, skip link.
// Nothing here is old-page copy. The logo is the one file the brief names as kept.

export const brand = {
  name: live('brand.name', 'XionTechs'),
  slogan: brief('brand.slogan', 'GET IT DONE'),
  logo: {
    // Reversed (white wordmark) copy of the logo. Used at its native size only: never upscaled.
    reversed: {
      id: 'brand.logo.reversed',
      url: '/concepts/command/logo-reversed.png',
      width: 250,
      height: 46,
      alt: fact('brand.logo.alt', 'XionTechs', 'logo file'),
      src: 'FACT',
      source: 'logo file, reversed copy',
    },
  },
}

// Header, dock, skip link and the two toggles (doc 4.9, 10.2). Words only; behaviour is in frame/.
export const frame = {
  skip: draft('frame.skip', 'SKIP TO CONTENT'),
  nav: [
    brief('frame.nav.services', 'SERVICES', { href: '#deploy', section: 'deploy' }),
    brief('frame.nav.work', 'WORK', { href: '#work', section: 'work' }),
    draft('frame.nav.contact', 'CONTACT', { href: '#contact', section: 'contact' }),
  ],
  // The accessible name of the <nav> landmark (header and menu share it).
  navLabel: draft('frame.nav.label', 'Primary'),
  // The CTA label. A brief of n items renders "START A PROJECT ( n )", composed in code.
  cta: brief('frame.cta', 'START A PROJECT'),
  menu: {
    open: draft('frame.menu.open', 'MENU'),
    close: draft('frame.menu.close', 'CLOSE'),
    // Name of the full-screen list on phones and tablets.
    label: draft('frame.menu.label', 'Site menu'),
  },
  view: {
    label: draft('frame.view.label', 'VIEW'),
    read: draft('frame.view.read', 'READ'),
    raw: draft('frame.view.raw', 'RAW'),
    title: draft('frame.view.title', 'Same page, no 3D.'),
  },
  motion: {
    label: draft('frame.motion.label', 'MOTION'),
    on: draft('frame.motion.on', 'ON'),
    off: draft('frame.motion.off', 'OFF'),
  },
  sys: draft('frame.sys', 'SYS'),
  doy: draft('frame.doy', 'DOY'),
  // Hover and menu explanation of the SYS / year / day-of-year indicator: its values are the
  // visitor's own clock, nothing else (doc 9: the only runtime numbers are real ones).
  sysTitle: draft('frame.sys.title', 'Year and day of the year, read from your device clock.'),
  build: draft('frame.build', 'BUILD'),
  // Accessible name of the docked rail (counter, scrubber, readout and brief count).
  dockLabel: draft('frame.dock.label', 'Page status'),
  // Name and instructions of the page-progress slider in the dock.
  scrub: {
    label: draft('frame.scrub.label', 'Page position'),
    hint: draft('frame.scrub.hint', 'Arrow keys move between sections.'),
  },
  // The dock's honest readout (doc 4.9, 9): values are read from the page, never typed here.
  // A value that cannot be read shows N/A.
  readout: {
    label: draft('frame.readout.label', 'Render status'),
    render: draft('frame.readout.render', 'RENDER'),
    quality: draft('frame.readout.quality', 'QUALITY'),
    motion: draft('frame.readout.motion', 'MOTION'),
    svg: draft('frame.readout.svg', 'SVG'),
    webgl: draft('frame.readout.webgl', 'WEBGL'),
    high: draft('frame.readout.high', 'HIGH'),
    low: draft('frame.readout.low', 'LOW'),
    off: draft('frame.readout.off', 'OFF'),
    on: draft('frame.readout.on', 'ON'),
    na: draft('frame.readout.na', 'N/A'),
  },
  brief: draft('frame.brief', 'BRIEF'),
}
