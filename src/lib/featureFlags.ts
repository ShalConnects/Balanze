// Feature Flag System for Safe Feature Testing
// Uses import.meta.env (Vite) - process.env.VITE_* is undefined in client builds

const env = import.meta.env;
const isDev = env.DEV;

export const FEATURE_FLAGS = {
  NEW_PAYMENT_SYSTEM: env.VITE_ENABLE_NEW_PAYMENTS === 'true',
  ADVANCED_PAYMENT_ANALYTICS: env.VITE_ENABLE_PAYMENT_ANALYTICS === 'true',
  ADVANCED_ANALYTICS: env.VITE_ENABLE_ADVANCED_ANALYTICS === 'true',
  REAL_TIME_CHARTS: env.VITE_ENABLE_REAL_TIME_CHARTS === 'true',
  MOBILE_OPTIMIZATION: env.VITE_ENABLE_MOBILE_OPT === 'true',
  PWA_FEATURES: env.VITE_ENABLE_PWA === 'true',
  LEND_BORROW_ENHANCED: env.VITE_ENABLE_LEND_BORROW_ENHANCED === 'true',
  INSTALLMENT_TRACKING: env.VITE_ENABLE_INSTALLMENTS === 'true',
  PURCHASE_ATTACHMENTS: env.VITE_ENABLE_PURCHASE_ATTACHMENTS === 'true',
  PURCHASE_CATEGORIES: env.VITE_ENABLE_PURCHASE_CATEGORIES === 'true',
  SAVINGS_GOALS_ENHANCED: env.VITE_ENABLE_SAVINGS_ENHANCED === 'true',
  DONATION_TRACKING: env.VITE_ENABLE_DONATION_TRACKING === 'true',
  DARK_MODE: env.VITE_ENABLE_DARK_MODE === 'true',
  ANIMATIONS: env.VITE_ENABLE_ANIMATIONS === 'true',
  DEBUG_MODE: isDev,
  TEST_FEATURES: isDev,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURE_FLAGS[feature];
};

export const isFeatureDisabled = (feature: FeatureFlag): boolean => {
  return !FEATURE_FLAGS[feature];
};

// Simple conditional rendering helper
export const renderWithFeatureFlag = (
  feature: FeatureFlag,
  enabledComponent: React.ReactNode,
  disabledComponent?: React.ReactNode
): React.ReactNode => {
  if (isFeatureEnabled(feature)) {
    return enabledComponent;
  }
  
  return disabledComponent || null;
};

// Helper for gradual rollout (percentage-based)
export const isFeatureEnabledForUser = (
  feature: FeatureFlag,
  userId?: string
): boolean => {
  if (!isFeatureEnabled(feature)) {
    return false;
  }
  
  // For gradual rollout, you can implement user-based logic here
  // Example: Enable for 10% of users
  if (userId) {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const percentage = Math.abs(hash) % 100;
    
    // Enable for first 10% of users
    if (percentage < 10) {
      return true;
    }
  }
  
  return false;
};

// Feature flag management for development
export const getFeatureFlagsStatus = () => {
  return Object.entries(FEATURE_FLAGS).map(([key, value]) => ({
    feature: key,
    enabled: value,
  }));
};

// Environment-specific defaults
export const getDefaultFeatureFlags = () => {
  const isStaging = import.meta.env.VITE_ENVIRONMENT === 'staging';
  
  return {
    ...(isDev && {
      NEW_PAYMENT_SYSTEM: true,
      ADVANCED_ANALYTICS: true,
      MOBILE_OPTIMIZATION: true,
      LEND_BORROW_ENHANCED: true,
      PURCHASE_ATTACHMENTS: true,
      SAVINGS_GOALS_ENHANCED: true,
      DARK_MODE: true,
      ANIMATIONS: true,
    }),
    
    // Staging: Enable features for pre-production testing
    ...(isStaging && {
      NEW_PAYMENT_SYSTEM: true,
      ADVANCED_ANALYTICS: true,
      MOBILE_OPTIMIZATION: true,
      LEND_BORROW_ENHANCED: true,
      PURCHASE_ATTACHMENTS: true,
      SAVINGS_GOALS_ENHANCED: true,
      DARK_MODE: true,
      ANIMATIONS: true,
    }),
    
    // Production: Disable experimental features by default
    ...(import.meta.env.PROD && {
      NEW_PAYMENT_SYSTEM: false,
      ADVANCED_ANALYTICS: false,
      MOBILE_OPTIMIZATION: false,
      LEND_BORROW_ENHANCED: false,
      PURCHASE_ATTACHMENTS: false,
      SAVINGS_GOALS_ENHANCED: false,
      DARK_MODE: false,
      ANIMATIONS: true, // Keep animations enabled
    }),
  };
}; 

