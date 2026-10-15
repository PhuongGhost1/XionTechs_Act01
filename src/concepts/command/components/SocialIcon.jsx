// lucide-react doesn't ship brand glyphs in this version, so these are small hand-rolled
// outline marks kept visually consistent with the lucide icon set used elsewhere (same
// stroke width, 24x24 viewbox).
const paths = {
  Facebook: (
    <path d="M15 3h-2a5 5 0 0 0-5 5v2H6v4h2v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
  ),
  LinkedIn: (
    <>
      <rect x="3" y="9" width="4" height="12" rx="0.5" />
      <circle cx="5" cy="4.5" r="2.2" />
      <path d="M11 9h4v2.2c.8-1.5 2.2-2.4 4-2.4 3 0 5 2 5 5.5V21h-4v-6c0-1.6-.7-2.6-2.2-2.6-1.4 0-2.3 1-2.7 2v6.6h-4z" />
    </>
  ),
}

export default function SocialIcon({ name, className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  )
}
