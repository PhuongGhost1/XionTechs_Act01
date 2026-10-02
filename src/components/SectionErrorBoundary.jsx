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
        <div role="status" className="rounded-2xl border border-line bg-surface p-8 text-sm text-muted">
          The interactive demo couldn&rsquo;t load. Reload the page to try again.
        </div>
      )
    }
    return this.props.children
  }
}
