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
// Skip service worker registration in Capacitor apps (Android/iOS) to avoid conflicts
// Unregister immediately if in Capacitor, don't wait for load event
if ('serviceWorker' in navigator) {
  // Check if we're in a Capacitor app immediately
  const isCapacitor = (window as any).Capacitor || (window as any).CapacitorWeb;
  
  if (isCapacitor) {
    console.log('[Service Worker] Skipped - running in Capacitor app');
    // Unregister any existing service workers immediately
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then(() => {
          console.log('[Service Worker] Unregistered existing service worker');
        });
      }
    });
  } else {
    // Only register in web browsers
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[Service Worker] Registered successfully');
        })
        .catch((error) => {
          console.error('[Service Worker] Registration failed:', error);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
