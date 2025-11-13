// Sentry is loaded dynamically to reduce initial bundle size
// Lazy import Sentry to avoid blocking initial page load
let Sentry: any = null;
let sentryInitialized = false;

// Initialize Sentry (called lazily after initial render)
export async function initSentry() {
  if (sentryInitialized) return;
  
  // Dynamically import Sentry only when needed
  Sentry = await import('@sentry/react');
  
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
  
  sentryInitialized = true;
}

// Helper function to ensure Sentry is loaded
async function ensureSentry() {
  if (!Sentry) {
    Sentry = await import('@sentry/react');
  }
  if (!sentryInitialized) {
    await initSentry();
  }
  return Sentry;
}

// Helper functions for manual error reporting (lazy load Sentry when called)
// Fire-and-forget: don't await to avoid breaking existing code
export const captureError = (error: Error, context?: string) => {
  ensureSentry().then(SentryInstance => {
    SentryInstance.captureException(error, {
      tags: {
        context: context || 'unknown',
      },
    });
  }).catch(() => {
    // Silently fail if Sentry isn't available yet
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  ensureSentry().then(SentryInstance => {
    SentryInstance.captureMessage(message, level);
  }).catch(() => {
    // Silently fail if Sentry isn't available yet
  });
};

export const addBreadcrumb = (message: string, category?: string, level?: 'info' | 'warning' | 'error') => {
  ensureSentry().then(SentryInstance => {
    SentryInstance.addBreadcrumb({
      message,
      category: category || 'user',
      level: level || 'info',
    });
  }).catch(() => {
    // Silently fail if Sentry isn't available yet
  });
};

// Set user context
export const setUserContext = (user: { id: string; email?: string }) => {
  ensureSentry().then(SentryInstance => {
    SentryInstance.setUser({
      id: user.id,
      email: user.email,
    });
  }).catch(() => {
    // Silently fail if Sentry isn't available yet
  });
};

// Clear user context (on logout)
export const clearUserContext = () => {
  if (Sentry) {
    Sentry.setUser(null);
  } else {
    // If Sentry isn't loaded yet, try to load it and then clear
    ensureSentry().then(SentryInstance => {
      SentryInstance.setUser(null);
    }).catch(() => {
      // Silently fail if Sentry isn't available yet
    });
  }
};

export default Sentry;
