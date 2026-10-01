// Approve / Reject pair shown while a run waits for the visitor's decision.
export default function DecisionButtons({ verb, onDecide, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onDecide('approve')}
        aria-label={`Approve the ${verb}`}
        className={`flex-1 rounded-full bg-primary font-medium text-primaryInk transition hover:bg-primaryHover ${pad}`}
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => onDecide('reject')}
        aria-label={`Reject the ${verb}`}
        className={`flex-1 rounded-full border border-line bg-paper font-medium text-ink transition hover:border-primary ${pad}`}
      >
        Reject
      </button>
    </div>
  )
}
