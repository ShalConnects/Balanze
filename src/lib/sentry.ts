import * as Sentry from '@sentry/react';

// Initialize Sentry
export function initSentry() {
  // Use your provided DSN or fallback to env variable
  const dsn = "https://9753262d40e8712b9abf19e49ad49b14@o4510187579179008.ingest.us.sentry.io/4510187584946176" || import.meta.env.VITE_SENTRY_DSN;
  
  Sentry.init({
    dsn: dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: import.meta.env.PROD ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Capture unhandled promise rejections
    captureUnhandledRejections: true,
    // Capture uncaught exceptions
    captureUncaughtException: true,
  });
}

// Helper functions for manual error reporting
export const captureError = (error: Error, context?: string) => {
  Sentry.captureException(error, {
    tags: {
      context: context || 'unknown',
    },
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

export const addBreadcrumb = (message: string, category?: string, level?: 'info' | 'warning' | 'error') => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'user',
    level: level || 'info',
  });
};

// Set user context
export const setUserContext = (user: { id: string; email?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
};

// Clear user context (on logout)
export const clearUserContext = () => {
  Sentry.setUser(null);
};

export default Sentry;
