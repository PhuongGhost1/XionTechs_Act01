import { createRoot } from 'react-dom/client'
import '../command.css'
import { CoreFigure } from './CoreFigure.jsx'

// DEV ONLY harness for the figures (not part of any build input): every layout at the sizes the
// stations use, on the page ground. Open /src/concepts/command/core/preview.html. ?active=1 lights an arm.
const q = new URLSearchParams(location.search)
const active = q.has('active') ? Number(q.get('active')) : undefined

const Cell = ({ title, w, h, children }) => (
  <div className="flex flex-col gap-2">
    <p className="font-mono text-label uppercase text-ink3">{title}</p>
    <div style={{ width: w, height: h }} className="relative border border-dashed border-hair">
      {children}
    </div>
  </div>
)

function Preview() {
  return (
    <div className="bg-dots min-h-screen p-8">
      <div className="flex flex-wrap gap-8">
        <Cell title="x 280 (hero)" w={280} h={280}>
          <CoreFigure layout="x" active={active} />
        </Cell>
        <Cell title="x 560 (2x)" w={560} h={560}>
          <CoreFigure layout="x" active={active} />
        </Cell>
        <Cell title="arms 300 active 1" w={300} h={300}>
          <CoreFigure layout="arms" active={1} />
        </Cell>
        <Cell title="arms 300 active 3" w={300} h={300}>
          <CoreFigure layout="arms" active={3} />
        </Cell>
        <Cell title="arms 300 no active" w={300} h={300}>
          <CoreFigure layout="arms" />
        </Cell>
        <Cell title="x 160 (phone)" w={160} h={160}>
          <CoreFigure layout="x" />
        </Cell>
        <Cell title="line 640x120" w={640} h={120}>
          <CoreFigure layout="line" />
        </Cell>
        <Cell title="line 320x100" w={320} h={100}>
          <CoreFigure layout="line" />
        </Cell>
        <Cell title="field 640x400" w={640} h={400}>
          <CoreFigure layout="field" />
        </Cell>
        <Cell title="mark 320" w={320} h={320}>
          <CoreFigure layout="mark" />
        </Cell>
        <Cell title="mark 160" w={160} h={160}>
          <CoreFigure layout="mark" />
        </Cell>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Preview />)

export { Preview }
