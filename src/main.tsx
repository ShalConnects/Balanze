import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n/index.ts';
import { initSentry } from './lib/sentry';

// Initialize Sentry for error tracking
initSentry();

// Register Service Worker to control navigation and prevent pull-to-refresh
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {

      })
      .catch((error) => {

      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
