import React from 'react';
import { isFeatureEnabled, renderWithFeatureFlag, isFeatureEnabledForUser } from '../../lib/featureFlags';

// Example of how to use feature flags in components
const FeatureFlagExample: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Feature Flag Examples</h2>
      
      {/* Method 1: Simple conditional rendering */}
      {isFeatureEnabled('DARK_MODE') && (
        <div className="bg-gray-800 text-white p-4 rounded mb-4">
          Dark mode is enabled
        </div>
      )}
      
      {/* Method 2: Using renderWithFeatureFlag helper */}
      {renderWithFeatureFlag(
        'ADVANCED_ANALYTICS',
        <div className="bg-blue-100 p-4 rounded mb-4">
          Advanced analytics feature is enabled
        </div>,
        <div className="bg-gray-100 p-4 rounded mb-4">
          Advanced analytics feature is disabled
        </div>
      )}
      
      {/* Method 3: Conditional component rendering */}
      {isFeatureEnabled('NEW_PAYMENT_SYSTEM') ? (
        <NewPaymentSystem />
      ) : (
        <OldPaymentSystem />
      )}
      
      {/* Method 4: Gradual rollout example */}
      {isFeatureEnabledForUser('MOBILE_OPTIMIZATION', 'user123') && (
        <div className="bg-green-100 p-4 rounded mb-4">
          Mobile optimization enabled for this user
        </div>
      )}
    </div>
  );
};

// Example components
const NewPaymentSystem: React.FC = () => (
  <div className="bg-green-100 p-4 rounded mb-4">
    <h3 className="font-bold">New Payment System</h3>
    <p>This is the new payment system with enhanced features.</p>
  </div>
);

const OldPaymentSystem: React.FC = () => (
  <div className="bg-yellow-100 p-4 rounded mb-4">
    <h3 className="font-bold">Old Payment System</h3>
    <p>This is the stable payment system.</p>
  </div>
);

export default FeatureFlagExample; 

