# Sentry Setup Guide

## 1. Create Sentry Account
1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new project (React/Vite)

## 2. Get Your DSN
1. In your Sentry project dashboard
2. Go to Settings → Projects → [Your Project] → Client Keys (DSN)
3. Copy the DSN (looks like: `https://abc123@o123456.ingest.sentry.io/123456`)

## 3. Add Environment Variable
Add to your `.env` file:
```
VITE_SENTRY_DSN=https://your-dsn-here@sentry.io/project-id
```

## 4. Test Error Tracking
The setup is complete! Sentry will now automatically:
- ✅ Capture unhandled errors
- ✅ Track performance metrics
- ✅ Record user sessions (replays)
- ✅ Send alerts for new errors

## 5. Manual Error Reporting
Use in your code:
```typescript
import { captureError, captureMessage, setUserContext } from './lib/sentry';

// Report errors manually
try {
  // risky code
} catch (error) {
  captureError(error, 'payment-processing');
}

// Report custom messages
captureMessage('User completed onboarding', 'info');

// Set user context (in auth store)
setUserContext({ id: user.id, email: user.email });
```

## 6. View Errors
- Go to your Sentry dashboard
- See errors, performance, and user sessions
- Set up alerts for critical errors

## Benefits
- 🚨 **Real-time error alerts**
- 📊 **Performance monitoring** 
- 🎥 **User session replays**
- 📈 **Error trends and patterns**
- 🔍 **Detailed stack traces**
