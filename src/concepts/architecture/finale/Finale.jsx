import { Sheet, SheetHeader } from '../ui/Sheet.jsx'
import ConvergeStage from './ConvergeStage.jsx'
import Statement from './Statement.jsx'
import TitleBlock from './TitleBlock.jsx'
import './finale.css'

// Sheet 07, "Final statement" (BRIEF §7 and §14), on the navy band, in three parts:
//   the converge stage   the exploded model compresses into the X mark; ARCHITECT, ENGINEER, DEPLOY, XIONTECHS
//   the statement        "Good products start with good architecture." and "Get IT Done." with the call to action
//   the title block      the footer, as the title block of a drawing sheet: About, Contact (id="contact"), revision
export default function Finale() {
  return (
    <Sheet id="about" band="navy" labelledBy="finale-title">
      <div className="bp-wrap pt-12">
        <SheetHeader id="about" />
      </div>
      <ConvergeStage />
      <Statement />
      <TitleBlock />
    </Sheet>
  )
}
