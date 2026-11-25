// The N & T Center gym app, exactly as before. Loaded only for gym tenants.
import { useEffect } from 'react';
import 'react-international-phone/style.css';
import './gym.css';
import App from './GymApp.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { FeedbackProvider } from './components/common/Feedback.jsx';

export default function GymRoot() {
  useEffect(() => { document.title = 'N & T Center Portal'; }, []);
  return (
    <ErrorBoundary page="app">
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </ErrorBoundary>
  );
}
