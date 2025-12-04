import React from 'react';
import { Plans } from './Plans';
import { useAuthStore } from '../../store/authStore';

interface PlansAndUsageProps {
  hideTitle?: boolean;
}

export const PlansAndUsage: React.FC<PlansAndUsageProps> = ({ hideTitle = false }) => {
  const { profile } = useAuthStore();

  // Check if user is on free plan
  const isFreeUser = !profile?.subscription?.plan || profile?.subscription?.plan === 'free';

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plans & Usage</h2>
        </div>
      )}

      {/* Available Plans Section */}
      <div>
        <Plans />
      </div>
    </div>
  );
};

