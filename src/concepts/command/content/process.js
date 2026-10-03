import { brief, draft, illustrative } from './wrap.js'

// Station 03 THE LINE (doc 4.5).
//
// The six steps are DRAFT (words from the brief's REQUEST / DISCOVERY / ARCHITECTURE / BUILD /
// DEPLOY / SCALE flow; the sentences are ours). They claim nothing: no digits, no durations, no
// outcomes. The failure beat is ILLUSTRATIVE and always labelled so. content.test.js enforces
// "no digits" over this whole file.

const step = (id, label, parent, sentence) => ({
  id,
  kind: 'method',
  label,
  parent,
  evidence: 'method', // solid, no source claim (doc 5.5)
  src: 'DRAFT',
  draft: true,
  sentence: draft(`${id}.sentence`, sentence),
})

export const processContent = {
  heading: brief('process.heading', 'FROM REQUEST TO PRODUCTION'),
  steps: [
    step('step.request', 'REQUEST', 'core', 'A requirement arrives as a sentence, a document or a screen.'),
    step('step.discovery', 'DISCOVERY', 'step.request', 'We ask until the problem and the constraints are both clear.'),
    step(
      'step.architecture',
      'ARCHITECTURE',
      'step.discovery',
      'Services, data and integrations are drawn before anything is built.',
    ),
    step('step.build', 'BUILD', 'step.architecture', 'Software is built and tested in small, shippable steps.'),
    step('step.deploy', 'DEPLOY', 'step.build', 'It goes to the cloud it will actually run on.'),
    step('step.scale', 'SCALE', 'step.deploy', 'It keeps running, and it keeps changing with the business.'),
  ],
  controls: {
    pause: draft('process.pause', 'PAUSE'),
    replay: draft('process.replay', 'REPLAY'),
  },
  // Step 1 shows what the visitor has picked so far (n is counted in code, never typed here).
  brief: {
    label: draft('process.brief.label', 'YOUR BRIEF'),
    empty: draft('process.brief.empty', '( nothing selected yet )'),
    more: draft('process.brief.more', 'MORE'),
  },
  // Accessible names for the pinned stage. The stops are real buttons in an ordered list.
  a11y: {
    stops: draft('process.a11y.stops', 'Steps from request to production'),
    controls: draft('process.a11y.controls', 'Failure beat controls'),
    pauseHint: draft('process.a11y.pause', 'Pause the failure beat'),
    replayHint: draft('process.a11y.replay', 'Replay the failure beat'),
  },
  // Printed under the stage so a visitor knows what kind of content each part is.
  legendLine: draft('process.legend', 'STEPS: DRAFT · FAILURE BEAT: ILLUSTRATIVE'),
  // The single labelled failure (M09): a check fails once, is retried, passes. Not a client run.
  beat: {
    id: 'process.beat',
    step: 'step.build', // plays on entering this step
    chip: illustrative('process.beat.chip', 'ILLUSTRATIVE · NOT A CLIENT RUN'),
    check: illustrative('process.beat.check', 'CHECK'),
    phases: [
      illustrative('process.beat.fail', 'FAILED'),
      illustrative('process.beat.retry', 'RETRY'),
      illustrative('process.beat.pass', 'PASSED'),
    ],
    // Reduced motion and RAW: the beat is this one sentence.
    reduced: illustrative('process.beat.reduced', 'A check failed once, was retried and passed. Illustrative.'),
    src: 'ILLUSTRATIVE',
  },
}
