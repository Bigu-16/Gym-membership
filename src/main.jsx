import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { FeedbackProvider } from './components/common/Feedback.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary page="app">
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </ErrorBoundary>
  </StrictMode>,
)
