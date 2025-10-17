import React, { useState, useEffect } from 'react';
import { Check, Heart, Zap, Download, BarChart3, Users, Globe, MessageSquare, Settings, CreditCard, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { toast } from 'react-hot-toast';
import { DowngradeConfirmationModal } from '../common/DowngradeConfirmationModal';
import { supabase } from '../../lib/supabase';

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
      { text: 'Up to 3 accounts', included: true, icon: Users },
      { text: '1 currency only', included: true, icon: Globe },
      { text: '25 transactions per month', included: true, icon: CreditCard },
      { text: '50 purchases (lifetime)', included: true, icon: Download },
      { text: 'Basic reports', included: true, icon: BarChart3 },
      { text: 'Email support (24-48h response)', included: true, icon: MessageSquare },
      { text: 'Basic analytics', included: true, icon: BarChart3 },
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
      { text: 'Unlimited transactions', included: true, icon: CreditCard },
      { text: 'Unlimited purchases', included: true, icon: Download },
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
  const { profile, user } = useAuthStore();
  const currentPlan = profile?.subscription?.plan || 'free';
  const isLifetimeSubscriber = profile?.subscription?.billing_cycle === 'lifetime' || profile?.subscription?.billing_cycle === 'one-time';
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'one-time'>('monthly');
  const [loading, setLoading] = useState<string | null>(null); // Track which button is loading
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);

  // Paddle configuration
  const PADDLE_VENDOR_ID = import.meta.env.VITE_PADDLE_VENDOR_ID;
  const PADDLE_ENVIRONMENT = import.meta.env.VITE_PADDLE_ENVIRONMENT || 'production';
  const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;

  useEffect(() => {
    loadPaddle();
  }, []);

  const loadPaddle = async () => {
    try {
      if (!PADDLE_CLIENT_TOKEN) {

        return;
      }

      const paddleInstance = await initializePaddle({
        environment: PADDLE_ENVIRONMENT as 'sandbox' | 'production',
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: (data) => {

        }
      });

      if (paddleInstance && paddleInstance.Checkout) {

        setPaddle(paddleInstance);
      }
    } catch (err) {

    }
  };

  const handleDowngradeToFree = () => {
    if (!user?.email) {
      toast.error('Please log in to continue');
      return;
    }

    setShowDowngradeModal(true);
  };

  const confirmDowngrade = async () => {
    setLoading('free');
    setShowDowngradeModal(false);

    try {


      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // For lifetime subscribers, request immediate downgrade

      
      const { data, error } = await supabase.rpc('downgrade_user_subscription', {
        user_uuid: user.id,
        is_lifetime: isLifetimeSubscriber
      });



      if (error) {

        throw error;
      }

      const status = data?.status as 'immediate' | 'scheduled' | 'error' | undefined;


      if (status === 'immediate') {
        toast.success('Downgrade to Free plan completed. Changes have taken effect immediately.');
        // Reload to refresh profile state
        setLoading(null);
        window.location.reload();
        return;
      }

      if (status === 'scheduled') {

        const effective = data?.effective_date ? new Date(data.effective_date) : null;
        const when = effective ? effective.toLocaleString() : 'the end of your current billing period';

        toast.success(`Downgrade to Free plan initiated. Changes will take effect at ${when}.`);
        setLoading(null);
        return;
      }

      toast.success('Downgrade request submitted.');
      setLoading(null);
    } catch (err) {

      toast.error('Unable to process downgrade. Please contact support.');
      setLoading(null);
    }
  };

  const cancelDowngrade = () => {
    setShowDowngradeModal(false);
    toast.info('Downgrade cancelled.');
  };

  const openDirectCheckout = async (planId: string, planName: string) => {
    if (!user?.email) {
      toast.error('Please log in to continue');
      return;
    }

    setLoading(planId);

    try {
      const priceMapping: { [key: string]: string } = {
        'premium_monthly': import.meta.env.VITE_PADDLE_MONTHLY_PRICE_ID,
        'premium_lifetime': import.meta.env.VITE_PADDLE_LIFETIME_PRICE_ID
      };
      
      const hostedCheckoutUrls: { [key: string]: string } = {
        'premium_monthly': import.meta.env.VITE_PADDLE_MONTHLY_HOSTED_CHECKOUT_URL || '',
        'premium_lifetime': import.meta.env.VITE_PADDLE_LIFETIME_HOSTED_CHECKOUT_URL || ''
      };

      const priceId = priceMapping[planId];
      const hostedCheckoutUrl = hostedCheckoutUrls[planId];



      // Strategy 1: Try Paddle.js overlay checkout first
      if (paddle && paddle.Checkout) {
        try {

          
          const checkoutPromise = paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customer: {
              email: user.email,
              country: 'US'
            },
            customData: {
              user_id: user.id,
              plan_id: planId,
              billing_cycle: billingCycle
            },
            settings: {
              displayMode: 'overlay',
              theme: 'light',
              locale: 'en'
            },
            successUrl: window.location.origin + '/settings?tab=plans-usage&payment=success',
            cancelUrl: window.location.origin + '/settings?tab=plans-usage&payment=cancelled'
          });

          // Handle with timeout
          if (checkoutPromise && typeof checkoutPromise.then === 'function') {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Checkout timeout')), 5000)
            );
            
            await Promise.race([checkoutPromise, timeoutPromise]);

            setLoading(null);
            toast.success('Checkout opened!');
            return;
          } else if (checkoutPromise === undefined || checkoutPromise === null) {
            throw new Error('Checkout returned null/undefined');
          } else {

            setLoading(null);
            toast.success('Checkout opened!');
            return;
          }
        } catch (overlayError) {

        }
      }

      // Strategy 2: Fallback to hosted checkout URL in new tab
      if (hostedCheckoutUrl) {

        window.open(hostedCheckoutUrl, '_blank', 'noopener,noreferrer');
        setLoading(null);
        toast.success('Opening secure checkout...');
        return;
      }

      // Strategy 3: Final fallback

      const fallbackUrl = `https://buy.paddle.com/product/${priceId}?email=${encodeURIComponent(user.email)}&country=US`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      setLoading(null);
      toast.success('Opening checkout...');

    } catch (err) {

      toast.error('Unable to open checkout. Please try again.');
      setLoading(null);
    }
  };

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
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex w-full max-w-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('one-time')}
              className={`flex-1 px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => (
                      <div
              key={plan.id}
              data-plan={plan.id}
              className={`relative rounded-xl border ${
                plan.isPopular
                  ? 'border-blue-500 shadow-lg dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700 shadow'
              } p-4 lg:p-5 transition-all duration-200 hover:shadow-xl bg-white dark:bg-gray-800 flex flex-col h-full`}
            >
                          {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 dark:from-purple-900/50 dark:to-blue-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  <Zap className="w-4 h-4 mr-1" />
                  Recommended
                </span>
              </div>
            )}

              <div className="text-center mb-5">
                <h3 className={`text-lg lg:text-xl font-semibold mb-2 ${
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
                  <span className={`text-2xl lg:text-3xl font-bold ${
                    plan.id === 'premium' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    ${billingCycle === 'one-time' && plan.id === 'premium' ? '199.99' : plan.price}
                  </span>
                  <span className={`ml-1 text-sm lg:text-base ${
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

              <ul className="space-y-2 lg:space-y-2.5 mb-4 lg:mb-5 flex-1">
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
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4 lg:pt-5">
                <button
                  onClick={() => {
                    if (currentPlan !== plan.id) {
                      if (plan.id === 'free' && !isLifetimeSubscriber) {
                        // Handle downgrade to free plan (only for monthly subscribers)
                        handleDowngradeToFree();
                      } else if (plan.id !== 'free') {
                        // Handle upgrade to premium
                        const planId = billingCycle === 'one-time' ? 'premium_lifetime' : 'premium_monthly';
                        openDirectCheckout(planId, plan.name);
                      }
                    }
                  }}
                  className={`w-full rounded-lg px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    currentPlan === plan.id
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : plan.id === 'free' && currentPlan === 'premium' && !isLifetimeSubscriber
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-800'
                      : plan.id === 'free' && currentPlan === 'premium' && isLifetimeSubscriber
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : plan.isPopular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                      : 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600'
                  }`}
                  disabled={currentPlan === plan.id || (plan.id === 'free' && isLifetimeSubscriber) || loading === (plan.id === 'free' ? 'free' : (billingCycle === 'one-time' ? 'premium_lifetime' : 'premium_monthly'))}
                >
                  {loading === (plan.id === 'free' ? 'free' : (billingCycle === 'one-time' ? 'premium_lifetime' : 'premium_monthly')) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {plan.id === 'free' ? 'Processing...' : 'Opening...'}
                    </>
                  ) : currentPlan === plan.id ? (
                    'Current Plan'
                  ) : plan.id === 'free' && currentPlan === 'premium' && isLifetimeSubscriber ? (
                    'Lifetime Access'
                  ) : plan.id === 'free' && currentPlan === 'premium' && !isLifetimeSubscriber ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Downgrade to Free
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Get Started
                    </>
                  )}
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

      {/* Downgrade Confirmation Modal */}
      <DowngradeConfirmationModal
        isOpen={showDowngradeModal}
        onClose={cancelDowngrade}
        onConfirm={confirmDowngrade}
        isLoading={loading === 'free'}
        isLifetimeSubscriber={isLifetimeSubscriber}
      />

    </div>
  );
}; 

