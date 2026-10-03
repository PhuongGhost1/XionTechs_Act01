import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { setTier } from '../contract/attributes.js'

// DEV ONLY (imported behind import.meta.env.DEV from CoreFigure, so it is not in a production
// build). The harness browser reports a software rasteriser, so the page chooses tier "off" and
// App never mounts the canvas. With ?tier=high or ?tier=low this mounts it anyway, so the scene
// can be looked at. When the page already runs a real tier, App mounts the canvas itself and this
// does nothing.
const wanted = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('tier')

if (wanted === 'high' || wanted === 'low') {
  window.setTimeout(async () => {
    if (document.documentElement.getAttribute('data-tier') !== 'off') return
    const { default: CoreCanvas } = await import('./CoreCanvas.jsx')
    setTier(wanted)
    const host = document.createElement('div')
    document.body.appendChild(host)
    createRoot(host).render(createElement(CoreCanvas, { tier: wanted }))
  }, 900)
}
