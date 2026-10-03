import { work } from '../content.js'
import { Container, Reveal, Section, SectionHead } from '../ui/index.jsx'
import Ledger from './Ledger.jsx'

// 03 / Selected deployments: a ledger of records, not a card grid (plan §3). Each record opens in place.
export default function Work() {
  return (
    <Section id="work" className="py-24 lg:py-32">
      <Container>
        <SectionHead code="03" label="Deployments" title={work.title} intro={work.intro} />
        <Reveal className="mt-14">
          <Ledger />
        </Reveal>
      </Container>
    </Section>
  )
}
