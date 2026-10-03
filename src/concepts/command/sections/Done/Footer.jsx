import { brand, contact, frame, isReviewMode } from '../../content/index.js'
import ViewToggle from '../../frame/ViewToggle.jsx'
import { buildStamp } from '../../runtime/build.js'
import { Chip } from '../../ui/Chip.jsx'
import { KeyValue } from '../../ui/KeyValue.jsx'

// The footer (doc 4.8): the reversed logo at native size, one line of description, the build
// stamp (real or N/A), the READ | RAW toggle. No sitemap. Offices, addresses and the legal name
// are not confirmed (open questions 2, 3): they exist here only under ?review, each marked PENDING.

const logo = brand.logo.reversed

function ReviewOnly() {
  const { offices, legalName } = contact.review
  return (
    <ul className="flex flex-col gap-2 font-mono text-data text-ink2">
      {[...offices, legalName].map((item) => (
        <li key={item.id} className="flex flex-wrap items-center gap-3">
          <span>{item.text}</span>
          <Chip kind="pending" />
        </li>
      ))}
    </ul>
  )
}

export function Footer() {
  return (
    // The page's contentinfo landmark: it follows <main>. The bottom padding is the fixed dock's
    // height, the only thing that covers the end of the page: the phone CTA bar hides itself while
    // [data-site-footer] is on screen (frame/MobileBar.jsx), so it needs no room of its own.
    <footer data-site-footer="" className="relative z-10 border-t border-hair bg-void pb-dock">
      <div className="column flex flex-col gap-8 py-10 md:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-12">
          <div className="flex min-w-0 flex-col gap-4">
            <img
              data-logo=""
              src={logo.url}
              width={logo.width}
              height={logo.height}
              alt={logo.alt.text}
              decoding="async"
              className="native-logo"
            />
            <p className="max-w-measure text-body text-ink2">{contact.footer.description.text}</p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <dl>
              <KeyValue label={frame.build.text} value={buildStamp()} />
            </dl>
            <ViewToggle />
          </div>
        </div>
        {isReviewMode() && <ReviewOnly />}
      </div>
    </footer>
  )
}
