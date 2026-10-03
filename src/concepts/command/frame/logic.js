// Pure rules of the frame, kept out of the components so they can be tested in Node and so the
// component files only export components.

/** Station index at which the header CTA turns from outlined to filled: 04 / WORK (doc 4.9). */
export const CTA_FILLS_AT = 4

/** 'outline' until the WORK station, then 'primary' (filled yellow). */
export const ctaVariant = (stationIndex) => (stationIndex >= CTA_FILLS_AT ? 'primary' : 'outline')

/**
 * Is a nav word lit (underlined) for this data-active value? SERVICES is #deploy and WORK is
 * #work; CONTACT belongs to the DONE station, whose composer carries the hash #contact.
 * `item` is a content.frame.nav entry ({ section }).
 */
export const navLit = (item, activeId) =>
  item.section === activeId || (item.section === 'contact' && activeId === 'done')

/**
 * Everything on the page outside the header: what the open full-screen menu hides from the
 * keyboard and from assistive tech (the inert attribute). The footer sits outside <main> (it is
 * the contentinfo landmark), so it is listed on its own. Keep this in step with App.jsx.
 */
export const MENU_BEHIND = Object.freeze(['#main', '[data-site-footer]', '[data-frame="dock"]', '[data-fixed-cta]'])

/** Stations whose arrival draws the signal line (M05, doc 7.2): 01 PREMISE, 03, 04, 06. */
export const SIGNAL_STATIONS = Object.freeze([1, 3, 4, 6])

/** Does station `index` fire a signal line, given the stations already fired this session? */
export const shouldFire = (index, seen) => SIGNAL_STATIONS.includes(index) && !seen.includes(index)

/** Labels for the BUILD counter: the digits that stay and the one that flips (M12). */
export const splitCounter = (counter) => ({ head: counter.slice(0, -1), tail: counter.slice(-1) })
