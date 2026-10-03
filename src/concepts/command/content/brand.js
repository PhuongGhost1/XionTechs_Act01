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
  // The CTA label. A brief of n items renders "START A PROJECT ( n )", composed in code.
  cta: brief('frame.cta', 'START A PROJECT'),
  menu: { open: draft('frame.menu.open', 'MENU'), close: draft('frame.menu.close', 'CLOSE') },
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
  build: draft('frame.build', 'BUILD'),
  brief: draft('frame.brief', 'BRIEF'),
}
