import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import { ToastProvider } from './ui/toast.jsx';
import ErrorBoundary from './ui/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <ToastProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ToastProvider>
    </I18nProvider>
  </StrictMode>,
);
