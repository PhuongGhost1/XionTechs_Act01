import { LIVE_SITE, brief, draft, live } from './wrap.js'

// Station 01 PREMISE (doc 4.3). The claim, the plain paragraph, and the one sourced company fact.

export const premise = {
  // BRIEF section 1: "turns requirements into production systems".
  statement: brief('premise.statement', 'We turn requirements into production systems.'),
  // DRAFT: built only from the eight confirmed services.
  paragraph: draft(
    'premise.paragraph',
    'XionTechs is an engineering and AI team. We build custom software, intelligent systems and cloud platforms, co-create products with our clients, and provide staffing services.',
  ),
  // FACT from the live site. The wording is about the leadership team, not the company's age,
  // and the chip must keep "leadership team" so it is not read otherwise (open question 10).
  claim: live('premise.claim', '25+ years of leadership experience across our leadership team.', {
    chip: live('premise.claim.chip', `LIVE · xiontechs.com · captured ${LIVE_SITE.replace('live-site ', '')}`),
  }),
}
