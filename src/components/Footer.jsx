import { company, nav, navCta } from '../content/site'

// Slim footer: contact details live in the section above, so nothing is repeated here.
export default function Footer() {
  return (
    <footer data-tone="dark" className="border-t border-line bg-paper text-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm">
          <img src={company.logo.src} width={company.logo.width} height={company.logo.height} alt={company.name} loading="lazy" className="logo-img h-8 w-auto" />
          <p className="mt-4 text-pretty text-sm text-muted">{company.positioning}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-3">
            {[...nav, navCta].map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-muted transition-colors hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line px-6 py-6 text-center text-sm text-muted">
        &copy; {new Date().getFullYear()} {company.legalName}. All rights reserved.
      </div>
    </footer>
  )
}
