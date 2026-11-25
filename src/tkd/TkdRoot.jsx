// The taekwondo club app. Loaded only for taekwondo tenants.
import './tkd.css';
import App from './App.jsx';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import { ToastProvider } from './ui/toast.jsx';
import ErrorBoundary from './ui/ErrorBoundary.jsx';

export default function TkdRoot() {
  return (
    <I18nProvider>
      <ToastProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ToastProvider>
    </I18nProvider>
  );
}
