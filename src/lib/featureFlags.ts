// Feature Flag System for Safe Feature Testing
// This allows multiple developers to work on different features simultaneously
// and test new features without affecting live users

export const FEATURE_FLAGS = {
  // Payment System Features
  NEW_PAYMENT_SYSTEM: process.env.VITE_ENABLE_NEW_PAYMENTS === 'true',
  ADVANCED_PAYMENT_ANALYTICS: process.env.VITE_ENABLE_PAYMENT_ANALYTICS === 'true',
  
  // Analytics Features
  ADVANCED_ANALYTICS: process.env.VITE_ENABLE_ADVANCED_ANALYTICS === 'true',
  REAL_TIME_CHARTS: process.env.VITE_ENABLE_REAL_TIME_CHARTS === 'true',
  
  // Mobile Features
  MOBILE_OPTIMIZATION: process.env.VITE_ENABLE_MOBILE_OPT === 'true',
  PWA_FEATURES: process.env.VITE_ENABLE_PWA === 'true',
  
  // Lend/Borrow Features
  LEND_BORROW_ENHANCED: process.env.VITE_ENABLE_LEND_BORROW_ENHANCED === 'true',
  INSTALLMENT_TRACKING: process.env.VITE_ENABLE_INSTALLMENTS === 'true',
  
  // Purchase Features
  PURCHASE_ATTACHMENTS: process.env.VITE_ENABLE_PURCHASE_ATTACHMENTS === 'true',
  PURCHASE_CATEGORIES: process.env.VITE_ENABLE_PURCHASE_CATEGORIES === 'true',
  
  // Savings Features
  SAVINGS_GOALS_ENHANCED: process.env.VITE_ENABLE_SAVINGS_ENHANCED === 'true',
  DONATION_TRACKING: process.env.VITE_ENABLE_DONATION_TRACKING === 'true',
  
  // UI/UX Features
  DARK_MODE: process.env.VITE_ENABLE_DARK_MODE === 'true',
  ANIMATIONS: process.env.VITE_ENABLE_ANIMATIONS === 'true',
  
  // Development Features (always enabled in development)
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  TEST_FEATURES: process.env.NODE_ENV === 'development',
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
  const isDev = process.env.NODE_ENV === 'development';
  const isStaging = process.env.VITE_ENVIRONMENT === 'staging';
  
  return {
    // Development: Enable all features for testing
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
    ...(process.env.NODE_ENV === 'production' && {
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

