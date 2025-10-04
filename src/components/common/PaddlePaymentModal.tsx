import React, { useState, useEffect } from 'react';
import { X, CreditCard, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

interface PaddlePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  price: number;
  billingCycle: 'monthly' | 'one-time';
  features: string[];
}

export const PaddlePaymentModal: React.FC<PaddlePaymentModalProps> = ({
  isOpen,
  onClose,
  planId,
  planName,
  price,
  billingCycle,
  features
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paddle, setPaddle] = useState<Paddle | null>(null);

  // Paddle configuration
  const PADDLE_VENDOR_ID = import.meta.env.VITE_PADDLE_VENDOR_ID;
  const PADDLE_ENVIRONMENT = import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox';
  const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;

  useEffect(() => {
    if (isOpen && !paddle) {
      loadPaddle();
    }
  }, [isOpen, paddle]);

  const loadPaddle = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!PADDLE_CLIENT_TOKEN) {
        console.warn('Paddle client token not configured, using fallback method');
        console.log('Environment check:', {
          PADDLE_VENDOR_ID,
          PADDLE_ENVIRONMENT,
          PADDLE_CLIENT_TOKEN: PADDLE_CLIENT_TOKEN ? 'Present' : 'Missing'
        });
        setError('Paddle client token not configured. Please check environment variables in Vercel dashboard.');
        setLoading(false);
        return;
      }

      // Initialize Paddle.js v2
      const paddleInstance = await initializePaddle({
        environment: PADDLE_ENVIRONMENT as 'sandbox' | 'production',
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: (data) => {
          console.log('Paddle event:', data);
          handlePaddleEvent(data);
        }
      });

      if (paddleInstance && paddleInstance.Checkout) {
        console.log('Paddle initialized successfully with checkout capability');
        setPaddle(paddleInstance);
        setLoading(false);
      } else {
        console.warn('Paddle initialized but checkout not available');
        throw new Error('Failed to initialize Paddle with checkout capability');
      }
    } catch (err) {
      console.error('Failed to load Paddle:', err);
      console.log('Falling back to direct URL method');
      
      // Fallback to direct URL approach
      const priceId = getPaddlePriceId();
      const checkoutUrl = `https://checkout.paddle.com/checkout/${priceId}?email=${encodeURIComponent(user?.email || '')}&country=US&vendor=${PADDLE_VENDOR_ID}`;
      window.open(checkoutUrl, '_blank');
      setLoading(false);
      toast.success('Opening Paddle checkout in new tab...');
    }
  };

  const handlePaddleEvent = (data: any) => {
    switch (data.event) {
      case 'checkout.completed':
        handlePaymentSuccess(data);
        break;
      case 'checkout.closed':
        setLoading(false);
        break;
      case 'checkout.error':
        setError('Payment failed. Please try again.');
        setLoading(false);
        break;
    }
  };

  const handlePaymentSuccess = async (data: any) => {
    try {
      setLoading(true);
      
      // Update user subscription in database
      const { error: dbError } = await supabase
        .rpc('upgrade_user_subscription', {
          user_uuid: user?.id,
          plan_name: 'premium',
          payment_method: 'paddle',
          paddle_transaction_id: data.event_data?.transaction_id
        });

      if (dbError) {
        throw dbError;
      }

      toast.success('Payment successful! Your subscription has been upgraded.');
      onClose();
      
      // Refresh the page to show new features
      window.location.reload();
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment verification failed. Please contact support.');
      toast.error('Payment verification failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const openPaddleCheckout = async () => {
    if (!user?.email) {
      setError('User email not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const priceId = getPaddlePriceId();
      const hostedCheckoutUrls: { [key: string]: string } = {
        'premium_monthly': import.meta.env.VITE_PADDLE_MONTHLY_HOSTED_CHECKOUT_URL || '',
        'premium_lifetime': import.meta.env.VITE_PADDLE_LIFETIME_HOSTED_CHECKOUT_URL || ''
      };
      const hostedCheckoutUrl = hostedCheckoutUrls[planId];

      console.log(`🚀 Starting ${PADDLE_ENVIRONMENT} checkout for plan: ${planId}`);
      console.log('User details:', { email: user.email, id: user.id });

      // Strategy 1: Try Paddle.js overlay checkout first (best UX)
      if (paddle && paddle.Checkout) {
        try {
          console.log('🎯 Attempting overlay checkout...');
          
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
              locale: 'en',
              allowLogout: false,
              showAddTaxId: false,
              showAddDiscounts: false
            },
            successUrl: window.location.origin + '/settings?tab=plans-usage&payment=success',
            cancelUrl: window.location.origin + '/settings?tab=plans-usage&payment=cancelled'
          });

          // Handle the checkout promise with timeout
          if (checkoutPromise && typeof checkoutPromise.then === 'function') {
            // Add a timeout to catch hanging promises
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Checkout timeout')), 5000)
            );
            
            await Promise.race([checkoutPromise, timeoutPromise]);
            console.log('✅ Overlay checkout opened successfully');
            setLoading(false);
            toast.success('Checkout opened!');
            return; // Success - exit early
          } else if (checkoutPromise === undefined || checkoutPromise === null) {
            // If checkout returns undefined/null, it might have failed silently
            throw new Error('Checkout returned null/undefined');
          } else {
            console.log('✅ Overlay checkout opened (non-promise)');
            setLoading(false);
            toast.success('Checkout opened!');
            return; // Success - exit early
          }
        } catch (overlayError) {
          console.warn('⚠️ Overlay checkout failed, trying fallback:', overlayError);
          // Continue to fallback strategy
        }
      }

      // Strategy 2: Fallback to hosted checkout URL in new tab
      if (hostedCheckoutUrl) {
        console.log('🔄 Falling back to hosted checkout URL...');
        console.log('Opening URL:', hostedCheckoutUrl);
        
        window.open(hostedCheckoutUrl, '_blank', 'noopener,noreferrer');
        setLoading(false);
        toast.success('Opening secure checkout...');
        return; // Success - exit early
      }

      // Strategy 3: Final fallback - construct URL manually
      console.log('🔄 Using final fallback method...');
      const fallbackUrl = PADDLE_ENVIRONMENT === 'sandbox' 
        ? `https://sandbox-buy.paddle.com/product/${priceId}?email=${encodeURIComponent(user.email)}&country=US`
        : `https://buy.paddle.com/product/${priceId}?email=${encodeURIComponent(user.email)}&country=US`;
      
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      setLoading(false);
      toast.success('Opening checkout...');

    } catch (err) {
      console.error('❌ All checkout methods failed:', err);
      setError('Unable to open checkout. Please try again or contact support.');
      setLoading(false);
    }
  };

  const getPaddlePriceId = () => {
    // Map your plan IDs to Paddle price IDs
    const priceMapping: { [key: string]: string } = {
      'premium_monthly': import.meta.env.VITE_PADDLE_MONTHLY_PRICE_ID,
      'premium_lifetime': import.meta.env.VITE_PADDLE_LIFETIME_PRICE_ID
    };
    
    const priceId = priceMapping[planId] || import.meta.env.VITE_PADDLE_MONTHLY_PRICE_ID;
    return priceId;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Upgrade to {planName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Plan Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {planName} Plan
            </h3>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {formatPrice(price)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              per {billingCycle === 'one-time' ? 'lifetime' : 'month'}
            </div>
            {billingCycle === 'one-time' && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                  Buy it for lifetime access!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            What's included:
          </h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {!paddle ? 'Loading payment system...' : 'Opening secure checkout...'}
              </span>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <div className="space-y-4">
          <button
            onClick={openPaddleCheckout}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Opening checkout...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Continue to Payment
              </>
            )}
          </button>
          
          {/* Payment Method Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Secure checkout • Credit cards accepted • Instant activation
            </p>
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Secure payment powered by Paddle</span>
            </div>
          </div>
        </div>

        {/* Paddle Checkout Container */}
        <div id="checkout-container" className="mt-4"></div>
      </div>
    </div>
  );
};
