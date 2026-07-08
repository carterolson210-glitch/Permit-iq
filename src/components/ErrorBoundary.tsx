import { Component, type ReactNode } from 'react'
import { logClientError } from '../lib/monitor'

type Props = { children: ReactNode }
type State = { hasError: boolean }

// Last-resort boundary: a render crash anywhere below shows a friendly
// recovery screen (and reports the error) instead of a blank white page.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    logClientError('render_crash', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="text-2xl font-bold text-blue-700">PermitIQ</div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Something went wrong on this page
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          The error has been reported automatically. Reloading usually fixes it — your
          account and scans are unaffected.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-800 transition"
        >
          Reload page
        </button>
      </div>
    )
  }
}
