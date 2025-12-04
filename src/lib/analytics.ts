// src/lib/analytics.ts
// Lightweight analytics shim. Replace `track` with your real analytics call (Amplitude/GA).
export function track(eventName: string, payload: Record<string, any> = {}) {
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

  }
}

// Track onboarding progress
export function trackOnboardingStep(step: string, action: string = 'view') {
  track('onboarding_step', {
    step,
    action,
    timestamp: new Date().toISOString()
  });
}

// Track help center interactions
export function trackHelpCenter(action: string, data: Record<string, any> = {}) {
  track('help_center', {
    action,
    ...data,
    timestamp: new Date().toISOString()
  });
}

// Track feature usage for onboarding completion
export function trackFeatureUsage(feature: string, action: string = 'use') {
  track('feature_usage', {
    feature,
    action,
    timestamp: new Date().toISOString()
  });
}

