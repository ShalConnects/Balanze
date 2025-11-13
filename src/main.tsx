import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n/index.ts';

// Defer Sentry initialization to reduce initial bundle size and execution time
// Initialize after initial render to avoid blocking critical path
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    import('./lib/sentry').then(({ initSentry }) => {
      initSentry();
    });
  }, { timeout: 2000 });
} else {
  // Fallback for browsers without requestIdleCallback
  setTimeout(() => {
    import('./lib/sentry').then(({ initSentry }) => {
      initSentry();
    });
  }, 100);
}

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
