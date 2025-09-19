// src/lib/analytics.js
// Lightweight analytics shim. Replace `track` with your real analytics call (Amplitude/GA).
export function track(eventName, payload = {}) {
  // TODO: wire this to Amplitude / Segment / GA
  // For now, using Vercel Analytics if available
  if (window && window.va && window.va.track) {
    window.va.track(eventName, payload);
  }
  
  // Fallback to dataLayer for GTM/GA
  if (window && window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...payload });
  }
  
  // Development logging
  if (import.meta.env.DEV) {
    console.info('[track]', eventName, payload);
  }
}

// Track onboarding progress
export function trackOnboardingStep(step, action = 'view') {
  track('onboarding_step', {
    step,
    action,
    timestamp: new Date().toISOString()
  });
}

// Track help center interactions
export function trackHelpCenter(action, data = {}) {
  track('help_center', {
    action,
    ...data,
    timestamp: new Date().toISOString()
  });
}

// Track feature usage for onboarding completion
export function trackFeatureUsage(feature, action = 'use') {
  track('feature_usage', {
    feature,
    action,
    timestamp: new Date().toISOString()
  });
}
