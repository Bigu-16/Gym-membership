import { Component } from 'react';
import { apiService } from '../../services/api';

/**
 * Keeps one broken screen from blanking the whole app. Shows a recovery message,
 * reports the crash to the server log, and resets when `resetKey` changes (e.g. tab).
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    apiService.reportClientError({
      message: String(error?.message || error).slice(0, 1000),
      stack: error?.stack?.slice(0, 8000) || null,
      component_stack: info?.componentStack?.slice(0, 8000) || null,
      page: this.props.page || null
    });
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      // Navigating elsewhere gives the user a fresh screen.
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="glass-card p-8 max-w-xl mx-auto my-12 text-center space-y-4">
        <h2 className="text-lg font-semibold">Something went wrong on this page</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          The problem has been reported. Your saved data is safe. Try again, or open another page from the menu.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl border border-[var(--glass-border)] text-xs font-bold"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
