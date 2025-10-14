import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: string;
  features: any;
}

interface SubscriptionStatus {
  plan: string;
  status: string;
  isActive: boolean;
  daysRemaining: number;
  features: any;
}

export const SubscriptionManager: React.FC = () => {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Load available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Load current subscription status
      if (user) {
        const { data: statusData, error: statusError } = await supabase
          .rpc('check_subscription_status', { user_uuid: user.id });

        if (statusError) throw statusError;
        setCurrentSubscription(statusData);
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (planName: string) => {
    if (!user) return;

    try {
      setUpgrading(true);
      
      const { data, error } = await supabase
        .rpc('upgrade_user_subscription', {
          user_uuid: user.id,
          plan_name: planName,
          payment_method: 'stripe' // You can integrate with Stripe later
        });

      if (error) throw error;

      if (data) {
        // Reload subscription data
        await loadSubscriptionData();
        alert('Subscription upgraded successfully!');
      }
    } catch (error) {

      alert('Failed to upgrade subscription. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    return currentSubscription?.features?.[feature] ? '✅' : '❌';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Subscription Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Choose the plan that best fits your needs
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Current Plan: {currentSubscription.plan.charAt(0).toUpperCase() + currentSubscription.plan.slice(1)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentSubscription.isActive ? 'Active' : 'Inactive'}
              </div>
              <div className="text-sm text-gray-500">Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentSubscription.daysRemaining > 0 ? currentSubscription.daysRemaining : '∞'}
              </div>
              <div className="text-sm text-gray-500">Days Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {currentSubscription.plan === 'premium' ? 'Premium' : 'Free'}
              </div>
              <div className="text-sm text-gray-500">Plan Type</div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 ${
              currentSubscription?.plan === plan.name
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
              </h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                ${plan.price}
                <span className="text-lg text-gray-500">/{plan.billing_cycle}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{plan.description}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span>Maximum Accounts</span>
                <span className="font-semibold">
                  {plan.features.max_accounts === -1 ? 'Unlimited' : plan.features.max_accounts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Maximum Transactions</span>
                <span className="font-semibold">
                  {plan.features.max_transactions === -1 ? 'Unlimited' : plan.features.max_transactions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Advanced Analytics</span>
                <span>{plan.features.analytics ? '✅' : '❌'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Priority Support</span>
                <span>{plan.features.priority_support ? '✅' : '❌'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Data Export</span>
                <span>{plan.features.export_data ? '✅' : '❌'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Advanced Charts</span>
                <span>{plan.features.advanced_charts ? '✅' : '❌'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Custom Categories</span>
                <span>{plan.features.custom_categories ? '✅' : '❌'}</span>
              </div>
            </div>

            <button
              onClick={() => upgradeSubscription(plan.name)}
              disabled={upgrading || currentSubscription?.plan === plan.name}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                currentSubscription?.plan === plan.name
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {upgrading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Upgrading...
                </span>
              ) : currentSubscription?.plan === plan.name ? (
                'Current Plan'
              ) : (
                'Upgrade Now'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}; 

