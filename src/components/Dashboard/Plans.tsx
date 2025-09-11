import React, { useState } from 'react';
import { Check, Star, X, Heart, Zap, Shield, Download, BarChart3, Users, Globe, MessageSquare, Settings, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PayPalPaymentModal } from '../common/PayPalPaymentModal';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'one-time';
  originalPrice?: number;
  discount?: number;
  features: Array<{
    text: string;
    included: boolean;
    icon?: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
  }>;
  isPopular?: boolean;
  description?: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    description: 'Perfect for getting started with basic financial tracking',
    features: [
      { text: 'Basic financial tracking', included: true, icon: BarChart3 },
      { text: 'Up to 5 accounts', included: true, icon: Users },
      { text: '1 currency only', included: true, icon: Globe },
      { text: 'Basic reports', included: true, icon: BarChart3 },
      { text: 'Email support (24-48h response)', included: true, icon: MessageSquare },
      { text: 'Basic purchase tracking', included: true, icon: Download },
      { text: 'Basic analytics', included: true, icon: BarChart3 },
      { text: 'Transaction management', included: true, icon: CreditCard },
      { text: 'Custom categories', included: false, icon: Settings },
      { text: 'Lend & borrow tracking', included: false, icon: Users },
      { text: 'Data export', included: false, icon: Download },
      { text: 'Last Wish - Digital Time Capsule', included: false, icon: Heart, highlight: true },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 7.99,
    currency: 'USD',
    billingCycle: 'monthly',
    originalPrice: 7.99,
    discount: 23,
    description: 'Unlock unlimited features and advanced financial insights',
    features: [
      { text: 'Everything in Free', included: true, icon: Check },
      { text: 'Unlimited accounts', included: true, icon: Users },
      { text: 'Unlimited currencies', included: true, icon: Globe },
      { text: 'Advanced analytics', included: true, icon: BarChart3 },
      { text: 'Priority email support (4-8h response)', included: true, icon: MessageSquare },
      { text: 'Custom categories', included: true, icon: Settings },
      { text: 'Lend & borrow tracking', included: true, icon: Users },
      { text: 'Advanced reporting', included: true, icon: BarChart3 },
      { text: 'Data export (CSV, Excel, PDF)', included: true, icon: Download },
      { text: 'Last Wish - Digital Time Capsule', included: true, icon: Heart, highlight: true },
    ],
    isPopular: true,
  },
];

export const Plans: React.FC = () => {
  const { user, profile } = useAuthStore();
  const currentPlan = profile?.subscription?.plan || 'free';
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'one-time'>('monthly');
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    planId: string;
    planName: string;
    price: number;
    billingCycle: 'monthly' | 'one-time';
    features: string[];
  }>({
    isOpen: false,
    planId: '',
    planName: '',
    price: 0,
    billingCycle: 'monthly',
    features: [],
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Subscription Plans
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Choose the perfect plan for your financial needs
        </p>
        
        {/* Billing Cycle Selector */}
        <div className="mt-6 flex items-center justify-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex w-full max-w-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 px-3 md:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('one-time')}
              className={`flex-1 px-3 md:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                billingCycle === 'one-time'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              One-time
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                Lifetime access
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {plans.map((plan) => (
                      <div
              key={plan.id}
              className={`relative rounded-xl border ${
                plan.isPopular
                  ? 'border-blue-500 shadow-lg dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700 shadow'
              } p-4 md:p-6 transition-all duration-200 hover:shadow-xl bg-white dark:bg-gray-800 flex flex-col h-full`}
            >
                          {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 dark:from-purple-900/50 dark:to-blue-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  <Zap className="w-4 h-4 mr-1" />
                  Recommended
                </span>
              </div>
            )}

              <div className="text-center mb-6">
                <h3 className={`text-lg md:text-xl font-semibold mb-2 ${
                  plan.id === 'premium' 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'
                    : 'text-gray-900 dark:text-white'
                }`}>{plan.name}</h3>
                {plan.description && (
                  <p className={`text-sm mb-4 ${
                    plan.id === 'premium' 
                      ? 'text-purple-700 dark:text-purple-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>{plan.description}</p>
                )}
                <div className="flex items-baseline justify-center">
                  <span className={`text-3xl md:text-4xl font-bold ${
                    plan.id === 'premium' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    ${billingCycle === 'one-time' && plan.id === 'premium' ? '99.99' : plan.price}
                  </span>
                  <span className={`ml-1 text-base md:text-lg ${
                    plan.id === 'premium' 
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>/{billingCycle === 'one-time' ? 'lifetime' : 'month'}</span>
                </div>
                
                {/* Free plan promotional badge */}
                {plan.id === 'free' && (
                  <div className="mt-2 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                      Always Free
                    </span>
                  </div>
                )}
                
                {/* Show lifetime access benefit for one-time Premium */}
                {billingCycle === 'one-time' && plan.id === 'premium' && (
                  <div className="mt-2 text-center">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      ✨ Premium lifetime access - No recurring fees
                    </span>
                  </div>
                )}
                
                {/* First month discount badge - only show for monthly */}
                {plan.id === 'premium' && billingCycle === 'monthly' && (
                  <div className="mt-2 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                      First month 50% off
                    </span>
                  </div>
                )}
              </div>

              <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex items-center flex-1">
                      {feature.icon && (
                        <feature.icon className={`w-4 h-4 mr-2 flex-shrink-0 ${
                          feature.included 
                            ? plan.id === 'premium' 
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-gray-500'
                            : 'text-gray-500'
                        }`} />
                      )}
                      <span 
                        className={`text-sm ${
                          feature.included 
                            ? plan.id === 'premium' 
                              ? 'font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'
                              : 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-500 dark:text-gray-500 line-through'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                    {feature.highlight && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 ml-2">
                        <Heart className="w-3 h-3 mr-1" />
                        Premium
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4 md:pt-6">
                <button
                  onClick={() => {
                    if (currentPlan !== plan.id && plan.id !== 'free') {
                      const planId = billingCycle === 'one-time' ? 'premium_lifetime' : 'premium_monthly';
                      const price = billingCycle === 'one-time' ? 99.99 : 7.99;
                      const features = plan.features
                        .filter(f => f.included)
                        .map(f => f.text);
                      
                      setPaymentModal({
                        isOpen: true,
                        planId,
                        planName: plan.name,
                        price,
                        billingCycle,
                        features,
                      });
                    }
                  }}
                  className={`w-full rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm font-medium transition-colors ${
                    currentPlan === plan.id
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : plan.isPopular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                      : 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600'
                  }`}
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? 'Current Plan' : 'Get Started'}
                </button>
              </div>
            </div>
        ))}
      </div>

      <div className="mt-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            <span className="font-semibold">Premium plan</span> includes a{' '}
            <span className="font-bold text-green-800 dark:text-green-200">14-day free trial</span>. 
            No credit card required.
          </p>
        </div>
        
      </div>

      {/* PayPal Payment Modal */}
      <PayPalPaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
        planId={paymentModal.planId}
        planName={paymentModal.planName}
        price={paymentModal.price}
        billingCycle={paymentModal.billingCycle}
        features={paymentModal.features}
      />
    </div>
  );
}; 