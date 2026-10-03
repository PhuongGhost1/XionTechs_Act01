import { frame } from '../content/index.js'

// "START A PROJECT" or, when the brief has items, "START A PROJECT ( n )". The digit is keyed on
// the count so it flips in six hard steps when the brief changes (M12, M16; motion.css
// .anim-step-flip, which is off under reduced motion). The words come from content/.
export default function CtaLabel({ count = 0 }) {
  return (
    <>
      {frame.cta.text}
      {count > 0 && (
        <>
          {' ( '}
          <span key={count} className="anim-step-flip inline-block">
            {count}
          </span>
          {' )'}
        </>
      )}
    </>
  )
}
