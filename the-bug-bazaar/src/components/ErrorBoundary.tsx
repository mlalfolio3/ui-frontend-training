import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { monitoringLog, reportError } from '../monitoring.ts'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = { error: Error | null }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, info.componentStack ?? '')
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children
    return (
      <section className="fallback" role="alert">
        <h1>Something went wrong</h1>
        <p>This page hit an unexpected error. The team log has the details, and the rest of the shop is still available.</p>
        <pre aria-label="Monitoring log">{monitoringLog.join('\n') || 'Logged just now.'}</pre>
        <Link to="/">Back to the shop</Link>
      </section>
    )
  }
}
