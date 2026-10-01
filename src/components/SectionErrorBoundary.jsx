import { Component } from 'react'

// Keeps a failed lazy chunk (offline, stale deploy) from blanking the whole page.
export default class SectionErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <section id="demo" className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm text-muted">The interactive demo couldn't load. Please reload the page.</p>
        </section>
      )
    }
    return this.props.children
  }
}
