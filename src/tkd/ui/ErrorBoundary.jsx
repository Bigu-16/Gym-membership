import { Component } from 'react';
import { api } from '../lib/api';
import { I18nContext } from '../i18n/context';

/** Keeps one broken screen from blanking the app; reports the crash to the server log. */
export default class ErrorBoundary extends Component {
  static contextType = I18nContext;

  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    api.reportClientError({
      message: String(error?.message || error).slice(0, 1000),
      stack: error?.stack?.slice(0, 8000) || null,
      component_stack: info?.componentStack?.slice(0, 8000) || null,
      page: this.props.page || window.location.hash || null,
    });
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const t = this.context?.t || ((k) => k);
    return (
      <div role="alert" className="mx-auto my-12 max-w-xl rounded-xl border border-crit-strong bg-white p-8 text-center">
        <h2 className="text-xl font-bold text-ink">{t('errors.crashTitle')}</h2>
        <p className="mt-2 text-muted">{t('errors.crashText')}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button type="button" className="min-h-[48px] rounded-lg bg-brand px-5 font-semibold text-white" onClick={() => this.setState({ error: null })}>
            {t('common.retry')}
          </button>
          <button type="button" className="min-h-[48px] rounded-lg border border-brand px-5 font-semibold text-brand" onClick={() => window.location.reload()}>
            {t('errors.reload')}
          </button>
        </div>
      </div>
    );
  }
}
