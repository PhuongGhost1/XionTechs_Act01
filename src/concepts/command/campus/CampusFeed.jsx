import { useEffect, useRef } from 'react'
import { campus } from '../content'
import { clock } from './simulate'

// One simulated CCTV feed. With the 3D model running, the scene renders what this camera pin sees into the
// canvas (campusScene.js registerFeed): the model's rooms, desks, plain figures and cars. Without it (the flat
// site plan) the tile shows occupancy only. Either way it is labelled a simulated feed, never real footage.
const { panel } = campus

export default function CampusFeed({ cam, room, state, night, time, feeds, compact = false, onOpen }) {
  const ref = useRef(null)
  const live = feeds.three
  useEffect(() => {
    if (!live || !ref.current) return undefined
    return feeds.register(cam.deviceId, ref.current)
  }, [live, feeds, cam.deviceId])

  const label = `${panel.cam} ${cam.no} · ${room.name}`
  const Tag = onOpen ? 'button' : 'div'
  return (
    <Tag
      {...(onOpen ? { type: 'button', onClick: onOpen } : { role: 'img' })}
      aria-label={`${label}. ${panel.feedTag}.`}
      data-night={night ? 'true' : 'false'}
      data-status={state.status}
      data-compact={compact ? 'true' : 'false'}
      className="cp-cctv block w-full text-left"
    >
      {live ? (
        <canvas ref={ref} aria-hidden="true" className="cp-cctv__img" />
      ) : (
        <span aria-hidden="true" className="cp-feed__fill" style={{ '--occ': state.occ }} />
      )}
      <span aria-hidden="true" className="cp-cctv__grain" />
      <span aria-hidden="true" className="cp-cctv__hud">
        <span className="cp-cctv__row">
          <span className="truncate">{compact ? `${panel.cam} ${cam.no}` : label}</span>
          <span className="cp-cctv__rec">{panel.rec}</span>
        </span>
        <span className="cp-cctv__row">
          <span className="truncate">{compact ? room.name : clock(time)}</span>
          {!compact && <span>{panel.feedTag}</span>}
        </span>
      </span>
    </Tag>
  )
}
