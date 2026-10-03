import { LAYER_COUNT, PORT_X, SLAB, layerY } from '../model/layers.js'
import { cameraAngles, heroGap, heroParams, viewLabel } from '../model/timeline.js'
import { axisTriad, cameraPose } from './camera.js'
import { REST_TIME, signalAt, signalY } from './signal.js'

// Everything the three renderers (SVG drawing, DOM overlay, WebGL scene) need for one frame, as a pure
// function of scroll progress, box size and time. Nothing here touches the DOM.
//
//   mode 'stage'  the desktop sticky stage: the full timeline, plan view to axonometric, then the dolly
//   mode 'pass'   a phone or tablet: the camera stays axonometric, the layers open as the figure scrolls by
//   mode 'final'  reduced motion: the finished exploded model, nothing animates

export const FINAL_PARAMS = { connect: 1, lift: 1, depth: 1, tilt: 1, labels: 1, dolly: 0 }

export function paramsFor(mode, p) {
  if (mode === 'final') return { ...FINAL_PARAMS }
  const h = heroParams(p)
  if (mode === 'pass') return { ...h, depth: 1, tilt: 1, dolly: 0 }
  return h
}

export const LABEL_WIDTH = 132
export const LABEL_STEP = 30

/**
 * Where the five label rows go. Labels sit in one column to the right of the model, each at the height of its
 * layer's anchor; if two anchors are closer than LABEL_STEP the lower row is pushed down.
 */
export function layoutLabels(anchors, W) {
  const widest = Math.max(...anchors.map((a) => a[0]))
  const x = Math.min(widest + 30, W - LABEL_WIDTH - 10)
  const ys = anchors.map((a) => a[1])
  for (let i = 1; i < ys.length; i += 1) ys[i] = Math.max(ys[i], ys[i - 1] + LABEL_STEP)
  return { x, ys }
}

export function computeFrame({ mode = 'stage', p = 0, W, H, time = 0, still = false }) {
  const params = paramsFor(mode, p)
  const gap = heroGap(params.lift)
  const { elevation, azimuth } = cameraAngles(params.tilt)
  const cam = cameraPose({ elevation, azimuth, gap, dolly: params.dolly, room: params.tilt, W, H })
  const ys = Array.from({ length: LAYER_COUNT }, (_, i) => layerY(i, gap))
  const hw = SLAB.w / 2
  const hd = SLAB.d / 2

  const right = ys.map((y) => cam.project(hw, y, -hd))
  const left = ys.map((y) => cam.project(-hw, y, hd))
  const bottom = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, z]) => cam.project(x, ys[LAYER_COUNT - 1], z))
  // The end corners of the bottom slab; in plan view two corners share an x, so the lower one wins the tie.
  const bottomLeft = bottom.reduce((m, q) => (q[0] < m[0] - 0.5 || (Math.abs(q[0] - m[0]) <= 0.5 && q[1] > m[1]) ? q : m))
  const bottomRight = bottom.reduce((m, q) => (q[0] > m[0] + 0.5 || (Math.abs(q[0] - m[0]) <= 0.5 && q[1] > m[1]) ? q : m))
  const labels = layoutLabels(right, W)

  const s = signalAt(still ? REST_TIME : time)
  const sy = signalY(s.L, gap)
  const signal = {
    portIndex: s.portIndex,
    x: PORT_X[s.portIndex],
    y: sy,
    L: s.L,
    alpha: s.alpha * params.connect,
  }

  return {
    mode,
    p,
    W,
    H,
    time,
    params,
    gap,
    ys,
    cam,
    view: { label: viewLabel(params.tilt), elevation, azimuth },
    anchors: right,
    labelX: labels.x,
    labelYs: labels.ys,
    dims: {
      // horizontal: the bottom slab's full width, just under its lowest corner (y0, y1: its end corners' heights)
      x0: bottomLeft[0],
      y0: bottomLeft[1],
      x1: bottomRight[0],
      y1: bottomRight[1],
      y: Math.max(...bottom.map((q) => q[1])),
      // vertical: the left corners of the top and the bottom slab
      left: Math.min(...left.map((q) => q[0])),
      top: left[0][1],
      bottomY: left[LAYER_COUNT - 1][1],
    },
    triad: axisTriad(cam),
    signal,
  }
}
