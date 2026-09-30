export default function IconBadge({ icon, size = 'md', className = '' }) {
  const Icon = icon
  const sizes = {
    sm: 'h-9 w-9',
    md: 'h-12 w-12',
    lg: 'h-14 w-14',
  }
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-accentSoft text-accent transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-paper ${sizes[size]} ${className}`}
    >
      <Icon className={iconSizes[size]} strokeWidth={1.75} />
    </span>
  )
}
