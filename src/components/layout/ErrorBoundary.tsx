import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Keeps a rendering failure in one module from blanking the whole platform. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[app] unhandled render error', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ error: null })
    window.location.assign('/')
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="surface-card max-w-md p-6 text-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            The application hit an unexpected error. Your saved progress is untouched.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-5 h-11 w-full rounded-xl bg-brand-600 font-semibold text-white transition hover:bg-brand-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }
}
